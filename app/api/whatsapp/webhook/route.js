import { google } from "googleapis";
export const dynamic = "force-dynamic";

// ENV
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "mjahto123";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID || "1183824331491327";
const GROQ_KEY = process.env.GROQ_API_KEY;
const APPSHEET_APP_ID = process.env.APPSHEET_APP_ID;
const APPSHEET_API_KEY = process.env.APPSHEET_API_KEY;
const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

const BOT2_URL = process.env.BOT2_URL || "https://www.md-marketplace.store/api/whatsapp-bot2";
const BOT2_BRIDGE_KEY = process.env.BOT2_BRIDGE_KEY || "MDM_BOT1_TO_BOT2_ORDER";
const BOT2_START_COMMAND = "START_ORDER";

const BOT1_SESSION = "BOT1";
const BOT2_SESSION = "BOT2";
const WEBSITE_URL = "https://www.md-marketplace.store";
const INFO_EMAIL = "info@md-marketplace.store";

// ======================================================
// MARKETPLACE - 2 MILLION PRODUCTS DATABASE
// ======================================================
const MARKETPLACE_SHEET_IDS = [
  "16Sx7YjtCMyVtvHTBLDowKeiUrLPDc9-PdD9hGgOLL6o",
  "1JdCGyVh6HZCBHlWgAVKuVsWwwoCgGf4__UUXP1YlPO4",
];
const MARKETPLACE_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 ساعة
let MARKETPLACE_PRODUCT_CACHE = null;
let MARKETPLACE_BARCODE_INDEX = new Map();
let MARKETPLACE_CACHE_TIME = 0;
let MARKETPLACE_LOADING_PROMISE = null;

const SHEETS_CACHE = new Map();
const CACHE_TTL = 1000 * 60 * 5;
const CACHEABLE_SHEETS = new Set(["Products", "Stores", "Categories", "Areas"]);

function getCache(key) {
  const item = SHEETS_CACHE.get(key);
  if (!item) return null;
  if (Date.now() - item.t > CACHE_TTL) { SHEETS_CACHE.delete(key); return null; }
  return item.v;
}
function setCache(key, value) { SHEETS_CACHE.set(key, { v: value, t: Date.now() }); }

function normalizeWhatsAppNumber(phone) {
  let clean = String(phone || "").replace(/\D/g, "");
  if (clean.startsWith("05")) clean = "966" + clean.substring(1);
  else if (clean.length === 9 && clean.startsWith("5")) clean = "966" + clean;
  else if (clean.startsWith("03")) clean = "9613" + clean.substring(2);
  else if (clean.length === 7 && clean.startsWith("3")) clean = "961" + clean;
  return clean;
}

async function sendMessage(to, text) {
  if (!WHATSAPP_TOKEN) return false;
  const cleanPhone = normalizeWhatsAppNumber(to);
  if (!cleanPhone) return false;
  try {
    const res = await fetch(`https://graph.facebook.com/v26.0/${PHONE_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: cleanPhone, type: "text", text: { body: String(text || "") } })
    });
    const data = await res.json();
    console.log("📤 WhatsApp:", JSON.stringify(data));
    return res.ok;
  } catch (error) { console.error("❌ خطأ إرسال WhatsApp:", error); return false; }
}

function getGoogleSheetsClient() {
  if (!GOOGLE_SHEETS_ID ||!GOOGLE_CLIENT_EMAIL ||!GOOGLE_PRIVATE_KEY) return null;
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: GOOGLE_CLIENT_EMAIL, private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n") },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    });
    return google.sheets({ version: "v4", auth });
  } catch (error) { console.error("❌ خطأ إنشاء Google Sheets client:", error); return null; }
}

// ======================================================
// MARKETPLACE BARCODE NORMALIZATION
// ======================================================
function normalizeMarketplaceBarcode(value) {
  return String(value || "").replace(/\D/g, "").trim();
}
// ======================================================
// LOAD MARKETPLACE 2M PRODUCTS
// ======================================================
async function loadMarketplaceProducts(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && MARKETPLACE_PRODUCT_CACHE && now - MARKETPLACE_CACHE_TIME < MARKETPLACE_CACHE_TTL) {
    return MARKETPLACE_PRODUCT_CACHE;
  }
  if (MARKETPLACE_LOADING_PROMISE) {
    return await MARKETPLACE_LOADING_PROMISE;
  }
  const sheets = getGoogleSheetsClient();
  if (!sheets) {
    console.error("❌ Marketplace Google Sheets client unavailable");
    return [];
  }
  MARKETPLACE_LOADING_PROMISE = (async () => {
    try {
      console.log("📡 Loading Marketplace 2M product database...");
      const allProducts = [];
      const newBarcodeIndex = new Map();
      for (const spreadsheetId of MARKETPLACE_SHEET_IDS) {
        try {
          const metadata = await sheets.spreadsheets.get({ spreadsheetId });
          const sheetList = metadata.data.sheets || [];
          for (const sheet of sheetList) {
            const title = sheet.properties?.title;
            if (!title) continue;
            try {
              console.log(`📡 قراءة Marketplace Sheet: ${title}`);
              const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${title}!A2:F` });
              const rows = response.data.values || [];
              for (const row of rows) {
                const barcode = normalizeMarketplaceBarcode(row[0]);
                if (!barcode) continue;
                const product = {
                  code: barcode,
                  name: String(row[1] || "").trim(),
                  brand: String(row[2] || "").trim(),
                  quantity: String(row[3] || "").trim(),
                  countries: String(row[4] || "").trim(),
                  image: String(row[5] || "").trim(),
                };
                allProducts.push(product);
                if (!newBarcodeIndex.has(barcode)) {
                  newBarcodeIndex.set(barcode, product);
                }
              }
            } catch (error) {
              console.error(`⚠ Marketplace sheet "${title}" failed:`, error.message);
            }
          }
        } catch (error) {
          console.error(`⚠ Marketplace spreadsheet failed:`, spreadsheetId, error.message);
        }
      }
      MARKETPLACE_PRODUCT_CACHE = allProducts;
      MARKETPLACE_BARCODE_INDEX = newBarcodeIndex;
      MARKETPLACE_CACHE_TIME = Date.now();
      console.log(`✅ Marketplace products loaded: ${allProducts.length}`);
      console.log(`✅ Marketplace unique barcodes: ${MARKETPLACE_BARCODE_INDEX.size}`);
      return MARKETPLACE_PRODUCT_CACHE;
    } catch (error) {
      console.error("❌ Marketplace 2M database error:", error);
      return MARKETPLACE_PRODUCT_CACHE || [];
    } finally {
      MARKETPLACE_LOADING_PROMISE = null;
    }
  })();
  return await MARKETPLACE_LOADING_PROMISE;
}
// ======================================================
// FIND MARKETPLACE PRODUCT BY BARCODE,
// ======================================================
async function findMarketplaceProductByBarcode(barcode) {
  const normalized = normalizeMarketplaceBarcode(barcode);
  if (!normalized) return null;
  await loadMarketplaceProducts();
  return MARKETPLACE_BARCODE_INDEX.get(normalized) || null;
}

const SHEETS_LOADING = new Map();
async function getSheetRows(sheetName) {
  const useCache = CACHEABLE_SHEETS.has(sheetName);
  if (useCache) {
    const cached = getCache(sheetName);
    if (cached) { console.log(`⚡ Cache: ${sheetName} (${cached.length})`); return cached; }
  }
  if (useCache) {
    const loading = SHEETS_LOADING.get(sheetName);
    if (loading) { try { return await loading; } catch (error) { return []; } }
  }
  const sheets = getGoogleSheetsClient();
  if (!sheets) return [];
  const loadPromise = (async () => {
    try {
      console.log(`📡 قراءة Live من Google Sheets: ${sheetName}`);
      const response = await sheets.spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEETS_ID, range: `${sheetName}!A:Z` });
      const rows = response.data.values || [];
      if (!rows.length) return [];
      const headers = rows[0].map(h => String(h || "").trim());
      const result = rows.slice(1).map(row => {
        const obj = {}; headers.forEach((header, index) => { obj[header] = row[index] || ""; }); return obj;
      });
      if (useCache) { setCache(sheetName, result); console.log(`💾 تم تخزين ${sheetName} في Cache`); }
      return result;
    } catch (error) { console.error(`❌ خطأ قراءة جدول ${sheetName}:`, error.message); return []; }
  })();
  if (useCache) SHEETS_LOADING.set(sheetName, loadPromise);
  try { return await loadPromise; } finally { if (useCache) SHEETS_LOADING.delete(sheetName); }
}

function normalizeText(text) {
  return String(text || "").toLowerCase().trim().replace(/[؟?!.,،]/g, " ").replace(/\s+/g, " ");
}

function isNewOrderIntent(userMessage) {
  const message = normalizeText(userMessage);
  const newOrderPatterns = ["بدي اطلب", "بدي طلب", "بدي اعمل طلب", "بدي اوردر", "بدي اعمل اوردر", "بدي اشتري", "بدي شراء", "اعمللي طلب", "اعمل لي طلب", "اعمللي اوردر", "اعمل لي اوردر", "سجللي طلب", "سجل لي طلب", "حطلي طلب", "حط لي طلب", "فيني اطلب", "فيني أطلب", "بدي اشراء"];
  const existingOrderPatterns = ["وين طلبي", "وين الطلب", "وين اوردري", "شو صار بطلب", "شو صار بالطلب", "حالة الطلب", "حاله الطلب", "حالة اوردري", "حالة الأوردر", "طلبي وين صار", "وين صار طلبي", "وصل طلبي", "وصل الطلب", "طلبتي وين"];
  if (existingOrderPatterns.some(pattern => message.includes(normalizeText(pattern)))) return false;
  return newOrderPatterns.some(pattern => message.includes(normalizeText(pattern)));
}

async function getUserByWhatsAppNumber(whatsappNumber) {
  const normalized = normalizeWhatsAppNumber(whatsappNumber);
  console.log(`🔎 البحث في Users: ${normalized}`);
  const rows = await getSheetRows("Users");
  for (const row of rows) {
    const rowWhatsApp = normalizeWhatsAppNumber(row["WhatsApp Number"] || "");
    if (rowWhatsApp === normalized) {
      const user = {
        userId: row["User ID"] || "",
        role: row["Role"] || "",
        name: row["Name"] || "",
        mobile: row["Mobile"] || "",
        customerId: row["Customer ID"] || "",
        whatsappNumber: row["WhatsApp Number"] || "",
        storeId: row["Store ID"] || "",
        area: row["Area"] || "",
        status: row["Status"] || "",
        active: row["Active"] || ""
      };
      console.log("🎯 المستخدم:", JSON.stringify(user));
      return user;
    }
  }
  console.log("👤 الزائر غير مسجل في Users");
  return null;
}

async function appSheetAction(tableName, action, rows) {
  if (!APPSHEET_APP_ID ||!APPSHEET_API_KEY) return null;
  try {
    const response = await fetch(`https://api.appsheet.com/api/v2/apps/${APPSHEET_APP_ID}/tables/${encodeURIComponent(tableName)}/Action`, {
      method: "POST",
      headers: { ApplicationAccessKey: APPSHEET_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ Action: action, Properties: { Locale: "en-US", TimeZone: "Asia/Beirut" }, Rows: rows })
    });
    const text = await response.text();
    console.log(`📡 AppSheet ${tableName}/${action}:`, response.status, text);
    return { ok: response.ok, status: response.status, text };
  } catch (error) { console.error(`❌ AppSheet ${tableName}/${action}:`, error); return null; }
}

async function getBotSessionTable(phone) {
  const rows = await getSheetRows("Bot Sessions");
  const normalized = normalizeWhatsAppNumber(phone);
  return rows.find(r => normalizeWhatsAppNumber(r["Phone"] || "") === normalized) || null;
}

async function openBot2Session(phone) {
  const now = new Date().toISOString();
  return await appSheetAction("Bot Sessions", "Add", [{
    Phone: normalizeWhatsAppNumber(phone),
    "Active Bot": "BOT2",
    Status: "ACTIVE",
    "Request ID": "",
    "Started At": now,
    "Closed At": "",
    "Last Activity": now
  }]);
}

async function getAllUserMessages(from) {
  const messages = await getSheetRows("Messages");
  const normalized = normalizeWhatsAppNumber(from);
  return messages.filter(row => normalizeWhatsAppNumber(row["Phone"] || "") === normalized);
}

async function getConversationHistory(from) {
  const messages = await getAllUserMessages(from);
  const userMessages = messages.filter(row => {
    const session = String(row["Bot Session"] || BOT1_SESSION).trim();
    return (session === BOT1_SESSION ||!row["Bot Session"]);
  }).slice(-10);
  console.log(`💬 Messages BOT1: ${userMessages.length}`);
  return userMessages;
}

async function saveToAppSheet(from, userMessage, aiReply, options = {}) {
  const botSession = options.botSession || BOT1_SESSION;
  const bot = options.bot || "BOT1";
  const messageType = options.messageType || "WHATSAPP";
  if (!APPSHEET_APP_ID ||!APPSHEET_API_KEY) return false;
  try {
    const today = new Date().toISOString().split('T')[0];
    const row = {
      Phone: normalizeWhatsAppNumber(from),
      CustomerMessage: userMessage || "",
      AIReply: aiReply || "",
      Date: today,
      "Bot Session": botSession,
      Bot: bot,
      "Message Type": messageType
    };
    const result = await appSheetAction("Messages", "Add", [row]);
    return!!result?.ok;
  } catch (error) { console.error("❌ خطأ حفظ Messages:", error); return false; }
}

async function sendToBot2({ from, user, originalMessage }) {
  if (!BOT2_URL) return false;
  try {
    const payload = {
      bridgeKey: BOT2_BRIDGE_KEY,
      sourceBot: BOT1_SESSION,
      targetBot: BOT2_SESSION,
      event: "NEW_ORDER",
      command: BOT2_START_COMMAND,
      transferKey: BOT2_START_COMMAND,
      instruction: "START_ORDER_REGISTRATION",
      phone: normalizeWhatsAppNumber(from),
      originalMessage: originalMessage,
      user: user? { userId: user.userId || "", customerId: user.customerId || "", name: user.name || "", mobile: user.mobile || "", whatsappNumber: user.whatsappNumber || "", area: user.area || "", role: user.role || "" } : null,
      startMessage: "يلا نبلّش تسجيل الأوردر 😊 شو حابب تطلب؟"
    };
    console.log("🔀 إرسال Bridge إلى BOT2:", JSON.stringify({ event: payload.event, command: payload.command, phone: payload.phone }));
    const response = await fetch(BOT2_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-md-bridge-key": BOT2_BRIDGE_KEY },
      body: JSON.stringify(payload)
    });
    const text = await response.text();
    console.log("🤖 نتيجة BOT2:", response.status, text);
    if (!response.ok) return false;
    return true;
  } catch (error) { console.error("❌ فشل Bridge إلى BOT2:", error); return false; }
}

async function transferToBot2({ from, user, originalMessage }) {
  if (!user) { console.error("❌ محاولة تحويل مستخدم غير مسجل إلى BOT2"); return false; }
  console.log("================================================");
  console.log("🔀 بدء الانتقال من BOT1 إلى BOT2 - بوابة فقط");
  console.log("📱 الهاتف:", normalizeWhatsAppNumber(from));
  console.log("================================================");
  await saveToAppSheet(from, originalMessage, "TRANSFER_TO_BOT2", { botSession: BOT1_SESSION, bot: "BOT1", messageType: "BOT_TRANSFER" });
  const sent = await sendToBot2({ from, user, originalMessage });
  if (!sent) { console.error("❌ BOT2 لم يستقبل Bridge"); return false; }
  const opened = await openBot2Session(from);
  if (!opened?.ok) { console.error("❌ فشل فتح جلسة BOT2 في جدول Bot Sessions"); return false; }
  console.log("✅ تم الانتقال - Session = BOT2 في جدول Bot Sessions");
  return true;
}

async function searchProducts(userMessage) {
  const products = await getSheetRows("Products");
  const stores = await getSheetRows("Stores");
  const areas = await getSheetRows("Areas");
  const message = normalizeText(userMessage);
  let mentionedStoreId = null;
  for (const store of stores) {
    const storeNameNorm = normalizeText(store["Store Name"]);
    if (!storeNameNorm) continue;
    if (message.includes(storeNameNorm)) { mentionedStoreId = store["Store ID"]; break; }
  }
  const stopWords = ["بدي", "بدّي", "اريد", "أريد", "اعرف", "موجود", "وين", "باي", "متجر", "سوبرماركت", "ميني", "ماركت", "بقالة", "محل", "عند", "شو", "عن", "المنتج", "منتج", "في", "منو", "فيه"];
  const words = message.split(" ").filter(w => w.length >= 2 &&!stopWords.includes(w));
  if (!words.length) return [];
  const results = [];
  for (const product of products) {
    const available = normalizeText(product["Available"]);
    if (available!== "yes") continue;
    if (String(product["Active"]).toUpperCase()!== "TRUE") continue;
    const productName = normalizeText(product["Product Name"]);
    if (!productName) continue;
    let score = 0;
    for (const word of words) {
      if (productName === word) score += 10;
      else if (productName.startsWith(word)) score += 7;
      else if (productName.includes(word)) score += 2;
    }
    if (message.includes(productName)) score += 5;
    if (score <= 0) continue;
    const store = stores.find(s => String(s["Store ID"]) === String(product["Store ID"]));
    results.push({
      score, storeId: product["Store ID"], productName: product["Product Name"], unit: product["Unit"], price: product["Price"],
      storeName: store?.["Store Name"] || "غير معروف", address: store?.["Adress"] || "",
      areaName: areas.find(a => String(a["Area ID"]) === String(store?.["Area"] || product["Area"]))?.["Area Name"] || ""
    });
  }
  results.sort((a, b) => {
    if (mentionedStoreId) {
      const aMatch = String(a.storeId) === String(mentionedStoreId);
      const bMatch = String(b.storeId) === String(mentionedStoreId);
      if (aMatch &&!bMatch) return -1;
      if (!aMatch && bMatch) return 1;
    }
    return b.score - a.score;
  });
  let finalResults = results;
  if (mentionedStoreId) finalResults = results.filter(r => String(r.storeId) === String(mentionedStoreId));
  return finalResults.slice(0, 3);
}

async function getUserOrders(user) {
  if (!user) return [];
  const orders = await getSheetRows("Order Requuest");
  const isAdmin = String(user.role || "").toLowerCase().includes("admin");
  const customerId = String(user.customerId || "").trim();
  const userMobile = normalizeWhatsAppNumber(user.mobile || "");
  const results = [];
  for (const order of orders) {
    const orderCustomerId = String(order["Customer ID"] || "").trim();
    const orderMobile = normalizeWhatsAppNumber(order["Mobile"] || "");
    if (isAdmin) { results.push(order); continue; }
    if (customerId && orderCustomerId === customerId) { results.push(order); continue; }
    if (userMobile && orderMobile && userMobile === orderMobile) results.push(order);
  }
  return results;
}

async function getOrderDetails(requestId) {
  const details = await getSheetRows("Order Details");
  const products = await getSheetRows("Products");
  const stores = await getSheetRows("Stores");
  const areas = await getSheetRows("Areas");
  const result = [];
  for (const detail of details) {
    if (String(detail["Request ID"] || "").trim()!== String(requestId || "").trim()) continue;
    const productId = detail["Product ID"] || ""; const storeId = detail["Store ID"] || ""; const areaId = detail["Area"] || "";
    const product = products.find(p => String(p["Product ID"] || "") === String(productId));
    const store = stores.find(s => String(s["Store ID"] || "") === String(storeId));
    const area = areas.find(a => String(a["Area ID"] || "") === String(areaId));
    result.push({ productName: product?.["Product Name"] || "منتج غير معروف", qty: detail["Qty"] || "", unitPrice: detail["Unit Price"] || "", storeName: store?.["Store Name"] || "متجر غير معروف", areaName: area?.["Area Name"] || "منطقة غير معروفة" });
  }
  return result;
}

async function buildOrderContext(user, userMessage) {
  const orders = await getUserOrders(user);
  if (!orders.length) return { orders: [], selectedOrder: null, details: [] };
  const message = normalizeText(userMessage);
  let selectedOrder = null;
  for (const order of orders) {
    const requestId = normalizeText(order["Request ID"]);
    if (requestId && message.includes(requestId)) { selectedOrder = order; break; }
  }
  if (!selectedOrder) selectedOrder = orders[orders.length - 1];
  const details = await getOrderDetails(selectedOrder["Request ID"]);
  const safeOrders = orders.map(order => ({ requestId: order["Request ID"] || "", area: order["Area"] || "", deliveryAddress: order["Delivery Adress"] || "", deliveryFee: order["Delivery Fee"] || "", assignedDriver: order["Assigned Driver"] || "", approvalStatus: order["Approval Status"] || "", deliveryStatus: order["Delivery Status"] || "", itemsCost: order["Items Cost"] || "", totalAmount: order["Total Amount"] || "" }));
  return { orders: safeOrders, selectedOrder: selectedOrder? { requestId: selectedOrder["Request ID"] || "", area: selectedOrder["Area"] || "", deliveryAddress: selectedOrder["Delivery Adress"] || "", deliveryFee: selectedOrder["Delivery Fee"] || "", assignedDriver: selectedOrder["Assigned Driver"] || "", approvalStatus: selectedOrder["Approval Status"] || "", deliveryStatus: selectedOrder["Delivery Status"] || "", itemsCost: selectedOrder["Items Cost"] || "", totalAmount: selectedOrder["Total Amount"] || "" } : null, details };
}

// ======================================================
// MARKETPLACE PRODUCT RESPONSE
// ======================================================
function buildMarketplaceProductText(product) {
  return (
    `📦 *${product.name || "منتج"}*\n\n` +
    `🏷 الماركة: ${product.brand || "غير معروف"}\n` +
    `🔢 الباركود: ${product.code}\n` +
    `⚖ الحجم: ${product.quantity || "غير محدد"}\n` +
    `🌍 البلد: ${product.countries || "غير محدد"}`
  );
}

async function getAIReply(userMessage, user, productResults, orderContext, history) {
  if (!GROQ_KEY) return user? "أهلا بك! كيف بقدر ساعدك اليوم؟ 😊" : `أهلا وسهلا فيك بـ MD-Marketplace 😊\n\nكيف بقدر ساعدك اليوم؟`;
  try {
    let userContext = "";
    if (user) {
      userContext = `\nالمستخدم مسجّل ومعروف في نظام Users.\nبيانات المستخدم الموثوقة:\nالاسم:\n${user.name || "غير معروف"}\nالدور:\n${user.role || "غير معروف"}\nCustomer ID:\n${user.customerId || "غير موجود"}\nUser ID:\n${user.userId || "غير موجود"}\nرقم WhatsApp:\n${user.whatsappNumber || "غير موجود"}\n`;
    } else {
      userContext = `\n⚠ المستخدم زائر وغير مسجّل في نظام Users.\nهذا يعني:\n- لا يوجد User ID موثوق.\n- لا يوجد Customer ID موثوق.\n- لا يوجد وصول إلى الطلبات.\n- لا يوجد وصول إلى بيانات شخصية.\n- لا يجوز إعطاؤه أي معلومات عن طلبات أي شخص.\n- يمكن مساعدته في الاستفسارات العامة والمنتجات والمتاجر والموقع.\n- إذا أراد إنشاء طلب، يجب توجيهه بلطف إلى تسجيل الدخول أولاً.\n`;
    }
    const productContext = productResults.length? JSON.stringify(productResults) : "لا توجد نتائج منتجات مؤكدة.";
    const orderData = orderContext.orders.length? JSON.stringify(orderContext.orders) : "لا توجد طلبات متاحة لهذا المستخدم.";
    const selectedOrder = orderContext.selectedOrder? JSON.stringify(orderContext.selectedOrder) : "لا يوجد طلب محدد.";
    const orderDetails = orderContext.details.length? JSON.stringify(orderContext.details) : "لا توجد تفاصيل للطلب المحدد.";
    const historyText = history.length? history.map(m => `العميل: ${m["CustomerMessage"] || ""}\nالبوت: ${m["AIReply"] || ""}`).join("\n") : "لا توجد محادثة سابقة.";
    const systemPrompt = `\nأنت مساعدك الذكي من MD-Marketplace.\nتحدث باللهجة اللبنانية الودودة والطبيعية.\nلا تكن دجّاً أو مزعجاً.\nلا تطلب من المستخدم تسجيل الدخول إلا عندما تكون الوظيفة التي يطلبها تحتاج فعلاً إلى حساب.\nموقعنا الرسمي:\n${WEBSITE_URL}\nايميلنا:\n${INFO_EMAIL}\n${userContext}\n==================================================\nقواعد أساسية\n==================================================\n1. إذا كان المستخدم معروفاً استخدم اسمه عند الحاجة.\n2. لا تنادِ المستخدم برقم الهاتف.\n3. إذا كان المستخدم غير مسجّل، لا تخبره أنه "غير موجود في النظام" بطريقة تقنية.\n4. إذا كان المستخدم غير مسجّل، عامله كزائر طبيعي.\n5. لا تعطي أي معلومات عن الطلبات لزائر غير مسجّل.\n6. لا تسمح للمستخدم بالوصول إلى طلبات شخص آخر.\n7. بيانات الطلبات الموجودة أدناه موثوقة فقط.\n8. لا تخترع أي طلب.\n9. لا تخترع أي سعر.\n10. لا تخترع أي منتج.\n11. لا تخترع أي متجر.\n12. لا تخترع أي منطقة.\n13. لا تخترع أي حالة طلب.\n14. إذا لم توجد معلومة مؤكدة، قل إن المعلومة غير متوفرة لديك.\n==================================================\nالزائر غير المسجّل\n==================================================\nإذا كان المستخدم غير مسجّل:\n- الاستفسارات العامة: جاوب مباشرة وبشكل طبيعي.\n- سؤال عن الموقع: أعطه رابط الموقع.\n- سؤال عن المنتجات: استخدم نتائج المنتجات المؤكدة الموجودة لديك.\n- سؤال عن متجر: استخدم بيانات المتجر المؤكدة الموجودة لديك.\n- سؤال عن التواصل: أعطه ايميل التواصل.\n- سؤال عن كيفية استخدام الموقع: اشرح له ببساطة.\n- سؤال عن إنشاء طلب / شراء / عمل أوردر: لا تنقله إلى BOT2.\n أخبره بلطف مثلاً:\n "أكيد 😊 فيك تعمل طلب بكل سهولة، بس حتى نقدر نسجّل طلبك ونحافظ على بياناتك ونخلي تجربة الطلب سلسة، يرجى تسجيل الدخول أو إنشاء حساب على موقعنا:\n ${WEBSITE_URL}"\n لا تكرر نفس الجملة حرفياً دائماً إذا كان السياق يسمح بصياغة ألطف.\n- إذا سأل عن طلبه أو حالة طلب: قل له إن متابعة الطلبات تحتاج تسجيل الدخول، مثلاً:\n "أكيد، فينا نساعدك بمتابعة طلبك 😊 بس حتى نعرضلك طلباتك بشكل آمن، يرجى تسجيل الدخول إلى حسابك على الموقع."\n- لا تقل له "سجّل الدخول" إذا كان فقط يسأل سؤالاً عاماً لا يحتاج حساب.\n==================================================\nالمستخدم المسجّل\n==================================================\nإذا كان المستخدم مسجلاً:\n- يمكنه الاستفسار عن المنتجات والمتاجر.\n- يمكنه الاستفسار عن طلباته فقط.\n- إذا أراد إنشاء طلب، النظام يتولى تحويله إلى BOT2.\n- لا تخبره بتفاصيل تقنية عن BOT1 أو BOT2.\n- لا تذكر رقم هاتف السائق إلا إذا طلبه صراحة.\n==================================================\nقواعد الموقع\n==================================================\nإذا سأل عن الموقع:\nجاوب:\n"موقعنا هو ${WEBSITE_URL} فيك تشوف المنتجات والمتاجر وتستفيد من خدماتنا 😊"\nإذا سأل عن التواصل:\nجاوب:\n"فيك تتواصل معنا على ${INFO_EMAIL} 😊"\nإذا سأل مين أنت:\nجاوب:\n"أنا مساعدك الذكي من MD-Marketplace 😊 كيف بقدر ساعدك اليوم؟"\n==================================================\nقواعد المنتجات\n==================================================\nممنوع Markdown Tables.\nإذا لا توجد نتائج مؤكدة لا تخترع.\nإذا توجد نتائج اعرضها كما هي.\nشكل المنتج:\n🛒 المنتج: {Product Name} {Unit}\n💰 السعر: {Price}\n🏪 المتجر: {Store Name}\n📍 العنوان: {Address} - {Area}\n==================================================\nقواعد الطلبات\n==================================================\n- استخدم Order Request.\n- Delivery Status مهم.\n- لا تغيّر الحالة.\n- إذا Assigned Driver موجود يمكن ذكر اسمه.\n- لا تذكر رقم هاتف السائق إلا إذا طلب المستخدم ذلك.\n- لا تستخدم بيانات الطلبات إلا للمستخدم المسجّل.\n- إذا المستخدم غير مسجّل فإن "طلبات المستخدم" يجب اعتبارها غير متاحة.\n- لا تحاول تخمين رقم طلب أو حالة طلب.\n==================================================\nأسلوب المحادثة\n==================================================\n- لا تعيد الترحيب في كل رسالة.\n- لا تقل "أنا ذكاء اصطناعي" إلا إذا سأل.\n- تحدث بلبناني طبيعي.\n- كن مفيداً ومختصراً.\n- لا تكن دجّاً.\n- لا تفرض التسجيل على المستخدم بدون سبب.\n- إذا السؤال يحتاج توضيحاً، اسأل سؤالاً واحداً فقط.\n- لا تعطِ معلومات تقنية عن النظام الداخلي.\n==================================================\nالمحادثة السابقة\n==================================================\n${historyText}\n==================================================\nنتائج المنتجات\n==================================================\n${productContext}\n==================================================\nطلبات المستخدم\n==================================================\n${orderData}\n==================================================\nالطلب المحدد\n==================================================\n${selectedOrder}\n==================================================\nتفاصيل الطلب\n==================================================\n${orderDetails}\n`;
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "openai/gpt-oss-20b", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMessage }], temperature: 0.4 })
    });
    const data = await res.json();
    if (data.error ||!data.choices?.[0]?.message?.content) {
      console.error("❌ Groq Error:", JSON.stringify(data.error));
      return "صار ضغط شوي على السيرفر، جرب تبعتلي بعد وقت قصير 🙏";
    }
    return data.choices?.[0]?.message?.content || "أهلا بك! كيف بقدر ساعدك اليوم؟ 😊";
  } catch (error) { console.error("❌ خطأ اتصال Groq:", error); return "عذراً، صار عندي مشكلة صغيرة. جرب تبعتلي مرة تانية."; }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === VERIFY_TOKEN) return new Response(challenge, { status: 200 });
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const Name = body.name || body.Name;
    const PIN = body.password || body.PIN;
    const Mobile = body.from || body.Mobile;
    if (body.type === "new_user_welcome") {
      const targetPhone = Mobile;
      if (!targetPhone) return Response.json({ status: "ok" }, { status: 200 });
      const customerName = Name || "عميلنا العزيز";
      const customerPIN = PIN || "";
      const welcomeMessage = `أهلاً بك يا ${customerName} في MD-Marketplace! 🌸\n\nتم إنشاء حسابك بنجاح.\n\nرمز الـ PIN الخاص بك هو:\n*${customerPIN}*\n\nنتمنى لك تجربة تسوق ممتعة! 😊`;
      await sendMessage(targetPhone, welcomeMessage);
      await saveToAppSheet(targetPhone, "تسجيل حساب جديد", welcomeMessage, { botSession: BOT1_SESSION, bot: "BOT1", messageType: "NEW_USER_WELCOME" });
      return Response.json({ status: "ok" }, { status: 200 });
    }
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    const from = message?.from || Mobile;
    const userText = message?.text?.body || body.text;
    if (!from ||!userText) return Response.json({ status: "ok" }, { status: 200 });
    console.log(`📩 استقبال رسالة: ${from} | ${userText}`);

    // ======================================================
    // MARKETPLACE 2M BARCODE SEARCH
    // ======================================================
    const marketplaceBarcode = normalizeMarketplaceBarcode(userText);
    if (marketplaceBarcode && marketplaceBarcode.length >= 8 && marketplaceBarcode.length <= 14 && /^\d+$/.test(marketplaceBarcode)) {
      console.log(`🔎 Marketplace 2M Barcode Search: ${marketplaceBarcode}`);
      const marketplaceProduct = await findMarketplaceProductByBarcode(marketplaceBarcode);
      if (!marketplaceProduct) {
        await sendMessage(from, `عذراً 🙏\n\nما لقينا منتج بالباركود:\n${marketplaceBarcode}\n\nتأكد من الرقم وجرب مرة تانية.`);
        return Response.json({ status: "ok", found: false, barcode: marketplaceBarcode, source: "MARKETPLACE_2M" }, { status: 200 });
      }
      const marketplaceReply = buildMarketplaceProductText(marketplaceProduct);
      if (marketplaceProduct.image && marketplaceProduct.image.startsWith("http")) {
        try {
          const imageResponse = await fetch(`https://graph.facebook.com/v26.0/${PHONE_ID}/messages`, {
            method: "POST",
            headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: normalizeWhatsAppNumber(from),
              type: "image",
              image: { link: marketplaceProduct.image, caption: marketplaceReply },
            }),
          });
          if (!imageResponse.ok) {
            console.error("⚠ فشل إرسال صورة المنتج، إرسال النص بدلاً منها");
            await sendMessage(from, marketplaceReply);
          }
        } catch (error) {
          console.error("❌ Marketplace image error:", error.message);
          await sendMessage(from, marketplaceReply);
        }
      } else {
        await sendMessage(from, marketplaceReply);
      }
      await saveToAppSheet(from, userText, marketplaceReply, { botSession: BOT1_SESSION, bot: "BOT1", messageType: "MARKETPLACE_BARCODE" });
      return Response.json({ status: "ok", found: true, source: "MARKETPLACE_2M", barcode: marketplaceProduct.code, product: marketplaceProduct }, { status: 200 });
    }

    const whatsappNumber = normalizeWhatsAppNumber(from);
    const user = await getUserByWhatsAppNumber(whatsappNumber);
    const sessionRow = await getBotSessionTable(whatsappNumber);
    const currentBotSession = sessionRow? String(sessionRow["Active Bot"] || BOT1_SESSION).trim() : BOT1_SESSION;
    console.log(`🤖 Bot Session من جدول Bot Sessions: ${currentBotSession}`);
    if (currentBotSession === BOT2_SESSION) {
      console.log(`⛔ المستخدم مع BOT2 — تحويل رسالة واتساب من BOT1 لـ BOT2: ${whatsappNumber} | ${userText}`);
      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.md-marketplace.store";
        const forwardRes = await fetch(`${siteUrl}/api/whatsapp-bot2`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ from: whatsappNumber, text: userText, whatsappNumber: whatsappNumber })
        });
        const forwardText = await forwardRes.text();
        console.log(`📤 تحويل لـ BOT2: ${forwardRes.status} | ${forwardText.substring(0, 300)}`);
      } catch (e) {
        console.error("❌ فشل تحويل لـ BOT2:", e.message);
      }
      return Response.json({ status: "ok", forwarded_to: "BOT2" }, { status: 200 });
    }
    const newOrderIntent = isNewOrderIntent(userText);
    console.log(`🛒 نية إنشاء طلب جديد: ${newOrderIntent}`);
    if (newOrderIntent && user) {
      console.log("🚀 المستخدم المسجّل يريد إنشاء طلب جديد - تحويل لبوابة BOT2");
      const transferred = await transferToBot2({ from: whatsappNumber, user, originalMessage: userText });
      if (transferred) {
        console.log("✅ BOT1 سلم المحادثة إلى BOT2 عبر جدول Bot Sessions");
        return Response.json({ status: "ok", transferred: true, target: "BOT2", command: BOT2_START_COMMAND }, { status: 200 });
      }
      console.error("⚠ فشل الانتقال إلى BOT2 — BOT1 سيكمل");
    }
    let productResults = [];
    let orderContext = { orders: [], selectedOrder: null, details: [] };
    productResults = await searchProducts(userText);
    if (user) orderContext = await buildOrderContext(user, userText);
    const history = await getConversationHistory(whatsappNumber);
    const aiReply = await getAIReply(userText, user, productResults, orderContext, history);
    console.log("🤖 الرد:", aiReply);
    await sendMessage(whatsappNumber, aiReply);
    await saveToAppSheet(whatsappNumber, userText, aiReply, { botSession: BOT1_SESSION, bot: "BOT1", messageType: "WHATSAPP" });
    return Response.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("❌ خطأ POST:", error);
    return Response.json({ status: "ok" }, { status: 200 });
  }
}
