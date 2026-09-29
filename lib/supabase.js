// lib/supabase.js - المكتبة المركزية - مصلح 100% - بدون select('*')
// هيدي بتوحد كل getSupabase المكررين 15 مرة
import { createClient } from '@supabase/supabase-js';

// ===== SINGLETON - مرة وحدة بس =====
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

// ===== تنظيم الكاش - ثابت vs متحرك =====
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

// ===== تنضيف الرقم - مرة وحدة بس =====
export function normalizePhone(phone) {
  if (!phone) return null;
  let digits = String(phone).replace(/\D/g, '');
  digits = digits.replace(/^0+/, '');
  if (digits.startsWith('961')) return digits;
  if (digits.length === 8) return '961' + digits;
  if (digits.length === 7) return '961' + digits;
  return digits;
}

export function getLast8(phone) {
  const n = normalizePhone(phone);
  if (!n) return null;
  return n.slice(-8);
}

// ===== البوابة الاساسية - جدول users - بتستعمل Indexes =====
const USER_COLUMNS = '"User ID", "Customer ID", "Name", "Mobile", "WhatsApp Number", "Role", "Store ID", "Area", "Status", "Active", "Gender", "Assigned Persona", "AcceptedTerms", "Taxi_ID", "PIN", "failedAttempts", "isLocked"';

export async function getUserByWhatsAppNumber(phone) {
  const supabase = getSupabase();
  const normalized = normalizePhone(phone);
  const last8 = getLast8(phone);
  if (!normalized) return null;
  console.log(`🔎 [lib/supabase] البحث بـ Index: ${normalized}`);

  const { data: byWhatsapp } = await supabase.from('users').select(USER_COLUMNS).eq('WhatsApp Number', normalized).maybeSingle();
  if (byWhatsapp) {
    console.log('✅ لقيتو بـ WhatsApp Number Index');
    return mapUserRow(byWhatsapp);
  }

  const variants = [normalized, '0' + last8, last8];
  for (const v of variants) {
    const { data } = await supabase.from('users').select(USER_COLUMNS).eq('Mobile', v).maybeSingle();
    if (data) {
      console.log(`✅ لقيتو بـ Mobile = ${v}`);
      return mapUserRow(data);
    }
  }

  if (last8) {
    const { data: byLast8 } = await supabase.from('users').select(USER_COLUMNS).ilike('WhatsApp Number', `%${last8}`).limit(1).maybeSingle();
    if (byLast8) {
      console.log(`✅ لقيتو بـ last8 fallback`);
      return mapUserRow(byLast8);
    }
  }
  console.log('❌ ما لقيت يوزر');
  return null;
}

export async function getUserByMobile(phone) {
  return getUserByWhatsAppNumber(phone);
}

function mapUserRow(row) {
  return {
    userId: row["User ID"] || "",
    customerId: String(row["Customer ID"] || "").trim(), // trim مهم - اذا فاضي بيصير ""
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
    pin: row["PIN"] || "",
    failedAttempts: row["failedAttempts"] || "0",
    isLocked: row["isLocked"] || "FALSE",
  };
}

// ===== جديد - فحص الكوستيمر بـ eq + Index - بدون select('*') =====
export async function getCustomerRowByPhone(phone, customerId) {
  const supabase = getSupabase();
  const normalized = normalizePhone(phone);
  const last8 = getLast8(phone);

  if (customerId && String(customerId).trim() !== "") {
    const { data } = await supabase.from('customers').select('"Customer ID", "Mobile", "Name"').eq('Customer ID', String(customerId).trim()).maybeSingle();
    if (data) return data;
  }

  if (normalized) {
    const variants = [normalized, '0' + last8, last8];
    for (const v of variants) {
      if (!v) continue;
      const { data } = await supabase.from('customers').select('"Customer ID", "Mobile", "Name"').eq('Mobile', v).maybeSingle();
      if (data) return data;
    }
  }
  return null;
}

// ===== الشرط يلي بدك ياه - اذا مش كوستيمر ما يفتح بوابة 2 =====
export function isCustomer(user) {
  if (!user) return false;
  const cid = String(user.customerId || "").trim();
  if (!cid) return false; // نول او فاضي
  if (cid.toLowerCase() === "null") return false;
  if (cid === "") return false;
  return true;
}

export function canOpenBot2(user) {
  // نفس الشرط يلي كنت حاطو قبل - اذا Customer ID نول او فاضي -> ممنوع
  return isCustomer(user);
}

// ===== للجداول الثابتة مع كاش - بدون select('*') =====
export async function getCachedTable(table, columns = null) {
  // لو ما حددت columns منحددها نحنا - ممنوع '*'
  let cols = columns;
  if (!cols) {
    if (table === 'products') cols = '"Product ID", "Product Name", "Price", "Store ID", "Available", "Active", "Unit", "Description"';
    else if (table === 'stores') cols = '"Store ID", "Store Name", "Adress", "Area", "Open Time", "Close Time"';
    else if (table === 'areas') cols = '"Area ID", "Area Name"';
    else if (table === 'categories') cols = '"Category ID", "Category Name"';
    else cols = '"id", "name"'; // fallback آمن
  }

  const cacheKey = `${table}:${cols}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const supabase = getSupabase();
  const { data, error } = await supabase.from(table).select(cols);
  if (error) throw error;

  if (CACHEABLE_TABLES.includes(table)) {
    setCached(cacheKey, data);
  }
  return data;
}
