// lib/supabase.js - المكتبة المركزية - المرحلة 1
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
  
  supabaseInstance = createClient(url, key, {
    auth: { persistSession: false }
  });
  return supabaseInstance;
}

// ===== تنظيم الكاش - ثابت vs متحرك =====
export const CACHEABLE_TABLES = ['products', 'stores', 'areas', 'categories'];
export const NO_CACHE_TABLES = ['users', 'customers', 'bot_sessions', 'cart', 'messages', 'order_requuest', 'rate_limits'];

// كاش بسيط 5 دقايق للجداول الثابتة
const cache = new Map();
export function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.ts > 5 * 60 * 1000) {
    cache.delete(key);
    return null;
  }
  return item.data;
}
export function setCached(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

// ===== تنضيف الرقم - مرة وحدة بس =====
export function normalizePhone(phone) {
  if (!phone) return null;
  let digits = String(phone).replace(/\D/g, '');
  // شيل اصفار البداية
  digits = digits.replace(/^0+/, '');
  // اذا بلش بـ 961 خلاص هو normalized
  if (digits.startsWith('961')) return digits;
  // اذا طوله 8 ارقام لبنانية - زيد 961
  if (digits.length === 8) return '961' + digits;
  if (digits.length === 7) return '961' + digits; // 03 -> 3
  return digits;
}

export function getLast8(phone) {
  const n = normalizePhone(phone);
  if (!n) return null;
  return n.slice(-8);
}

// ===== البوابة الاساسية - جدول users - بتستعمل Indexes الجداد =====
export async function getUserByWhatsAppNumber(phone) {
  const supabase = getSupabase();
  const normalized = normalizePhone(phone);
  const last8 = getLast8(phone);
  
  if (!normalized) return null;
  
  console.log(`🔎 [lib/supabase] البحث بـ Index: ${normalized}`);

  // محاولة 1: ايكوال صح على WhatsApp Number - بتستعمل idx_users_whatsapp_number
  const { data: byWhatsapp } = await supabase
    .from('users')
    .select('"User ID", "Customer ID", "Name", "Mobile", "WhatsApp Number", "Role", "Store ID", "Area", "Status", "Active", "Gender", "Assigned Persona", "AcceptedTerms", "Taxi_ID", "PIN", "failedAttempts", "isLocked"')
    .eq('WhatsApp Number', normalized)
    .maybeSingle();
  
  if (byWhatsapp) {
    console.log('✅ لقيتو بـ WhatsApp Number Index');
    return mapUserRow(byWhatsapp);
  }

  // محاولة 2: ايكوال على Mobile - بتستعمل idx_users_mobile
  // جرب 3 اشكال: 03177653, 3177653, 9613177653
  const variants = [
    normalized,
    '0' + last8,
    last8,
  ];

  for (const v of variants) {
    const { data } = await supabase
      .from('users')
      .select('"User ID", "Customer ID", "Name", "Mobile", "WhatsApp Number", "Role", "Store ID", "Area", "Status", "Active", "Gender", "Assigned Persona", "AcceptedTerms", "Taxi_ID", "PIN", "failedAttempts", "isLocked"')
      .eq('Mobile', v)
      .maybeSingle();
    if (data) {
      console.log(`✅ لقيتو بـ Mobile = ${v}`);
      return mapUserRow(data);
    }
  }

  // محاولة 3: fallback على last8 باستعمال الاندكس الجديد - اذا كل شي فشل
  // هون منستعمل ilike لان last8 اندكس functional
  if (last8) {
    const { data: byLast8 } = await supabase
      .from('users')
      .select('"User ID", "Customer ID", "Name", "Mobile", "WhatsApp Number", "Role", "Store ID", "Area", "Status", "Active", "Gender", "Assigned Persona", "AcceptedTerms", "Taxi_ID", "PIN", "failedAttempts", "isLocked"')
      .ilike('WhatsApp Number', `%${last8}`)
      .limit(1)
      .maybeSingle();
    if (byLast8) {
      console.log(`✅ لقيتو بـ last8 fallback`);
      return mapUserRow(byLast8);
    }
  }

  console.log('❌ ما لقيت يوزر');
  return null;
}

export async function getUserByMobile(phone) {
  // نفس الفنكشن بس للـ login
  return getUserByWhatsAppNumber(phone);
}

function mapUserRow(row) {
  return {
    userId: row["User ID"] || "",
    customerId: row["Customer ID"] || "",
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

// ===== للجداول الثابتة مع كاش =====
export async function getCachedTable(table, columns = '*') {
  const cacheKey = `${table}:${columns}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const supabase = getSupabase();
  const { data, error } = await supabase.from(table).select(columns);
  if (error) throw error;

  if (CACHEABLE_TABLES.includes(table)) {
    setCached(cacheKey, data);
  }
  return data;
}
