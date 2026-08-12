import { google } from "googleapis";

export const dynamic = "force-dynamic";

// ======================================================
// ENV
// ======================================================

const VERIFY_TOKEN =
  process.env.WHATSAPP_VERIFY_TOKEN || "mjahto123";

const WHATSAPP_TOKEN =
  process.env.WHATSAPP_TOKEN;

const PHONE_ID =
  process.env.WHATSAPP_PHONE_ID || "1180849365118543";

const GROQ_KEY =
  process.env.GROQ_API_KEY;

const APPSHEET_APP_ID =
  process.env.APPSHEET_APP_ID;

const APPSHEET_API_KEY =
  process.env.APPSHEET_API_KEY;

// Google Sheets
const GOOGLE_SHEETS_ID =
  process.env.GOOGLE_SHEETS_ID;

const GOOGLE_CLIENT_EMAIL =
  process.env.GOOGLE_CLIENT_EMAIL;

const GOOGLE_PRIVATE_KEY =
  process.env.GOOGLE_PRIVATE_KEY;

// ======================================================
// CACHE ONLY - الإضافة الوحيدة
// ======================================================
const SHEETS_CACHE = new Map();
const CACHE_TTL = 1000 * 60 * 5; // 5 دقايق

function getCache(key) {
  const item = SHEETS_CACHE.get(key);
  if (!item) return null;
  if (Date.now() - item.t > CACHE_TTL) {
    SHEETS_CACHE.delete(key);
    return null;
  }
  return item.v;
}
function setCache(key, v) {
  SHEETS_CACHE.set(key, { v, t: Date.now() });
}

// ======================================================
// 1. توحيد رقم WhatsApp
// ======================================================

function normalizeWhatsAppNumber(phone) {
  let clean =
    String(phone || "").replace(/\D/g, "");
  if (clean.startsWith("03")) {
    clean =
      "9613" + clean.substring(2);
  }
  else if (
    clean.length === 7 &&
    clean.startsWith("3")
  ) {
    clean =
      "961" + clean;
  }
  return clean;
}


// ======================================================
// 2. إرسال WhatsApp
// ======================================================

async function sendMessage(to, text) {
  if (!WHATSAPP_TOKEN) {
    console.error(
      "❌ WHATSAPP_TOKEN غير موجود"
    );
    return;
  }
  const cleanPhone =
    normalizeWhatsAppNumber(to);
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          messaging_product:
            "whatsapp",
          to:
            cleanPhone,
          type:
            "text",
          text: {
            body:
              text
          }
        })
      }
    );
    const data =
      await res.json();
    console.log(
      "📤 نتيجة الإرسال للواتساب:",
      JSON.stringify(data)
    );
  } catch (error) {
    console.error(
      "❌ خطأ إرسال واتساب:",
      error
    );
  }
}


// ======================================================
// 3. Google Sheets Client
// ======================================================

function getGoogleSheetsClient() {
  if (
    !GOOGLE_SHEETS_ID ||
    !GOOGLE_CLIENT_EMAIL ||
    !GOOGLE_PRIVATE_KEY
  ) {
    console.error(
      "❌ Google Sheets credentials ناقصة"
    );
    return null;
  }
  try {
    const auth =
      new google.auth.GoogleAuth({
        credentials: {
          client_email:
            GOOGLE_CLIENT_EMAIL,
          private_key:
            GOOGLE_PRIVATE_KEY.replace(
              /\\n/g,
              "\n"
            )
        },
        scopes: [
          "https://www.googleapis.com/auth/spreadsheets.readonly"
        ]
      });
    return google.sheets({
      version:
        "v4",
      auth
    });
  } catch (error) {
    console.error(
      "❌ خطأ إنشاء Google Sheets client:",
      error
    );
    return null;
  }
}


// ======================================================
// 4. قراءة أي جدول Google Sheets - مع كاش فقط
// ======================================================

async function getSheetRows(
  sheetName
) {
  const cached = getCache(sheetName);
  if (cached) {
    console.log(`⚡ كاش: ${sheetName} (${cached.length})`);
    return cached;
  }

  const sheets =
    getGoogleSheetsClient();
  if (!sheets) {
    return [];
  }
  try {
    const response =
      await sheets.spreadsheets.values.get({
        spreadsheetId:
          GOOGLE_SHEETS_ID,
        range:
          `${sheetName}!A:Z`
      });
    const rows =
      response.data.values || [];
    if (!rows.length) {
      console.log(
        `⚠ جدول ${sheetName} فارغ`
      );
      return [];
    }
    const headers =
      rows[0].map(
        h =>
          String(h || "").trim()
      );
    const result = rows
      .slice(1)
      .map(row => {
        const obj = {};
        headers.forEach(
          (header, index) => {
            obj[header] =
              row[index] || "";
          }
        );
        return obj;
      });
    setCache(sheetName, result);
    return result;
  } catch (error) {
    console.error(
      `❌ خطأ قراءة جدول ${sheetName}:`,
      error.message
    );
    return [];
  }
}


// ======================================================
// 5. تطبيع النص للبحث
// ======================================================

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[؟?!.,،]/g, " ")
    .replace(/\s+/g, " ");
}


// ======================================================
// 6. التعرف على المستخدم
// ======================================================

async function getUserByWhatsAppNumber(
  whatsappNumber
) {
  const normalized =
    normalizeWhatsAppNumber(
      whatsappNumber
    );
  console.log(
    `🔎 البحث في Users | WhatsApp Number: ${normalized}`
  );
  const rows =
    await getSheetRows("Users");
  console.log(
    `📋 عدد مستخدمي Users: ${rows.length}`
  );
  for (const row of rows) {
    const rowWhatsApp =
      normalizeWhatsAppNumber(
        row["WhatsApp Number"] ||
        ""
      );
    if (
      rowWhatsApp === normalized
    ) {
      const user = {
        userId:
          row["User ID"] || "",
        role:
          row["Role"] || "",
        name:
          row["Name"] || "",
        mobile:
          row["Mobile"] || "",
        customerId:
          row["Customer ID"] || "",
        whatsappNumber:
          row["WhatsApp Number"] || "",
        storeId:
          row["Store ID"] || "",
        area:
          row["Area"] || "",
        status:
          row["Status"] || "",
        active:
          row["Active"] || ""
      };
      console.log(
        "🎯 تم التعرف على المستخدم:",
        JSON.stringify(user)
      );
      return user;
    }
  }
  console.log(
    `⚠ الرقم ${normalized} غير موجود في Users`
  );
  return null;
}


// ======================================================
// 7. البحث عن Products
// ======================================================

async function searchProducts(
  userMessage
) {
  const products =
    await getSheetRows(
      "Products"
    );
  const stores =
    await getSheetRows(
      "Stores"
    );
  const categories =
    await getSheetRows(
      "Categories"
    );
  const areas =
    await getSheetRows(
      "Areas"
    );
  const message =
    normalizeText(
      userMessage
    );
  const stopWords = [
    "بدي",
    "بدّي",
    "اريد",
    "أريد",
    "اعرف",
    "معرفة",
    "سعر",
    "السعر",
    "وين",
    "موجود",
    "موجودة",
    "باي",
    "بأي",
    "متجر",
    "عند",
    "شو",
    "هو",
    "هي",
    "عن",
    "المنتج",
    "منتج",
    "لوين",
    "في"
  ];
  const words =
    message
      .split(" ")
      .filter(
        word =>
          word.length >= 2 &&
          !stopWords.includes(word)
      );
  if (!words.length) {
    console.log(
      "🔎 لا يوجد اسم منتج واضح في الرسالة"
    );
    return [];
  }
  const results = [];
  for (const product of products) {
    const productName =
      normalizeText(
        product["Product Name"]
      );
    if (!productName) {
      continue;
    }
    let score = 0;
    for (const word of words) {
      if (
        productName.includes(word)
      ) {
        score += 2;
      }
    }
    if (
      normalizeText(message)
        .includes(productName)
    ) {
      score += 5;
    }
    if (score <= 0) {
      continue;
    }
    const storeId =
      product["Store ID"] || "";
    const store =
      stores.find(
        s =>
          String(
            s["Store ID"] || ""
          ) === String(storeId)
      );
    const categoryId =
      product["Category"] ||
      "";
    const category =
      categories.find(
        c =>
          String(
            c["Category ID"] || ""
          ) === String(categoryId)
      );
    const areaId =
      product["Area"] ||
      store?.["Area"] ||
      "";
    const area =
      areas.find(
        a =>
          String(
            a["Area ID"] || ""
          ) === String(areaId)
      );
    results.push({
      score,
      productName:
        product["Product Name"] || "",
      unit:
        product["Unit"] || "",
      price:
        product["Price"] || "",
      description:
        product["Description"] || "",
      available:
        product["Available"] || "",
      active:
        product["Active"] || "",
      storeName:
        store?.["Store Name"] ||
        "غير معروف",
      categoryName:
        category?.["Category Name"] ||
        "",
      address:
        store?.["Adress"] ||
        "",
      areaName:
        area?.["Area Name"] ||
        "",
      openTime:
        store?.["Open Time"] ||
        "",
      closeTime:
        store?.["Close Time"] ||
        ""
    });
  }
  results.sort(
    (a, b) =>
      b.score - a.score
  );
  const finalResults =
    results.slice(0, 10);
  console.log(
    "🔎 نتائج البحث عن المنتجات:",
    JSON.stringify(
      finalResults
    )
  );
  return finalResults;
}


// ======================================================
// 8. جلب طلبات المستخدم
// ======================================================

async function getUserOrders(
  user
) {
  if (!user) {
    return [];
  }
  const orders =
    await getSheetRows(
      "Order Requuest"
    );
  const isAdmin =
    String(user.role || "")
      .toLowerCase()
      .includes("admin");
  const customerId =
    String(
      user.customerId || ""
    ).trim();
  const userMobile =
    normalizeWhatsAppNumber(
      user.mobile || ""
    );
  const results = [];
  for (const order of orders) {
    const orderCustomerId =
      String(
        order["Customer ID"] || ""
      ).trim();
    const orderMobile =
      normalizeWhatsAppNumber(
        order["Mobile"] || ""
      );
    if (isAdmin) {
      results.push(order);
      continue;
    }
    if (
      customerId &&
      orderCustomerId === customerId
    ) {
      results.push(order);
      continue;
    }
    if (
      userMobile &&
      orderMobile &&
      userMobile === orderMobile
    ) {
      results.push(order);
      continue;
    }
  }
  console.log(
    `📦 عدد الطلبات المسموح بها للمستخدم: ${results.length}`
  );
  return results;
}


// ======================================================
// 9. جلب تفاصيل طلب
// ======================================================

async function getOrderDetails(
  requestId
) {
  const details =
    await getSheetRows(
      "Order Details"
    );
  const products =
    await getSheetRows(
      "Products"
    );
  const stores =
    await getSheetRows(
      "Stores"
    );
  const areas =
    await getSheetRows(
      "Areas"
    );
  const result = [];
  for (const detail of details) {
    if (
      String(
        detail["Request ID"] || ""
      ).trim() !==
      String(requestId || "").trim()
    ) {
      continue;
    }
    const productId =
      detail["Product ID"] || "";
    const storeId =
      detail["Store ID"] || "";
    const areaId =
      detail["Area"] || "";
    const product =
      products.find(
        p =>
          String(
            p["Product ID"] || ""
          ) === String(productId)
      );
    const store =
      stores.find(
        s =>
          String(
            s["Store ID"] || ""
          ) === String(storeId)
      );
    const area =
      areas.find(
        a =>
          String(
            a["Area ID"] || ""
          ) === String(areaId)
      );
    result.push({
      productName:
        product?.["Product Name"] ||
        "منتج غير معروف",
      qty:
        detail["Qty"] || "",
      unitPrice:
        detail["Unit Price"] || "",
      storeName:
        store?.["Store Name"] ||
        "متجر غير معروف",
      areaName:
        area?.["Area Name"] ||
        "منطقة غير معروفة"
    });
  }
  console.log(
    `🧾 تفاصيل الطلب ${requestId}:`,
    JSON.stringify(result)
  );
  return result;
}


// ======================================================
// 10. تجهيز بيانات الطلبات للـAI
// ======================================================

async function buildOrderContext(
  user,
  userMessage
) {
  const orders =
    await getUserOrders(
      user
    );
  if (!orders.length) {
    return {
      orders: [],
      selectedOrder:
        null,
      details: []
    };
  }
  const message =
    normalizeText(
      userMessage
    );
  let selectedOrder =
    null;
  for (const order of orders) {
    const requestId =
      normalizeText(
        order["Request ID"]
      );
    if (
      requestId &&
      message.includes(
        requestId
      )
    ) {
      selectedOrder =
        order;
      break;
    }
  }
  if (!selectedOrder) {
    selectedOrder =
      orders[orders.length - 1];
  }
  const details =
    await getOrderDetails(
      selectedOrder["Request ID"]
    );
  const safeOrders =
    orders.map(
      order => ({
        requestId:
          order["Request ID"] || "",
        area:
          order["Area"] || "",
        deliveryAddress:
          order["Delivery Adress"] || "",
        deliveryFee:
          order["Delivery Fee"] || "",
        assignedDriver:
          order["Assigned Driver"] || "",
        approvalStatus:
          order["Approval Status"] || "",
        deliveryStatus:
          order["Delivery Status"] || "",
        itemsCost:
          order["Items Cost"] || "",
        totalAmount:
          order["Total Amount"] || ""
      })
    );
  return {
    orders:
      safeOrders,
    selectedOrder:
      selectedOrder
        ? {
            requestId:
              selectedOrder["Request ID"] || "",
            area:
              selectedOrder["Area"] || "",
            deliveryAddress:
              selectedOrder["Delivery Adress"] || "",
            deliveryFee:
              selectedOrder["Delivery Fee"] || "",
            assignedDriver:
              selectedOrder["Assigned Driver"] || "",
            approvalStatus:
              selectedOrder["Approval Status"] || "",
            deliveryStatus:
              selectedOrder["Delivery Status"] || "",
            itemsCost:
              selectedOrder["Items Cost"] || "",
            totalAmount:
              selectedOrder["Total Amount"] || ""
          }
        : null,
    details
  };
}


// ======================================================
// 11. حفظ الرسالة في Messages
// ======================================================

async function saveToAppSheet(
  from,
  userMessage,
  aiReply
) {
  if (
    !APPSHEET_APP_ID ||
    !APPSHEET_API_KEY
  ) {
    console.error(
      "❌ AppSheet credentials ناقصة"
    );
    return;
  }
  try {
    const today =
      new Date()
        .toLocaleDateString(
          "en-GB",
          {
            timeZone:
              "Asia/Beirut"
          }
        );
    const res =
      await fetch(
        `https://api.appsheet.com/api/v2/apps/${APPSHEET_APP_ID}/tables/Messages/Action`,
        {
          method:
            "POST",
          headers: {
            ApplicationAccessKey:
              APPSHEET_API_KEY,
            "Content-Type":
              "application/json"
          },
          body:
            JSON.stringify({
              Action:
                "Add",
              Properties: {
                TimeZone:
                  "Asia/Beirut"
              },
              Rows: [
                {
                  Phone:
                    from,
                  CustomerMessage:
                    userMessage,
                  AIReply:
                    aiReply,
                  Date:
                    today
                }
              ]
            })
        }
      );
    const result =
      await res.text();
    console.log(
      "💾 نتيجة الحفظ في AppSheet:",
      res.status,
      result
    );
  } catch (error) {
    console.error(
      "❌ خطأ AppSheet:",
      error
    );
  }
}


// ======================================================
// 12. قراءة آخر المحادثة
// ======================================================

async function getConversationHistory(
  from
) {
  const messages =
    await getSheetRows(
      "Messages"
    );
  const normalized =
    normalizeWhatsAppNumber(
      from
    );
  const userMessages =
    messages
      .filter(
        row =>
          normalizeWhatsAppNumber(
            row["Phone"] || ""
          ) === normalized
      )
      .slice(-10);
  console.log(
    `💬 عدد رسائل المحادثة السابقة المستخدمة: ${userMessages.length}`
  );
  return userMessages;
}


// ======================================================
// 13. Groq AI
// ======================================================

async function getAIReply(
  userMessage,
  user,
  productResults,
  orderContext,
  history
) {
  if (!GROQ_KEY) {
    return
      "أهلا بك! كيف بقدر ساعدك اليوم؟ 😊";
  }
  try {
    let userContext =
      "المستخدم غير معروف في نظام Users.";
    if (user) {
      userContext = `
بيانات المستخدم الموثوقة:

الاسم:
${user.name || "غير معروف"}

الدور:
${user.role || "غير معروف"}

Customer ID:
${user.customerId || "غير موجود"}

User ID:
${user.userId || "غير موجود"}

رقم WhatsApp:
${user.whatsappNumber || "غير موجود"}

`;
    }


    const productContext =
      productResults.length
        ? JSON.stringify(
            productResults
          )
        : "لا توجد نتائج منتجات مؤكدة.";


    const orderData =
      orderContext.orders.length
        ? JSON.stringify(
            orderContext.orders
          )
        : "لا توجد طلبات متاحة لهذا المستخدم.";


    const selectedOrder =
      orderContext.selectedOrder
        ? JSON.stringify(
            orderContext.selectedOrder
          )
        : "لا يوجد طلب محدد.";


    const orderDetails =
      orderContext.details.length
        ? JSON.stringify(
            orderContext.details
          )
        : "لا توجد تفاصيل للطلب المحدد.";


    const historyText =
      history.length
        ? history
            .map(
              m =>
                `العميل: ${m["CustomerMessage"] || ""}\nالبوت: ${m["AIReply"] || ""}`
            )
            .join("\n")
        : "لا توجد محادثة سابقة.";


    const systemPrompt = `
أنت موظف خدمة العملاء في MD-Marketplace.

تحدث باللهجة اللبنانية الودودة والطبيعية.

${userContext}


==============================
قواعد الهوية والأمان
==============================

1. إذا كان المستخدم معروفاً، استخدم اسمه عند الحاجة.

2. لا تنادِ المستخدم برقم الهاتف.

3. إذا كان المستخدم غير موجود في Users:
   ممنوع إعطاؤه أي معلومات عن الطلبات.

4. لا تسمح للمستخدم بالوصول إلى طلبات شخص آخر.

5. بيانات الطلبات الموجودة أدناه تم تجهيزها من الكود بعد تطبيق صلاحيات المستخدم.
   اعتبرها بيانات موثوقة.

6. لا تخترع أي طلب.

7. لا تخترع أي سعر.

8. لا تخترع أي منتج.

9. لا تخترع أي متجر.

10. لا تخترع أي منطقة.

11. لا تخترع أي حالة طلب.


==============================
قواعد المنتجات
==============================

إذا كانت بيانات المنتجات تحتوي على نتيجة مؤكدة:

استخدم:
Product Name
Price
Store Name
Category
Address
Area

ولا تظهر:
Product ID
Store ID
Area ID
Category ID

إذا لم توجد نتيجة مؤكدة:
قل للمستخدم إنك لم تجد المنتج حالياً.


==============================
قواعد الطلبات
==============================

إذا سأل المستخدم عن طلب:

استخدم بيانات Order Request.

يمكنك ذكر:

Request ID
Delivery Status
Approval Status
Items Cost
Delivery Fee
Total Amount
Delivery Address
Assigned Driver
Area

لكن لا تعرض أي IDs داخلية غير ضرورية.

إذا سأل:
"شو بقلب الطلب؟"

استخدم Order Details.

حوّل:

Product ID
→ Product Name

Store ID
→ Store Name

Area
→ Area Name


==============================
حالة الطلب
==============================

Delivery Status مهم جداً.

إذا كانت البيانات:

في الطريق
أو
بيك اب
أو
تم التوصيل

استخدم الحالة كما هي أو بصياغة لبنانية واضحة.

لا تغير حالة الطلب من عندك.


==============================
السائق
==============================

إذا كان Assigned Driver موجوداً:
يمكن ذكر اسم السائق.

لا تذكر رقم هاتف السائق إلا إذا طلب المستخدم ذلك بشكل واضح.


==============================
أسلوب المحادثة
==============================

لا تعيد الترحيب في كل رسالة.

لا تقل:
"أنا ذكاء اصطناعي"
إلا إذا سأل المستخدم.

لا تقل:
"حسب البيانات التي لدي..."
في كل رد.

أجب مباشرة.

إذا السؤال يحتاج توضيح:
اسأل سؤالاً واحداً فقط.

إذا المستخدم قال مرحبا:
رحب به بشكل طبيعي.

لا تكرر معلومات قديمة بدون داع.


==============================
المحادثة السابقة
==============================

${historyText}


==============================
نتائج المنتجات
==============================

${productContext}


==============================
طلبات المستخدم
==============================

${orderData}


==============================
الطلب المحدد
==============================

${selectedOrder}


==============================
تفاصيل الطلب المحدد
==============================

${orderDetails}

`;


    const res =
      await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method:
            "POST",
          headers: {
            Authorization:
              `Bearer ${GROQ_KEY}`,
            "Content-Type":
              "application/json"
          },
          body:
            JSON.stringify({
              model:
                "llama-3.3-70b-versatile",
              messages: [
                {
                  role:
                    "system",
                  content:
                    systemPrompt
                },
                {
                  role:
                    "user",
                  content:
                    userMessage
                }
              ],
              temperature:
                0.3
            })
        }
      );


    const data =
      await res.json();


    if (data.error) {
      console.error(
        "❌ Groq Error:",
        JSON.stringify(
          data.error
        )
      );
      return
        "عذراً، صار عندي مشكلة صغيرة. جرب تبعتلي مرة تانية.";
    }


    return (
      data.choices?.[0]
        ?.message?.content ||
      "أهلا بك! كيف بقدر ساعدك اليوم؟ 😊"
    );


  } catch (error) {
    console.error(
      "❌ خطأ اتصال Groq:",
      error
    );
    return
      "عذراً، صار عندي مشكلة صغيرة. جرب تبعتلي مرة تانية.";
  }
}


// ======================================================
// 14. WhatsApp GET Verification
// ======================================================

export async function GET(req) {
  const {
    searchParams
  } =
    new URL(req.url);
  const mode =
    searchParams.get(
      "hub.mode"
    );
  const token =
    searchParams.get(
      "hub.verify_token"
    );
  const challenge =
    searchParams.get(
      "hub.challenge"
    );


  if (
    mode === "subscribe" &&
    token === VERIFY_TOKEN
  ) {
    return new Response(
      challenge,
      {
        status:
          200
      }
    );
  }


  return new Response(
    "Forbidden",
    {
      status:
        403
    }
  );
}


// ======================================================
// 15. WhatsApp POST
// ======================================================

export async function POST(req) {
  try {
    const body =
      await req.json();


    // ==================================================
    // AppSheet → إنشاء مستخدم جديد
    // ==================================================

    const Name =
      body.name ||
      body.Name;

    const PIN =
      body.password ||
      body.PIN;

    const Mobile =
      body.from ||
      body.Mobile;


    if (
      body.type ===
        "new_user_welcome" ||
      Name ||
      PIN
    ) {
      const targetPhone =
        Mobile ||
        "03177653";
      const customerName =
        Name ||
        "عميلنا العزيز";
      const customerPIN =
        PIN ||
        "";


      const welcomeMessage =
        `أهلاً بك يا ${customerName} في MD-Marketplace! 🌸

تم إنشاء حسابك بنجاح.

رمز الـ PIN الخاص بك هو:
*${customerPIN}*

نتمنى لك تجربة تسوق ممتعة! 😊`;


      console.log(
        `📩 ترحيب بمستخدم جديد: ${customerName} | Mobile: ${targetPhone}`
      );


      await sendMessage(
        targetPhone,
        welcomeMessage
      );


      await saveToAppSheet(
        targetPhone,
        "تسجيل حساب جديد",
        welcomeMessage
      );


      return Response.json(
        {
          status:
            "ok"
        },
        {
          status:
            200
        }
      );
    }


    // ==================================================
    // قراءة WhatsApp Message
    // ==================================================

    const message =
      body.entry?.[0]
        ?.changes?.[0]
        ?.value?.messages?.[0];


    const from =
      message?.from ||
      Mobile;


    const userText =
      message?.text?.body ||
      body.text;


    if (
      !from ||
      !userText
    ) {
      return Response.json(
        {
          status:
            "ok"
        },
        {
          status:
            200
        }
      );
    }


    console.log(
      `📩 استقبال رسالة من: ${from} | النص: ${userText}`
    );


    // ==================================================
    // توحيد الرقم
    // ==================================================

    const whatsappNumber =
      normalizeWhatsAppNumber(
        from
      );


    console.log(
      `📱 WhatsApp Number بعد التوحيد: ${whatsappNumber}`
    );


    // ==================================================
    // التعرف على المستخدم
    // ==================================================

    const user =
      await getUserByWhatsAppNumber(
        whatsappNumber
      );


    if (user) {
      console.log(
        `👤 المستخدم: ${user.name} | Role: ${user.role} | Customer ID: ${user.customerId}`
      );
    } else {
      console.log(
        "⚠ المستخدم غير موجود في Users"
      );
    }


    // ==================================================
    // الأمان:
    // إذا المستخدم غير معروف، لا نقرأ Orders
    // ==================================================

    let productResults = [];

    let orderContext = {
      orders: [],
      selectedOrder:
        null,
      details: []
    };


    if (user) {
      productResults =
        await searchProducts(
          userText
        );
      orderContext =
        await buildOrderContext(
          user,
          userText
        );
    }


    // ==================================================
    // المحادثة السابقة
    // ==================================================

    const history =
      await getConversationHistory(
        from
      );


    // ==================================================
    // Groq
    // ==================================================

    const aiReply =
      await getAIReply(
        userText,
        user,
        productResults,
        orderContext,
        history
      );


    console.log(
      "🤖 الرد المولّد:",
      aiReply
    );


    // ==================================================
    // إرسال WhatsApp
    // ==================================================

    await sendMessage(
      whatsappNumber,
      aiReply
    );


    // ==================================================
    // حفظ الرسالة
    // ==================================================

    await saveToAppSheet(
      from,
      userText,
      aiReply
    );


    return Response.json(
      {
        status:
          "ok"
      },
      {
        status:
          200
      }
    );


  } catch (error) {
    console.error(
      "❌ خطأ POST:",
      error
    );
    return Response.json(
      {
        status:
          "ok"
      },
      {
        status:
          200
      }
    );
  }
}
