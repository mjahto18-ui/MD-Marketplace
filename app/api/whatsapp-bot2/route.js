import { google } from "googleapis";

export const dynamic = "force-dynamic";

// ======================================================
// BOT 2 - ENV
// ======================================================

const VERIFY_TOKEN =
  process.env.WHATSAPP_VERIFY_TOKEN || "mjahto123";

const WHATSAPP_TOKEN =
  process.env.WHATSAPP_TOKEN;

const PHONE_ID =
  process.env.WHATSAPP_PHONE_ID || "1183824331491327";

const APPSHEET_APP_ID =
  process.env.APPSHEET_APP_ID;

const APPSHEET_API_KEY =
  process.env.APPSHEET_API_KEY;

const GOOGLE_SHEETS_ID =
  process.env.GOOGLE_SHEETS_ID;

const GOOGLE_CLIENT_EMAIL =
  process.env.GOOGLE_CLIENT_EMAIL;

const GOOGLE_PRIVATE_KEY =
  process.env.GOOGLE_PRIVATE_KEY;

const WEBSITE_URL =
  "www.md-marketplace.store";

const INFO_EMAIL =
  "info@md-marketplace.store";

// ======================================================
// CACHE
// ======================================================

const SHEETS_CACHE = new Map();

const CACHE_TTL =
  1000 * 60 * 5;

const CACHEABLE_SHEETS =
  new Set([
    "Areas",
    "Stores",
    "Products",
    "Categories"
  ]);

function getCache(key) {
  const item =
    SHEETS_CACHE.get(key);

  if (!item) {
    return null;
  }

  if (
    Date.now() - item.t >
    CACHE_TTL
  ) {
    SHEETS_CACHE.delete(key);
    return null;
  }

  return item.v;
}

function setCache(key, value) {
  SHEETS_CACHE.set(
    key,
    {
      v: value,
      t: Date.now()
    }
  );
}

// ======================================================
// 1. توحيد رقم WhatsApp
// ======================================================

function normalizeWhatsAppNumber(phone) {
  let clean =
    String(phone || "")
      .replace(/\D/g, "");

  // سعودي
  if (clean.startsWith("05")) {
    clean =
      "966" +
      clean.substring(1);
  }

  else if (
    clean.length === 9 &&
    clean.startsWith("5")
  ) {
    clean =
      "966" +
      clean;
  }

  // لبناني
  else if (clean.startsWith("03")) {
    clean =
      "9613" +
      clean.substring(2);
  }

  else if (
    clean.length === 7 &&
    clean.startsWith("3")
  ) {
    clean =
      "961" +
      clean;
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
    const response =
      await fetch(
        `https://graph.facebook.com/v26.0/${PHONE_ID}/messages`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${WHATSAPP_TOKEN}`,

            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
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
      await response.json();

    console.log(
      "📤 WhatsApp:",
      JSON.stringify(data)
    );

  } catch (error) {
    console.error(
      "❌ خطأ إرسال WhatsApp:",
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
      version: "v4",
      auth
    });

  } catch (error) {
    console.error(
      "❌ خطأ Google Sheets:",
      error
    );

    return null;
  }
}

// ======================================================
// 4. قراءة Google Sheets
// ======================================================

const SHEETS_LOADING =
  new Map();

async function getSheetRows(sheetName) {
  const useCache =
    CACHEABLE_SHEETS.has(
      sheetName
    );

  // Cache
  if (useCache) {
    const cached =
      getCache(sheetName);

    if (cached) {
      console.log(
        `⚡ Cache: ${sheetName} (${cached.length})`
      );

      return cached;
    }
  }

  // منع أكثر من قراءة لنفس الجدول بنفس الوقت
  if (useCache) {
    const loading =
      SHEETS_LOADING.get(
        sheetName
      );

    if (loading) {
      return await loading;
    }
  }

  const sheets =
    getGoogleSheetsClient();

  if (!sheets) {
    return [];
  }

  const loadPromise =
    (async () => {
      try {
        console.log(
          `📡 قراءة Google Sheets: ${sheetName}`
        );

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
          return [];
        }

        const headers =
          rows[0].map(
            header =>
              String(
                header || ""
              ).trim()
          );

        const result =
          rows
            .slice(1)
            .map(row => {
              const object = {};

              headers.forEach(
                (header, index) => {
                  object[header] =
                    row[index] || "";
                }
              );

              return object;
            });

        if (useCache) {
          setCache(
            sheetName,
            result
          );
        }

        return result;

      } catch (error) {
        console.error(
          `❌ خطأ قراءة ${sheetName}:`,
          error.message
        );

        return [];
      }
    })();

  if (useCache) {
    SHEETS_LOADING.set(
      sheetName,
      loadPromise
    );
  }

  try {
    return await loadPromise;

  } finally {
    if (useCache) {
      SHEETS_LOADING.delete(
        sheetName
      );
    }
  }
}

// ======================================================
// 5. تطبيع النص
// ======================================================

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(
      /[؟?!.,،]/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    );
}

// ======================================================
// 6. البحث عن المستخدم
// ======================================================

async function getUserByWhatsAppNumber(
  whatsappNumber
) {
  const normalized =
    normalizeWhatsAppNumber(
      whatsappNumber
    );

  const rows =
    await getSheetRows(
      "Users"
    );

  for (const row of rows) {
    const rowNumber =
      normalizeWhatsAppNumber(
        row["WhatsApp Number"] || ""
      );

    if (
      rowNumber === normalized
    ) {
      return {
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
    }
  }

  return null;
}

// ======================================================
// نهاية الجزء الأول
// ======================================================
// ======================================================
// 7. البحث عن المنتجات
// ======================================================

async function searchProducts(userMessage) {
  const products =
    await getSheetRows("Products");

  const stores =
    await getSheetRows("Stores");

  const categories =
    await getSheetRows("Categories");

  const areas =
    await getSheetRows("Areas");

  const message =
    normalizeText(userMessage);

  const originalMessage =
    String(userMessage || "")
      .toLowerCase();

  // ====================================================
  // كشف المتجر المذكور
  // ====================================================

  const storeKeywords = [
    "سوبرماركت",
    "ميني ماركت",
    "بقالة",
    "محل",
    "متجر",
    "ماركت"
  ];

  let mentionedStoreId = null;
  let mentionedStoreName = "";

  for (const store of stores) {
    const storeName =
      normalizeText(
        store["Store Name"]
      );

    if (!storeName) {
      continue;
    }

    if (
      message.includes(storeName)
    ) {
      mentionedStoreId =
        store["Store ID"];

      mentionedStoreName =
        store["Store Name"];

      break;
    }
  }

  // ====================================================
  // محاولة استخراج اسم المتجر بعد كلمة مثل "ميني ماركت"
  // ====================================================

  if (!mentionedStoreId) {
    for (const keyword of storeKeywords) {
      if (
        originalMessage.includes(keyword)
      ) {
        const parts =
          originalMessage.split(keyword);

        if (
          parts[1]
        ) {
          const firstWord =
            normalizeText(
              parts[1]
                .trim()
                .split(" ")[0]
            );

          if (firstWord) {
            for (const store of stores) {
              const storeName =
                normalizeText(
                  store["Store Name"]
                );

              if (
                storeName.includes(
                  firstWord
                )
              ) {
                mentionedStoreId =
                  store["Store ID"];

                mentionedStoreName =
                  store["Store Name"];

                break;
              }
            }
          }
        }
      }

      if (mentionedStoreId) {
        break;
      }
    }
  }

  if (mentionedStoreId) {
    console.log(
      `🏪 المتجر المذكور: ${mentionedStoreName} (${mentionedStoreId})`
    );
  }

  // ====================================================
  // كلمات لا نريد اعتبارها اسم منتج
  // ====================================================

  const stopWords = [
    "بدي",
    "بدّي",
    "اريد",
    "أريد",
    "اعرف",
    "موجود",
    "وين",
    "باي",
    "متجر",
    "سوبرماركت",
    "ميني",
    "ماركت",
    "بقالة",
    "محل",
    "عند",
    "شو",
    "عن",
    "المنتج",
    "منتج",
    "في",
    "منو",
    "فيه"
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
    return [];
  }

  // ====================================================
  // البحث
  // ====================================================

  const results = [];

  for (const product of products) {
    const available =
      normalizeText(
        product["Available"]
      );

    const active =
      String(
        product["Active"] || ""
      ).toUpperCase();

    if (
      available !== "yes"
    ) {
      continue;
    }

    if (
      active !== "TRUE"
    ) {
      continue;
    }

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
        productName === word
      ) {
        score += 10;
      }

      else if (
        productName.startsWith(word)
      ) {
        score += 7;
      }

      else if (
        productName.includes(word)
      ) {
        score += 2;
      }
    }

    if (
      message.includes(productName)
    ) {
      score += 5;
    }

    if (
      score <= 0
    ) {
      continue;
    }

    const store =
      stores.find(
        item =>
          String(
            item["Store ID"]
          ) ===
          String(
            product["Store ID"]
          )
      );

    const area =
      areas.find(
        item =>
          String(
            item["Area ID"]
          ) ===
          String(
            store?.["Area"] ||
            product["Area"]
          )
      );

    results.push({
      score,
      storeId:
        product["Store ID"] || "",

      productName:
        product["Product Name"] || "",

      unit:
        product["Unit"] || "",

      price:
        product["Price"] || "",

      storeName:
        store?.["Store Name"] ||
        "غير معروف",

      address:
        store?.["Adress"] ||
        "",

      areaName:
        area?.["Area Name"] ||
        ""
    });
  }

  // ====================================================
  // ترتيب النتائج
  // ====================================================

  results.sort(
    (a, b) => {
      if (mentionedStoreId) {
        const aMatch =
          String(a.storeId) ===
          String(mentionedStoreId);

        const bMatch =
          String(b.storeId) ===
          String(mentionedStoreId);

        if (
          aMatch &&
          !bMatch
        ) {
          return -1;
        }

        if (
          !aMatch &&
          bMatch
        ) {
          return 1;
        }
      }

      return b.score - a.score;
    }
  );

  let finalResults =
    results;

  if (mentionedStoreId) {
    finalResults =
      results.filter(
        item =>
          String(item.storeId) ===
          String(mentionedStoreId)
      );
  }

  finalResults =
    finalResults.slice(0, 3);

  console.log(
    "🔎 نتائج المنتجات:",
    JSON.stringify(
      finalResults
    )
  );

  return finalResults;
}

// ======================================================
// 8. جلب طلبات المستخدم
// ======================================================

async function getUserOrders(user) {
  if (!user) {
    return [];
  }

  const orders =
    await getSheetRows(
      "Order Requuest"
    );

  const isAdmin =
    String(
      user.role || ""
    )
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
    }
  }

  console.log(
    `📦 طلبات المستخدم: ${results.length}`
  );

  return results;
}

// ======================================================
// 9. تفاصيل الطلب
// ======================================================

async function getOrderDetails(requestId) {
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
      String(
        requestId || ""
      ).trim()
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
        item =>
          String(
            item["Product ID"] || ""
          ) ===
          String(productId)
      );

    const store =
      stores.find(
        item =>
          String(
            item["Store ID"] || ""
          ) ===
          String(storeId)
      );

    const area =
      areas.find(
        item =>
          String(
            item["Area ID"] || ""
          ) ===
          String(areaId)
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

  return result;
}

// ======================================================
// 10. تجهيز Context للطلبات
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
      selectedOrder: null,
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
      orders[
        orders.length - 1
      ];
  }

  const details =
    await getOrderDetails(
      selectedOrder[
        "Request ID"
      ]
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

    selectedOrder: {
      requestId:
        selectedOrder["Request ID"] || "",

      area:
        selectedOrder["Area"] || "",

      deliveryAddress:
        selectedOrder[
          "Delivery Adress"
        ] || "",

      deliveryFee:
        selectedOrder[
          "Delivery Fee"
        ] || "",

      assignedDriver:
        selectedOrder[
          "Assigned Driver"
        ] || "",

      approvalStatus:
        selectedOrder[
          "Approval Status"
        ] || "",

      deliveryStatus:
        selectedOrder[
          "Delivery Status"
        ] || "",

      itemsCost:
        selectedOrder[
          "Items Cost"
        ] || "",

      totalAmount:
        selectedOrder[
          "Total Amount"
        ] || ""
    },

    details
  };
}

// ======================================================
// 11. حفظ الرسائل في AppSheet
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
          "en-US",
          {
            timeZone:
              "Asia/Beirut"
          }
        );

    const response =
      await fetch(
        `https://api.appsheet.com/api/v2/apps/${APPSHEET_APP_ID}/tables/Messages/Action`,
        {
          method: "POST",

          headers: {
            ApplicationAccessKey:
              APPSHEET_API_KEY,

            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              Action: "Add",

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
      await response.text();

    console.log(
      "💾 AppSheet:",
      response.status,
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

  return messages
    .filter(
      row =>
        normalizeWhatsAppNumber(
          row["Phone"] || ""
        ) === normalized
    )
    .slice(-4);
}

// ======================================================
// 13. BOT 2 - الرد
// ======================================================

async function getBot2Reply(
  userMessage,
  user,
  productResults,
  orderContext,
  history
) {
  const userName =
    user?.name ||
    "";

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
      : "لا توجد طلبات متاحة.";

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
      : "لا توجد تفاصيل.";

  const historyText =
    history.length
      ? history
          .map(
            item =>
              `العميل: ${
                item["CustomerMessage"] || ""
              }\nالبوت: ${
                item["AIReply"] || ""
              }`
          )
          .join("\n")
      : "لا توجد محادثة سابقة.";

  // ====================================================
  // BOT 2 LOGIC
  // ====================================================

  if (
    !user
  ) {
    return (
      "أهلا وسهلا 😊\n\n" +
      "كرمال تستفيد من خدمات MD-Marketplace " +
      "وتقدر تطلب وتشوف الأسعار والمعلومات، " +
      `فينا نساعدك بعد التسجيل على ${WEBSITE_URL}`
    );
  }

  const message =
    normalizeText(
      userMessage
    );

  // ====================================================
  // ترحيب
  // ====================================================

  if (
    message === "مرحبا" ||
    message === "مسا الخير" ||
    message === "صباح الخير" ||
    message === "اهلا" ||
    message === "أهلا"
  ) {
    return userName
      ? `أهلا ${userName} 😊 كيف فيني ساعدك؟`
      : "أهلا وسهلا 😊 كيف فيني ساعدك؟";
  }

  // ====================================================
  // إذا كان طلب عن المنتجات
  // ====================================================

  if (
    productResults.length
  ) {
    let reply = "";

    for (
      const product of productResults
    ) {
      reply +=
        `🛒 المنتج: ${product.productName} ${product.unit}\n` +
        `💰 السعر: ${product.price}\n` +
        `🏪 المتجر: ${product.storeName}\n` +
        `📍 العنوان: ${product.address} - ${product.areaName}\n\n`;
    }

    return reply.trim();
  }

  // ====================================================
  // إذا سأل عن الطلب
  // ====================================================

  if (
    message.includes("طلب") ||
    message.includes("اوردر") ||
    message.includes("أوردر") ||
    message.includes("وين صار")
  ) {
    if (
      !orderContext.orders.length
    ) {
      return "ما عندك طلبات حالياً مسجلة عندنا 😊";
    }

    const order =
      orderContext.selectedOrder;

    return (
      `📦 طلبك ${order.requestId}\n\n` +
      `📍 المنطقة: ${order.area || "غير محددة"}\n` +
      `🏠 العنوان: ${order.deliveryAddress || "غير محدد"}\n` +
      `🚚 حالة التوصيل: ${order.deliveryStatus || "غير محددة"}\n` +
      `💰 قيمة المنتجات: ${order.itemsCost || "غير محددة"}\n` +
      `💵 التوصيل: ${order.deliveryFee || "غير محدد"}\n` +
      `💳 المجموع: ${order.totalAmount || "غير محدد"}`
    );
  }

  // ====================================================
  // الموقع
  // ====================================================

  if (
    message.includes("موقعكم") ||
    message.includes("رابط الموقع") ||
    message.includes("وين موقعكم")
  ) {
    return (
      `🌐 موقعنا: ${WEBSITE_URL}\n` +
      "فيك تشوف المنتجات والفروع والخدمات هناك 😊"
    );
  }

  // ====================================================
  // التواصل
  // ====================================================

  if (
    message.includes("ايميل") ||
    message.includes("إيميل") ||
    message.includes("تواصل")
  ) {
    return (
      `📧 فيك تتواصل معنا على:\n${INFO_EMAIL}`
    );
  }

  // ====================================================
  // إذا ما عرفنا نوع الطلب
  // ====================================================

  return (
    userName
      ? `أكيد ${userName} 😊 شو حابب تطلب أو تعرف؟`
      : "أكيد 😊 شو حابب تطلب أو تعرف؟"
  );
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
        status: 200
      }
    );
  }

  return new Response(
    "Forbidden",
    {
      status: 403
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
    // AppSheet → ترحيب مستخدم جديد
    // ==================================================

    if (
      body.type ===
      "new_user_welcome"
    ) {
      const Name =
        body.name ||
        body.Name ||
        "عميلنا العزيز";

      const PIN =
        body.password ||
        body.PIN ||
        "";

      const Mobile =
        body.from ||
        body.Mobile;

      if (!Mobile) {
        return Response.json(
          {
            status: "ok"
          },
          {
            status: 200
          }
        );
      }

      const welcomeMessage =
        `أهلاً بك يا ${Name} في MD-Marketplace! 🌸\n\n` +
        "تم إنشاء حسابك بنجاح.\n\n" +
        `رمز الـ PIN الخاص بك هو:\n*${PIN}*\n\n` +
        "نتمنى لك تجربة تسوق ممتعة! 😊";

      await sendMessage(
        Mobile,
        welcomeMessage
      );

      await saveToAppSheet(
        Mobile,
        "تسجيل حساب جديد",
        welcomeMessage
      );

      return Response.json(
        {
          status: "ok"
        },
        {
          status: 200
        }
      );
    }

    // ==================================================
    // قراءة رسالة WhatsApp
    // ==================================================

    const message =
      body.entry?.[0]
        ?.changes?.[0]
        ?.value?.messages?.[0];

    const from =
      message?.from ||
      body.from ||
      body.Mobile;

    const userText =
      message?.text?.body ||
      body.text;

    if (
      !from ||
      !userText
    ) {
      return Response.json(
        {
          status: "ok"
        },
        {
          status: 200
        }
      );
    }

    console.log(
      `📩 WhatsApp: ${from} | ${userText}`
    );

    // ==================================================
    // معرفة المستخدم
    // ==================================================

    const whatsappNumber =
      normalizeWhatsAppNumber(
        from
      );

    const user =
      await getUserByWhatsAppNumber(
        whatsappNumber
      );

    // ==================================================
    // البيانات
    // ==================================================

    let productResults = [];

    let orderContext = {
      orders: [],
      selectedOrder: null,
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

    const history =
      await getConversationHistory(
        from
      );

    // ==================================================
    // BOT 2
    // ==================================================

    const reply =
      await getBot2Reply(
        userText,
        user,
        productResults,
        orderContext,
        history
      );

    console.log(
      "🤖 BOT 2:",
      reply
    );

    await sendMessage(
      whatsappNumber,
      reply
    );

    await saveToAppSheet(
      from,
      userText,
      reply
    );

    return Response.json(
      {
        status: "ok"
      },
      {
        status: 200
      }
    );

  } catch (error) {
    console.error(
      "❌ BOT 2 ERROR:",
      error
    );

    return Response.json(
      {
        status: "ok"
      },
      {
        status: 200
      }
    );
  }
}
