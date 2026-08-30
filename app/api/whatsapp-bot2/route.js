import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export const dynamic = "force-dynamic";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "mjahto123";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID || "1183824331491327";
const GROQ_KEY = process.env.GROQ_API_KEY_2;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.md-marketplace.store";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

function mapTable(sheetName) {
  const n = String(sheetName || "").toLowerCase().trim();
  if (n === "products") return "products";
  if (n === "stores") return "stores";
  if (n === "categories") return "categories";
  if (n === "areas") return "areas";
  if (n === "users") return "users";
  if (n === "customers") return "customers";
  if (n === "messages") return "messages";
  if (n === "bot sessions" || n === "bot_sessions") return "bot_sessions";
  if (n === "cart") return "cart";
  if (n === "order requuest" || n === "order_requuest") return "order_requuest";
  if (n === "order details" || n === "order_details") return "order_details";
  if (n === "drivers") return "drivers";
  return n;
}

const SHEETS_CACHE = new Map();
const CACHE_TTL = 1000 * 60 * 3;
const CACHEABLE_SHEETS = new Set(["products", "stores", "categories", "areas"]);
function getCache(key) {
  const item = SHEETS_CACHE.get(key);
  if (!item) return null;
  if (Date.now() - item.time > CACHE_TTL) { SHEETS_CACHE.delete(key); return null; }
  return item.value;
}
function setCache(key, value) { SHEETS_CACHE.set(key, { value, time: Date.now() }); }
function clearCache(sheetName) { SHEETS_CACHE.delete(mapTable(sheetName)); }

const SHEETS_LOADING = new Map();
async function getSheetRows(sheetName) {
  const table = mapTable(sheetName);
  const useCache = CACHEABLE_SHEETS.has(table);
  if (useCache) { const cached = getCache(table); if (cached) return cached; }
  if (useCache) { const loading = SHEETS_LOADING.get(table); if (loading) return await loading; }
  const supabase = getSupabase();
  const promise = (async () => {
    try {
      const { data, error } = await supabase.from(table).select('*');
      if (error) { console.error(`❌ قراءة ${table}:`, error.message); return []; }
      const result = data || [];
      if (useCache) setCache(table, result);
      return result;
    } catch (error) { console.error(`❌ قراءة ${table}:`, error.message); return []; }
  })();
  if (useCache) SHEETS_LOADING.set(table, promise);
  try { return await promise; } finally { if (useCache) SHEETS_LOADING.delete(table); }
}

function normalizeWhatsAppNumber(phone) {
  let c = String(phone || "").replace(/\D/g, "");
  if (!c) return null;
  if (c.startsWith("961")) return c;
  if (c.startsWith("966")) return c;
  if (c.startsWith("0")) c = c.substring(1);
  if (c.length === 9 && c.startsWith("5")) return "966" + c;
  if (c.length === 10 && c.startsWith("5")) return "966" + c;
  if (c.length === 7 && c.startsWith("3")) return "961" + c;
  if (c.length === 8) return "961" + c;
  return c;
}
function normalizeText(text) {
  return String(text || "").toLowerCase().trim().replace(/[إأآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[؟?!.,،:؛]/g, " ").replace(/\s+/g, " ");
}
function convertArabicNumbers(text) {
  const map = {'٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'};
  return String(text||"").replace(/[٠-٩]/g, d => map[d]);
}
async function sendMessage(to, text) {
  if (!WHATSAPP_TOKEN) { console.error("❌ WHATSAPP_TOKEN غير موجود"); return; }
  const cleanPhone = normalizeWhatsAppNumber(to);
  try {
    const response = await fetch(`https://graph.facebook.com/v26.0/${PHONE_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: cleanPhone, type: "text", text: { body: text } })
    });
    const data = await response.json();
    console.log("📤 WhatsApp BOT2:", JSON.stringify(data));
  } catch (error) { console.error("❌ WhatsApp Send Error:", error); }
}
async function getUserByWhatsAppNumber(phone) {
  const normalized = normalizeWhatsAppNumber(phone);
  const users = await getSheetRows("Users");
  for (const row of users) {
    const rowPhone = normalizeWhatsAppNumber(row["WhatsApp Number"] || row["Mobile"] || row["Phone"] || "");
    if (rowPhone === normalized) {
      return {
        userId: row["User ID"] || "", customerId: row["Customer ID"] || "", name: row["Name"] || "",
        mobile: row["Mobile"] || "", whatsappNumber: row["WhatsApp Number"] || phone,
        role: row["Role"] || "", area: row["Area"] || "", status: row["Status"] || "", active: row["Active"] || ""
      };
    }
  }
  return null;
}
async function getCustomer(customerID) {
  if (!customerID) return null;
  const customers = await getSheetRows("Customers");
  const wanted = String(customerID).trim();
  for (const row of customers) {
    const id = String(row["Customer ID"] || row["ID"] || "").trim();
    if (id === wanted) return row;
  }
  return null;
}
async function findArea(input) {
  const areas = await getSheetRows("Areas");
  const value = normalizeText(input);
  if (!value) return null;
  for (const area of areas) {
    const id = String(area["Area ID"] || "").trim();
    const name = String(area["Area Name"] || "").trim();
    if (!id &&!name) continue;
    if (value === normalizeText(id)) return { areaId: id, areaName: name };
    if (value === normalizeText(name)) return { areaId: id, areaName: name };
  }
  return null;
}
async function getCustomerDeliveryData(customerID) {
  const customer = await getCustomer(customerID);
  if (!customer) return { exists: false, area: null, address: "", lat: "", lng: "" };
  const areaValue = String(customer["Area"] || customer["Area ID"] || "").trim();
  const area = await findArea(areaValue);
  const address = String(customer["Adress"] || customer["Delivery Address"] || customer["Old Address"] || "").trim();
  const lat = String(customer["Current Latitude"] || customer["Registration Latitude"] || customer["Latitude"] || customer["Lat"] || customer["Customer Latitude"] || "").trim();
  const lng = String(customer["Current Longitude"] || customer["Registration Longitude"] || customer["Longitude"] || customer["Lng"] || customer["Customer Longitude"] || "").trim();
  console.log(`📍 L=${customer["Current Latitude"]} M=${customer["Current Longitude"]} => lat=${lat} lng=${lng}`);
  return { exists: true, area, address, lat, lng };
}
function cartRowToObject(row) {
  return {
    cartId: row["Cart ID"] || row["cart_id"] || "", customerId: row["Customer ID"] || row["customer_id"] || "", productId: row["Product ID"] || row["product_id"] || "",
    qty: Number(row["Qty"] || row["qty"] || 0), storeId: row["Store ID"] || row["store_id"] || "", lineTotal: Number(row["Line Total"] || row["line_total"] || 0),
    checkedOut: String(row["Checked Out"] || row["checked_out"] || "FALSE").toUpperCase(),
    checkOutFlag: String(row["Check Out Flag"] || "FALSE").toUpperCase(),
    requestId: row["Request ID"] || "", linePoints: Number(row["Line Points"] || row["line_points"] || 0)
  };
}
async function getCustomerCart(customerID) {
  const supabase = getSupabase();
  const { data } = await supabase.from('cart').select('*').eq('Customer ID', customerID).or('"Checked Out".is.null,"Checked Out".eq.FALSE');
  // fallback اذا الاعمدة lowercase
  let rows = data;
  if (!rows || rows.length===0) {
    const { data: data2 } = await supabase.from('cart').select('*').eq('customer_id', customerID).or('checked_out.is.null,checked_out.eq.FALSE');
    rows = data2 || [];
  }
  return (rows || []).map(cartRowToObject).filter(c => String(c.customerId).trim()===String(customerID).trim() && c.checkedOut!=="TRUE");
}

// ===== CART Supabase بدل Google Sheets API =====
async function addToCart(customerID, product, qty) {
  const supabase = getSupabase();
  const quantity = Number(qty);
  if (!Number.isFinite(quantity) || quantity <= 0) return { success: false, message: "الكمية لازم تكون أكبر من صفر" };
  const cart = await getCustomerCart(customerID);
  const existing = cart.find(item => item.productId === product.productId && item.storeId === product.storeId);
  if (existing) {
    const newQty = existing.qty + quantity;
    const newLineTotal = newQty * product.price;
    const newLinePoints = newQty * product.points;
    const { error } = await supabase.from('cart').update({ "Qty": newQty, "Store ID": product.storeId, "Line Total": newLineTotal, "Line Points": newLinePoints }).eq('Cart ID', existing.cartId);
    if (error) {
      await supabase.from('cart').update({ qty: newQty, store_id: product.storeId, line_total: newLineTotal, line_points: newLinePoints }).eq('cart_id', existing.cartId);
    }
    clearCache("Cart");
    return { success: true, updated: true, qty: newQty };
  }
  const cartId = crypto.randomUUID().replace(/-/g, "").substring(0, 12);
  const lineTotal = quantity * product.price;
  const linePoints = quantity * product.points;
  const row = { "Cart ID": cartId, "Customer ID": customerID, "Product ID": product.productId, "Qty": quantity, "Store ID": product.storeId, "Line Total": lineTotal, "Checked Out": "FALSE", "Check Out Flag": "FALSE", "Request ID": "", "Line Points": linePoints };
  const { error } = await supabase.from('cart').insert([row]);
  if (error) {
    await supabase.from('cart').insert([{ cart_id: cartId, customer_id: customerID, product_id: product.productId, qty: quantity, store_id: product.storeId, line_total: lineTotal, checked_out: false, line_points: linePoints }]);
  }
  clearCache("Cart");
  return { success: true, updated: false, cartId, qty: quantity, lineTotal };
}
async function updateCartQty(customerID, productId, qty) {
  const quantity = Number(qty);
  if (!Number.isFinite(quantity)) return { success: false, message: "الكمية غير صحيحة" };
  if (quantity <= 0) return await removeFromCart(customerID, productId);
  const cart = await getCustomerCart(customerID);
  const item = cart.find(row => row.productId === String(productId).trim());
  if (!item) return { success: false, message: "المنتج مش موجود بالسلة" };
  const products = await getSheetRows("Products");
  const product = products.find(row => String(row["Product ID"] || "").trim() === String(productId).trim());
  if (!product) return { success: false, message: "المنتج مش موجود" };
  const price = Number(product["Price"] || 0);
  const points = Number(product["Points"] || product["Point"] || product["Loyalty Points"] || 0);
  const supabase = getSupabase();
  const { error } = await supabase.from('cart').update({ "Qty": quantity, "Line Total": quantity*price, "Line Points": quantity*points }).eq('Cart ID', item.cartId);
  if (error) await supabase.from('cart').update({ qty: quantity, line_total: quantity*price, line_points: quantity*points }).eq('cart_id', item.cartId);
  clearCache("Cart");
  return { success: true, qty: quantity };
}
async function removeFromCart(customerID, productId) {
  const supabase = getSupabase();
  const cart = await getCustomerCart(customerID);
  const found = cart.find(r => r.productId === String(productId).trim());
  if (!found) return { success: false, message: "المنتج مش موجود بالسلة" };
  const { error } = await supabase.from('cart').delete().eq('Cart ID', found.cartId);
  if (error) await supabase.from('cart').delete().eq('cart_id', found.cartId);
  clearCache("Cart");
  return { success: true };
}
async function clearCustomerCart(customerID) {
  if (!customerID) return;
  const supabase = getSupabase();
  try {
    const { error } = await supabase.from('cart').delete().eq('Customer ID', customerID).eq('Checked Out', 'FALSE');
    if (error) await supabase.from('cart').delete().eq('customer_id', customerID).eq('checked_out', false);
    clearCache("Cart");
    console.log(`🗑 مسح السلة لـ ${customerID}`);
  } catch (e) { console.error("❌ خطأ مسح السلة:", e); }
}
async function buildCartView(customerID) {
  const cart = await getCustomerCart(customerID);
  const products = await getSheetRows("Products");
  const stores = await getSheetRows("Stores");
  const result = cart.map(item => {
    const product = products.find(row => String(row["Product ID"] || "").trim() === item.productId);
    const store = stores.find(row => String(row["Store ID"] || "").trim() === item.storeId);
    return {...item, productName: product?.["Product Name"] || item.productId, unit: product?.["Unit"] || "", price: Number(product?.["Price"] || 0), storeName: store?.["Store Name"] || item.storeId };
  });
  const subtotal = result.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0);
  const points = result.reduce((sum, item) => sum + Number(item.linePoints || 0), 0);
  return { items: result, subtotal, points, count: result.reduce((sum, item) => sum + Number(item.qty || 0), 0) };
}
function formatCart(cart) {
  if (!cart ||!cart.items ||!cart.items.length) return "🛒 سلتك فاضية حالياً.";
  let text = "🛒 *سلتك الحالية:*\n\n";
  cart.items.forEach((item, index) => {
    text += `${index + 1}. ${item.productName} × ${item.qty}`;
    if (item.unit) text += ` ${item.unit}`;
    text += ` — ${item.lineTotal.toLocaleString()} ل.ل`;
    if (item.storeName) text += `\n 🏪 ${item.storeName}`;
    text += "\n\n";
  });
  text += `💰 المجموع: ${cart.subtotal.toLocaleString()} ل.ل\n`;
  if (cart.points) text += `⭐ النقاط: ${cart.points}\n`;
  text += `📦 عدد القطع: ${cart.count}`;
  return text;
}
const LAST_SHOWN = new Map();
function parseChoice(text) {
  const raw = convertArabicNumbers(text);
  const t = normalizeText(raw);
  let m = t.match(/رقم\s*(\d+).*?(?:الكمية|كميه|كمية|عدد)?\s*(\d+)/);
  if (m) return { idx: parseInt(m[1])-1, qty: parseInt(m[2]) };
  m = t.match(/^(\d+)\s+(\d+)$/);
  if (m) return { idx: parseInt(m[1])-1, qty: parseInt(m[2]) };
  m = t.match(/^(?:رقم)?\s*(\d+)\s*(?:عدد|كمية|كميه)?\s*(\d+)?/);
  if (m) { const idx = parseInt(m[1])-1; const qty = m[2]? parseInt(m[2]) : 1; if (idx >=0) return { idx, qty }; }
  return null;
}
function productToObject(row) {
  const price = Number(row["Price"] || 0);
  const points = Number(row["Points"] || row["Point"] || row["Loyalty Points"] || 0);
  return {
    productId: String(row["Product ID"] || "").trim(), productName: String(row["Product Name"] || "").trim(),
    unit: String(row["Unit"] || "").trim(), price, points,
    storeId: String(row["Store ID"] || "").trim(), areaId: String(row["Area"] || row["Area ID"] || "").trim(),
    available: normalizeText(row["Available"] || ""), active: String(row["Active"] || "").toUpperCase(),
    category: String(row["Category"] || "").trim()
  };
}
async function searchProducts(message, customerID) {
  const productsRows = await getSheetRows("Products");
  const storesRows = await getSheetRows("Stores");
  const customerDelivery = await getCustomerDeliveryData(customerID);
  const customerAreaId = customerDelivery?.area?.areaId || "";
  const customerAreaName = customerDelivery?.area?.areaName || "";
  const normalized = normalizeText(convertArabicNumbers(message));
  const stopWords = ["بدي","بدّي","اريد","أريد","عايز","عندي","من","عطيني","اعطيني","لو سمحت","please","موجود","عندكم","سعر","كم","في","فيه","شو","شو عندكم","منتج","منتجات","قطعة","قطع","واحد","اتنين","اثنين","ثلاثة","تلاته","اربعة","خمسة","و","ال"];
  const words = normalized.split(" ").filter(word => word.length >= 2 &&!stopWords.includes(word));
  if (!words.length) return [];
  const results = [];
  for (const row of productsRows) {
    const product = productToObject(row);
    if (!product.productId ||!product.productName) continue;
    const isAvailable = product.available === "yes" || product.available === "نعم" || product.available === "true";
    const isActive = product.active === "TRUE";
    if (!isAvailable ||!isActive) continue;
    const name = normalizeText(product.productName);
    let score = 0;
    for (const word of words) {
      if (name === word) score += 20; else if (name.startsWith(word)) score += 10; else if (name.includes(word)) score += 5;
    }
    if (normalized.includes(name)) score += 15;
    if (customerAreaId && product.areaId === customerAreaId) score += 8;
    else if (customerAreaName && normalizeText(product.areaId) === normalizeText(customerAreaName)) score += 8;
    if (score <= 0) continue;
    const store = storesRows.find(store => String(store["Store ID"] || "").trim() === product.storeId);
    results.push({...product, storeName: store?.["Store Name"] || product.storeId, storeAddress: store?.["Address"] || store?.["Adress"] || "", score });
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 10);
}
function extractQuantity(message) {
  const normalized = normalizeText(convertArabicNumbers(message));
  const arabicNumbers = { "واحد": 1,"وحدة": 1,"قطعة": 1,"اتنين": 2,"اثنين": 2,"تنين": 2,"ثلاثة": 3,"تلاته": 3,"تلات": 3,"اربعة": 4,"أربعة": 4,"خمسة": 5,"خمسه": 5,"ستة": 6,"سته": 6,"سبعة": 7,"سبعه": 7,"ثمانية": 8,"تمانية": 8,"تسعة": 9,"تسعه": 9,"عشرة": 10 };
  for (const key of Object.keys(arabicNumbers)) { if (normalized.includes(key)) return arabicNumbers[key]; }
  const match = normalized.match(/(?:^|\s)(\d+)(?:\s|$)/);
  if (match) return Number(match[1]);
  return 1;
}
function detectCartCommand(message) {
  const text = normalizeText(message);
  if (text.includes("امحي") || text.includes("امسح")) return "REMOVE";
  if (text.includes("السله") || text.includes("سلة") || text.includes("سلت") || text.includes("cart")) {
    if (text.includes("شو فيها") || text.includes("شو بالسله") || text.includes("عرض") || text.includes("شوف") || text.includes("view") || text.includes("فيها")) return "SHOW";
  }
  if (text.includes("احذف") || text.includes("شيل") || text.includes("حذف") || text.includes("remove")) return "REMOVE";
  if (text.includes("غير الكميه") || text.includes("عدل الكميه") || text.includes("بدل الكميه") || text.includes("update") || text.includes("عدل")) return "UPDATE";
  return null;
}
function isCheckoutConfirmation(message) {
  const text = normalizeText(message);
  const confirmations = ["تأكيد الطلب","تاكيد الطلب","أكد الطلب","اكد الطلب","تأكيد","تاكيد","أكد","اكد","confirm order","confirm"];
  return confirmations.some(item => text === normalizeText(item));
}
async function checkCheckoutReadinessSimple(customerID) {
  const cart = await buildCartView(customerID);
  if (!cart.items.length) return { ready: false, reason: "EMPTY_CART", cart };
  const delivery = await getCustomerDeliveryData(customerID);
  if (!delivery.exists) return { ready: false, reason: "CUSTOMER_NOT_FOUND", cart };
  if (!delivery.area) {
    return { ready: false, reason: "AREA_MISSING", cart, customMessage: "📍 ما عندك منطقة محفوظة بملفك.\nفوت على الموقع www.md-marketplace.store وحدد منطقتك وعنوانك، وبعدين ارجع اطلب واتساب ❤\n\n⏰ سلتك بتضل محفوظة نص ساعة." };
  }
  if (!delivery.address) {
    return { ready: false, reason: "ADDRESS_MISSING", cart, customMessage: "🏠 ما عندك عنوان محفوظ بملفك.\nفوت على الموقع www.md-marketplace.store وكمل عنوانك، وبعدين ارجع اطلب واتساب ❤\n\n⏰ سلتك بتضل محفوظة نص ساعة." };
  }
  if (!delivery.lat ||!delivery.lng) {
    return { ready: false, reason: "LOCATION_MISSING", cart, customMessage: "📍  حسابك ما فيه لوكيشن مسجل.\nلازم تفوت تطلب مرة من الموقع www.md-marketplace.store لياخد موقعك تلقائياً، وبعدين فيك تطلب من الواتساب عادي ❤\n\n⏰ سلتك بتضل محفوظة نص ساعة." };
  }
  return { ready: true, reason: "READY", cart, delivery, area: delivery.area, address: delivery.address };
}
async function detectAreaFromMessage(message) {
  const areas = await getSheetRows("Areas");
  const text = normalizeText(message);
  if (!text) return null;
  for (const area of areas) {
    const id = String(area["Area ID"] || "").trim();
    const name = String(area["Area Name"] || "").trim();
    if (id && text.includes(normalizeText(id))) return { areaId: id, areaName: name };
    if (name && text.includes(normalizeText(name))) return { areaId: id, areaName: name };
  }
  return null;
}
async function runRealCheckout(customerID, readiness) {
  try {
    const response = await fetch(`${SITE_URL}/api/checkout`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerID, areaID: readiness.area.areaId, deliveryAddress: readiness.address, note: "", addressType: "fixed", lat: readiness.delivery.lat, lng: readiness.delivery.lng })
    });
    const data = await response.json();
    console.log("🛒 Checkout API:", JSON.stringify(data));
    return data;
  } catch (error) { console.error("❌ Checkout API Error:", error); return { success: false, message: "ما قدرنا نرسل الطلب حالياً، جرب بعد شوي." }; }
}
async function getRecentConversation(phone) {
  const messages = await getSheetRows("Messages");
  const normalizedPhone = normalizeWhatsAppNumber(phone);
  return messages.filter(row => normalizeWhatsAppNumber(row["Phone"] || "") === normalizedPhone).slice(-2).map(row => ({ customerMessage: row["CustomerMessage"] || "", botReply: row["AIReply"] || "", date: row["Date"] || "" }));
}
async function saveToAppSheet(from, userMessage, aiReply) {
  const supabase = getSupabase();
  try {
    const today = new Date().toLocaleString("en-US", { timeZone: "Asia/Beirut" });
    const { error } = await supabase.from('messages').insert([{ 
      Phone: normalizeWhatsAppNumber(from), 
      CustomerMessage: userMessage, 
      AIReply: aiReply, 
      Date: today, 
      "Bot Session": "BOT2", 
      Bot: "BOT2", 
      "Message Type": "WHATSAPP" 
    }]);
    
    if (error) console.error("❌ Save Message Supabase Error:", error.message);
    else console.log("💾 Messages BOT2: 200");
  } catch (error) { console.error("❌ Save Message Error:", error); }
}
function detectIntent(message) {
  const text = normalizeText(message);
  if (isCheckoutConfirmation(message)) return "checkout_confirmation";
  if (detectCartCommand(message)) return "cart";
  const productWords = ["بدي","اريد","عندكم","موجود","منتج","سعر","اشتري","شراء","جيبلي","اعطيني"];
  if (productWords.some(word => text.includes(normalizeText(word)))) return "shopping";
  const orderWords = ["طلب","اوردر","طلبي","التوصيل","وصل","وين الطلب"];
  if (orderWords.some(word => text.includes(normalizeText(word)))) return "order_status";
  return "general";
}
async function handleShopping(customerID, message) {
  const products = await searchProducts(message, customerID);
  if (!products.length) return { success: false, reply: "ما لقيت المنتج بهالشكل 😕\nإذا بتكتبلي اسم المنتج بشكل أوضح بفتشلك عليه، وإذا مش موجود بقدر اقترحلك شي قريب منه." };
  const best = products[0];
  const second = products[1];
  const bestIsStrong = best.score >= 15 && (!second || best.score >= second.score + 5);
  if (bestIsStrong) {
    const qty = extractQuantity(message);
    const added = await addToCart(customerID, best, qty);
    if (!added.success) return { success: false, reply: added.message || "ما قدرت أضيف المنتج للسلة." };
    const cart = await buildCartView(customerID);
    return { success: true, reply: `✅ ضفتلك ${qty} × ${best.productName} بالسلة.\n🏪 ${best.storeName}\n💰 السعر: ${best.price.toLocaleString()} ل.ل للقطعة.\n\n${formatCart(cart)}\n\nإذا خلصت، اكتبلي *تأكيد الطلب*.` };
  }
  let reply = "لقيت أكتر من خيار قريب من طلبك 👇\n\n";
  products.slice(0, 5).forEach((product, index) => {
    reply += `${index + 1}⃣ ${product.productName} — ${product.price.toLocaleString()} ل.ل\n🏪 ${product.storeName}`;
    if (product.areaId) reply += `\n📍 ${product.areaId}`;
    reply += "\n\n";
  });
  reply += "قلّي رقم الخيار والكمية، مثلاً: *1 عدد 2*.";
  LAST_SHOWN.set(customerID, products.slice(0, 5));
  return { success: true, reply };
}
async function handleCart(customerID, message) {
  const command = detectCartCommand(message);
  if (command === "SHOW") { const cart = await buildCartView(customerID); return { success: true, reply: formatCart(cart) }; }
  const cart = await buildCartView(customerID);
  if (!cart.items.length) return { success: true, reply: "🛒 السلة فاضية." };
  if (command === "REMOVE") {
    const found = cart.items.find(item => normalizeText(message).includes(normalizeText(item.productName))) || cart.items[0];
    if (!found) return { success: false, reply: "أي منتج بدك شيل من السلة؟ اكتبلي اسمه." };
    const removed = await removeFromCart(customerID, found.productId);
    if (!removed.success) return { success: false, reply: removed.message };
    clearCache("Cart");
    const newCart = await buildCartView(customerID);
    return { success: true, reply: `🗑 شلت ${found.productName} من السلة.\n\n${formatCart(newCart)}` };
  }
  if (command === "UPDATE") {
    const found = cart.items.find(item => normalizeText(message).includes(normalizeText(item.productName))) || cart.items[0];
    if (!found) return { success: false, reply: "أي منتج بدك تغيّر كميته؟" };
    const qty = extractQuantity(message);
    const updated = await updateCartQty(customerID, found.productId, qty);
    if (!updated.success) return { success: false, reply: updated.message };
    clearCache("Cart");
    const newCart = await buildCartView(customerID);
    return { success: true, reply: `✅ عدلت كمية ${found.productName} لـ ${qty}.\n\n${formatCart(newCart)}` };
  }
  return { success: true, reply: formatCart(cart) };
}
async function handleCheckout(customerID, message) {
  const readiness = await checkCheckoutReadinessSimple(customerID);
  if (readiness.reason === "EMPTY_CART") return { success: false, reply: "🛒 قبل ما نأكد الطلب، السلة فاضية. خبرني شو بدك تشتري." };
  if (readiness.reason === "CUSTOMER_NOT_FOUND") return { success: false, reply: "ما قدرت لاقي بيانات حسابك." };
  if (readiness.reason === "AREA_MISSING" || readiness.reason === "ADDRESS_MISSING" || readiness.reason === "LOCATION_MISSING") {
    return { success: false, reply: readiness.customMessage };
  }
  if (!isCheckoutConfirmation(message)) {
    let confirmation = "🧾 *ملخص طلبك قبل التأكيد:*\n\n";
    confirmation += formatCart(readiness.cart);
    confirmation += `\n\n📍 المنطقة: ${readiness.area.areaName}`;
    confirmation += `\n🏠 العنوان: ${readiness.address}`;
    confirmation += `\n\n📌 العنوان كامل رح يتاخد من ملفك المحفوظ:\n${readiness.area.areaName} - ${readiness.address}`;
    confirmation += `\n\n💡 اذا بدك تغير العنوان، السلة بتضل محفوظة نص ساعة.\nفوت على الموقع www.md-marketplace.store وكفي الطلب من هنيك.`;
    confirmation += "\n\nاذا كل شي صحيح، اكتب بالضبط: *تأكيد الطلب*";
    return { success: true, reply: confirmation };
  }
  const checkout = await runRealCheckout(customerID, readiness);
  if (!checkout?.success) return { success: false, reply: checkout?.message || "صار خطأ أثناء تأكيد الطلب، وما تم اعتماد الطلب." };
  LAST_SHOWN.delete(customerID);
  return { success: true, checkout: true, reply: `✅ *تم تأكيد طلبك بنجاح!*\n\n🧾 رقم الطلب: *${checkout.request_id}*\n📍 المنطقة: ${readiness.area.areaName}\n🏠 العنوان: ${readiness.address}\n\nتم إرسال الطلب للمراجعة، ورح نخبرك بالتحديثات. ❤\n\n💡 اذا بدك تغير عنوانك للمرات الجاي، فوت على الموقع وعدلو.` };
}
async function runAI(userMessage, context) {
  if (!GROQ_KEY) return { success: false, reply: "أهلا وسهلا! كيف بقدر ساعدك؟ 😊" };
  try {
    const prompt = `أنت BOT2 — مساعد الشراء الرسمي في MD‑Marketplace عبر WhatsApp. مهمتك تنفيذ عمليات الشراء فقط، بدقة صارمة، ومن دون أي اختراع أو هلوسة.\n⛔ ممنوعات صارمة:\n- ممنوع تخترع منتج غير موجود في بيانات المنتجات أو السلة أدناه.\n- ممنوع تخترع سعر أو وحدة أو متجر أو منطقة أو عنوان.\n- ممنوع تخترع أي معلومة غذائية أو سعرات حرارية غير موجودة بالبيانات.\n- ممنوع تقول "تم تأكيد الطلب" إلا إذا استلمت checkout_success=true من الكود.\n- ممنوع تعتبر كلمات مثل "خلص"، "تمام"، "ايه"، "ماشي" تأكيد للطلب.\n- ممنوع تقول "حسب البيانات" أو "حسب ما لدي" — جاوب مباشرة.\n- ممنوع تذكر Product ID أو Store ID أو Area ID للعميل.\n- ممنوع تكرر كل البيانات إذا مش ضرورية للسؤال.\n📦 بيانات موثوقة (لا تستعمل غيرها):\nالعميل:\n${JSON.stringify(context.user)}\nالسلة الحالية:\n${JSON.stringify(context.cart)}\nالعنوان والمنطقة:\n${JSON.stringify(context.delivery)}\nالمنتجات المتاحة:\n${JSON.stringify(context.products)}\n💬 رسالة العميل:\n${userMessage}\n🎯 النية:\n${context.intent}\n`;
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST", headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "openai/gpt-oss-20b", messages: [{ role: "system", content: prompt }, { role: "user", content: userMessage }], temperature: 0.2 })
    });
    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) return { success: false, reply: "ما قدرت أفهم الرسالة، جرب اكتبلي بطريقة أبسط 🙏" };
    return { success: true, reply: reply.trim() };
  } catch (error) { console.error("❌ AI Error:", error); return { success: false, reply: "صار معي خطأ صغير، جرب مرة تانية 🙏" }; }
}
async function buildContext(user, message) {
  const customerID = user?.customerId || "";
  const cart = customerID? await buildCartView(customerID) : { items: [], subtotal: 0, points: 0, count: 0 };
  const delivery = customerID? await getCustomerDeliveryData(customerID) : null;
  return { user, cart, delivery, intent: detectIntent(message) };
}
// BOT SESSIONS Supabase
async function appSheetAction(tableName, action, rows) {
  const supabase = getSupabase();
  const table = mapTable(tableName);
  try {
    if (action === "Add") {
      const { error } = await supabase.from(table).insert(rows);
      if (error) { console.error(`❌ Supabase ${table}/${action}:`, error.message); return { ok: false }; }
      return { ok: true, status: 200, text: "OK" };
    }
    if (action === "Edit") {
      for (const row of rows) {
        const phone = row["Phone"];
        const { Phone,...update } = row;
        await supabase.from(table).update(update).eq('Phone', phone);
      }
      return { ok: true, status: 200, text: "OK" };
    }
    return { ok: false };
  } catch (error) { console.error(`❌ Supabase ${table}/${action}:`, error); return null; }
}
async function getBotSessionRow(phone) {
  const rows = await getSheetRows("Bot Sessions");
  const normalized = normalizeWhatsAppNumber(phone);
  return rows.find(r => normalizeWhatsAppNumber(r["Phone"] || "") === normalized) || null;
}
async function touchBotSession(phone) {
  const supabase = getSupabase();
  const now = new Date().toISOString();
  await supabase.from('bot_sessions').update({ "Last Activity": now }).eq('Phone', normalizeWhatsAppNumber(phone));
}
async function closeBotSessionAndReturnToBot1(phone, reason = "CHECKOUT_SUCCESS") {
  const supabase = getSupabase();
  const now = new Date().toISOString();
  console.log(`🔒 تسكير جلسة BOT2 لـ ${phone} - السبب: ${reason} - رجوع لـ BOT1`);
  await supabase.from('bot_sessions').update({ "Active Bot": "BOT1", Status: "CLOSED", "Closed At": now, "Last Activity": now }).eq('Phone', normalizeWhatsAppNumber(phone));
  return { ok: true };
}
async function checkAndHandleTimeout(phone) {
  const session = await getBotSessionRow(phone);
  if (!session) return false;
  const lastActivityStr = session["Last Activity"] || "";
  if (!lastActivityStr) return false;
  const lastActivity = new Date(lastActivityStr);
  if (isNaN(lastActivity.getTime())) return false;
  const diffMinutes = (Date.now() - lastActivity.getTime()) / 1000 / 60;
  console.log(`⏱ فحص Timeout: ${diffMinutes.toFixed(1)} دقيقة منذ آخر نشاط`);
  if (diffMinutes >= 30) {
    console.log(`⏰ سكون 30 دقيقة لـ ${phone} - تسكير وارجاع لـ BOT1`);
    await closeBotSessionAndReturnToBot1(phone, "TIMEOUT_30MIN");
    const user = await getUserByWhatsAppNumber(phone);
    if (user?.customerId) { await clearCustomerCart(user.customerId); }
    const timeoutMsg = "⏰ انتهت جلسة الطلب بسبب عدم النشاط لمدة 30 دقيقة.\n\nتم إرجاعك للمساعد العام 😊 إذا بدك ترجع تطلب، اكتب *بدي طلب*";
    await sendMessage(phone, timeoutMsg);
    await saveToAppSheet(phone, "TIMEOUT_30MIN", timeoutMsg);
    return true;
  }
  return false;
}
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === VERIFY_TOKEN) return new Response(challenge, { status: 200 });
    return new Response("Forbidden", { status: 403 });
  } catch (error) { console.error("❌ GET Error:", error); return new Response("Forbidden", { status: 403 }); }
}
export async function POST(req) {
  try {
    const body = await req.json();
    console.log("📩 Bot 2:", JSON.stringify(body));
    if (body.command === "START_ORDER" || body.transferKey === "START_ORDER" || body.event === "NEW_ORDER") {
      const bridgePhone = normalizeWhatsAppNumber(body.phone || body.Phone || body.from || "");
      if (!bridgePhone) return NextResponse.json({ status: "ok", error: "NO_PHONE" });
      console.log(`🚀 BOT2 Bridge START_ORDER: ${bridgePhone}`);
      const now = new Date().toISOString();
      const supabase = getSupabase();
      const { error } = await supabase.from('bot_sessions').insert([{ Phone: bridgePhone, "Active Bot": "BOT2", Status: "ACTIVE", "Request ID": "", "Started At": now, "Closed At": "", "Last Activity": now }]);
      if (error) await supabase.from('bot_sessions').update({ "Active Bot": "BOT2", Status: "ACTIVE", "Last Activity": now }).eq('Phone', bridgePhone);
      const startMsg = body.startMessage || "يلا نبلّش تسجيل الأوردر 😊 شو حابب تطلب؟";
      await sendMessage(bridgePhone, startMsg);
      await saveToAppSheet(bridgePhone, body.originalMessage || "بدي اعمل اوردر", startMsg);
      return NextResponse.json({ status: "ok", bridge: "STARTED", phone: bridgePhone });
    }
    const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    const from = message?.from || body?.from || body?.whatsappNumber || "";
    const userText = message?.text?.body || body?.text || body?.userText || "";
    if (!from ||!userText) return NextResponse.json({ status: "ok" });
    const whatsappNumber = normalizeWhatsAppNumber(from);
    console.log(`📱 Customer BOT2: ${whatsappNumber} | ${userText}`);
    const user = await getUserByWhatsAppNumber(whatsappNumber);
    const customerIDForChoice = user?.customerId || "";
    if (customerIDForChoice) {
      const choice = parseChoice(userText);
      if (choice) {
        const lastProducts = LAST_SHOWN.get(customerIDForChoice);
        console.log(`🔍 Choice detected: idx=${choice.idx} qty=${choice.qty} | lastProducts=${lastProducts?.length || 0}`);
        if (lastProducts && lastProducts[choice.idx]) {
          const prod = lastProducts[choice.idx];
          const added = await addToCart(customerIDForChoice, prod, choice.qty);
          if (added.success) {
            const cart = await buildCartView(customerIDForChoice);
            const reply = `✅ ضفت ${choice.qty} × ${prod.productName} بالسلة.\n🏪 ${prod.storeName}\n💰 ${prod.price.toLocaleString()} ل.ل\n\n${formatCart(cart)}\n\nإذا خلصت، اكتب *تأكيد الطلب*.`;
            await sendMessage(whatsappNumber, reply);
            await saveToAppSheet(from, userText, reply);
            await touchBotSession(whatsappNumber);
            return NextResponse.json({ status: "ok", action: "CHOICE_ADDED" });
          }
        }
      }
    }
    const isTimedOut = await checkAndHandleTimeout(whatsappNumber);
    if (isTimedOut) return NextResponse.json({ status: "ok", action: "TIMEOUT_RETURNED_TO_BOT1" });
    await touchBotSession(whatsappNumber);
    if (!user) {
      const reply = "أهلا وسهلا فيك بـ MD-Marketplace ❤\n\nلازم يكون عندك حساب مسجل حتى أقدر ساعدك بالشراء والطلبات.";
      await sendMessage(whatsappNumber, reply);
      await saveToAppSheet(from, userText, reply);
      return NextResponse.json({ status: "ok" });
    }
    const customerID = user.customerId;
    if (!customerID) {
      const reply = "حسابك موجود، بس ما عندي Customer ID مرتبط فيه. لازم نراجع الحساب.";
      await sendMessage(whatsappNumber, reply);
      await saveToAppSheet(from, userText, reply);
      return NextResponse.json({ status: "ok" });
    }
    const context = await buildContext(user, userText);
    if (isCheckoutConfirmation(userText) || normalizeText(userText).includes("خلص") || normalizeText(userText).includes("جاهز")) {
      const result = await handleCheckout(customerID, userText);
      await sendMessage(whatsappNumber, result.reply);
      await saveToAppSheet(from, userText, result.reply);
      if (result.checkout) {
        console.log("✅ طلب ناجح - تسكير الجلسة وارجاع لـ BOT1");
        await closeBotSessionAndReturnToBot1(whatsappNumber, "CHECKOUT_SUCCESS");
        await clearCustomerCart(customerID);
      }
      return NextResponse.json({ status: "ok", action: result.checkout? "CHECKOUT_SUCCESS_CLOSED" : "CHECKOUT_VALIDATION" });
    }
    const cartCommand = detectCartCommand(userText);
    if (cartCommand) {
      const result = await handleCart(customerID, userText);
      await sendMessage(whatsappNumber, result.reply);
      await saveToAppSheet(from, userText, result.reply);
      return NextResponse.json({ status: "ok", action: "CART" });
    }
    if (context.intent === "shopping") {
      const result = await handleShopping(customerID, userText);
      await sendMessage(whatsappNumber, result.reply);
      await saveToAppSheet(from, userText, result.reply);
      return NextResponse.json({ status: "ok", action: "SHOPPING" });
    }
    const history = await getRecentConversation(whatsappNumber);
    context.history = history;
    const aiResult = await runAI(userText, context);
    const reply = aiResult?.reply || "كيف فيني ساعدك؟ 😊";
    await sendMessage(whatsappNumber, reply);
    await saveToAppSheet(from, userText, reply);
    return NextResponse.json({ status: "ok", bot: "bot2", readOnly: false });
  } catch (error) {
    console.error("❌ Bot 2 POST Error:", error);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  }
}
