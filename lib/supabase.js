// lib/supabase.js - المكتبة المركزية - مصلح 100% - بلا 961 - بلا select('*')
import { createClient } from '@supabase/supabase-js';

let supabaseInstance = null;
export function getSupabase() {
  if (supabaseInstance) return supabaseInstance;
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const url = rawUrl?.replace('/rest/v1','').replace(/\/$/,'');
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase URL or KEY");
  supabaseInstance = createClient(url, key, { auth: { persistSession: false } });
  return supabaseInstance;
}

export const CACHEABLE_TABLES = ['products', 'stores', 'areas', 'categories'];
export const NO_CACHE_TABLES = ['users', 'customers', 'bot_sessions', 'cart', 'messages', 'order_requuest', 'rate_limits'];

const cache = new Map();
export function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.ts > 5 * 60 * 1000) { cache.delete(key); return null; }
  return item.data;
}
export function setCached(key, data) { cache.set(key, { data, ts: Date.now() }); }

// ===== تنضيف الرقم - بلا 961 - نفس cart و login =====
export function cleanPhone(phone) {
  if (!phone) return null;
  const phoneStr = String(phone).trim();
  if (!phoneStr) return null;
  const phoneNoZero = phoneStr.replace(/^0+/, '');
  return { phoneStr, phoneNoZero: phoneNoZero || phoneStr };
}

// للتوافق - بيرجع phoneStr بس - ما بيزيد 961
export function normalizePhone(phone) {
  const c = cleanPhone(phone);
  return c ? c.phoneStr : null;
}

export function getLast8(phone) {
  const c = cleanPhone(phone);
  if (!c) return null;
  return (c.phoneNoZero || c.phoneStr).slice(-8);
}

const USER_COLUMNS = '"User ID", "Customer ID", "Name", "Mobile", "WhatsApp Number", "Role", "Store ID", "Area", "Status", "Active", "Gender", "Assigned Persona", "AcceptedTerms", "Taxi_ID", taxi, "PIN", "failedAttempts", "isLocked"';

export async function getUserByWhatsAppNumber(phone) {
  const supabase = getSupabase();
  const c = cleanPhone(phone);
  if (!c) return null;
  
  const { phoneStr, phoneNoZero } = c;
  
  // FIXED - query وحدة + Index - بلا loop و بلا ilike
  const orFilter = `Mobile.eq.${phoneStr},Mobile.eq.${phoneNoZero},WhatsApp Number.eq.${phoneStr},WhatsApp Number.eq.${phoneNoZero}`;
  
  const { data } = await supabase
   .from('users')
   .select(USER_COLUMNS)
   .or(orFilter)
   .limit(1)
   .maybeSingle();

  if (data) return mapUserRow(data);
  return null;
}

export async function getUserByMobile(phone) {
  return getUserByWhatsAppNumber(phone);
}

function mapUserRow(row) {
  return {
    userId: row["User ID"] || "",
    customerId: String(row["Customer ID"] || "").trim(),
    name: row["Name"] || "",
    mobile: row["Mobile"] || "",
    whatsappNumber: row["WhatsApp Number"] || "",
    role: row["Role"] || "",
    storeId: row["Store ID"] || "",
    area: row["Area"] || "",
    status: row["Status"] || "",
    active: row["Active"] || "",
    gender: String(row["Gender"] || "").toLowerCase().trim(),
    assignedPersona: String(row["Assigned Persona"] || "").toLowerCase().trim(),
    acceptedTerms: row["AcceptedTerms"] || "",
    taxiId: row["Taxi_ID"] || null,
    taxi: row.taxi || null, // <-- هيدا كان ناقص
    pin: row["PIN"] || "",
    failedAttempts: row["failedAttempts"] || "0",
    isLocked: row["isLocked"] || "FALSE",
  };
}

export async function getCustomerRowByPhone(phone, customerId) {
  const supabase = getSupabase();
  const c = cleanPhone(phone);

  if (customerId && String(customerId).trim() !== "") {
    const { data } = await supabase.from('customers').select('"Customer ID", "Mobile", "Name"').eq('Customer ID', String(customerId).trim()).maybeSingle();
    if (data) return data;
  }

  if (c) {
    const { data } = await supabase.from('customers').select('"Customer ID", "Mobile", "Name"').or(`Mobile.eq.${c.phoneStr},Mobile.eq.${c.phoneNoZero}`).maybeSingle();
    if (data) return data;
  }
  return null;
}

export function isCustomer(user) {
  if (!user) return false;
  const cid = String(user.customerId || "").trim();
  if (!cid) return false;
  if (cid.toLowerCase() === "null") return false;
  return true;
}

export function canOpenBot2(user) {
  return isCustomer(user);
}

export async function getCachedTable(table, columns = null) {
  let cols = columns;
  if (!cols) {
    if (table === 'products') cols = '"Product ID", "Product Name", "Price", "Store ID", "Available", "Active", "Unit", "Description"';
    else if (table === 'stores') cols = '"Store ID", "Store Name", "Adress", "Area", "Open Time", "Close Time"';
    else if (table === 'areas') cols = '"Area ID", "Area Name"';
    else if (table === 'categories') cols = '"Category ID", "Category Name"';
    else cols = '"id", "name"';
  }
  const cacheKey = `${table}:${cols}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;
  const supabase = getSupabase();
  const { data, error } = await supabase.from(table).select(cols);
  if (error) throw error;
  if (CACHEABLE_TABLES.includes(table)) setCached(cacheKey, data);
  return data;
}
