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
  process.env.WHATSAPP_PHONE_ID || "1183824331491327";

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
    "Products",
    "Stores",
    "Categories",
    "Areas"
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

function setCache(
  key,
  value
) {
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

function normalizeWhatsAppNumber(
  phone
) {
  let clean =
    String(phone || "")
      .replace(/\D/g, "");

  // سعودي:
  // 05xxxxxxxx
  // →
  // 9665xxxxxxxx
  if (
    clean.startsWith("05")
  ) {
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

  // لبناني:
  // 03xxxxxx
  // →
  // 9613xxxxxx
  else if (
    clean.startsWith("03")
  ) {
    clean =
      "9613" +
      clean.substring(2);
  }

  // لبناني:
  // 3xxxxxx
  // →
  // 9613xxxxxx
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

async function sendMessage(
  to,
  text
) {
  if (!WHATSAPP_TOKEN) {
    console.error(
      "❌ WHATSAPP_TOKEN غير موجود"
    );

    return;
  }

  const cleanPhone =
    normalizeWhatsAppNumber(
      to
    );

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
      "📤 نتيجة إرسال WhatsApp:",
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
      "❌ خطأ إنشاء Google Sheets client:",
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

async function getSheetRows(
  sheetName
) {
  const useCache =
    CACHEABLE_SHEETS.has(
      sheetName
    );

  if (useCache) {
    const cached =
      getCache(
        sheetName
      );

    if (cached) {
      console.log(
        `⚡ Cache: ${sheetName} (${cached.length})`
      );

      return cached;
    }
  }

  if (useCache) {
    const loading =
      SHEETS_LOADING.get(
        sheetName
      );

    if (loading) {
      console.log(
        `⏳ انتظار قراءة جارية: ${sheetName}`
      );

      try {
        return await loading;

      } catch (error) {
        console.error(
          `❌ فشل الطلب المشترك: ${sheetName}`,
          error.message
        );

        return [];
      }
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
          console.log(
            `⚠ جدول ${sheetName} فارغ`
          );

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
            .map(
              row => {
                const obj = {};

                headers.forEach(
                  (
                    header,
                    index
                  ) => {
                    obj[header] =
                      row[index] ||
                      "";
                  }
                );

                return obj;
              }
            );

        if (useCache) {
          setCache(
            sheetName,
            result
          );
        }

        return result;

      } catch (error) {
        console.error(
          `❌ خطأ قراءة جدول ${sheetName}:`,
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
    `🔎 البحث عن المستخدم: ${normalized}`
  );

  const rows =
    await getSheetRows(
      "Users"
    );

  for (const row of rows) {
    const rowWhatsApp =
      normalizeWhatsAppNumber(
        row["WhatsApp Number"] ||
        ""
      );

    if (
      rowWhatsApp ===
      normalized
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
// 7. التحقق من المنطقة
// ======================================================

async function findArea(
  areaText
) {
  const areas =
    await getSheetRows(
      "Areas"
    );

  const input =
    normalizeText(
      areaText
    );

  if (!input) {
    return null;
  }

  for (const area of areas) {
    const areaId =
      String(
        area["Area ID"] || ""
      ).trim();

    const areaName =
      String(
        area["Area Name"] || ""
      ).trim();

    if (!areaId || !areaName) {
      continue;
    }

    const normalizedName =
      normalizeText(
        areaName
      );

    const normalizedId =
      normalizeText(
        areaId
      );

    // المقارنة بالـ ID
    if (
      input ===
      normalizedId
    ) {
      return {
        areaId,
        areaName
      };
    }

    // المقارنة بالاسم
    if (
      input ===
      normalizedName
    ) {
      return {
        areaId,
        areaName
      };
    }
  }

  // ممنوع اختراع منطقة
  return null;
}

// ======================================================
// 8. التحقق من عنوان المستخدم
// ======================================================

function getAddressInfo(
  user
) {
  if (!user) {
    return {
      oldAddress: "",
      newAddress: "",
      hasOldAddress: false,
      hasNewAddress: false
    };
  }

  const oldAddress =
    String(
      user.oldAddress ||
      ""
    ).trim();

  const newAddress =
    String(
      user.newAddress ||
      ""
    ).trim();

  return {
    oldAddress,
    newAddress,

    hasOldAddress:
      Boolean(oldAddress),

    hasNewAddress:
      Boolean(newAddress)
  };
}

// ======================================================
// 9. اختيار العنوان
// ======================================================

function resolveAddress(
  user,
  requestedAddress
) {
  const addressInfo =
    getAddressInfo(
      user
    );

  const requested =
    normalizeText(
      requestedAddress
    );

  // إذا المستخدم أعطى عنوان جديد ضمن الرسالة
  if (requested) {
    return {
      address:
        requestedAddress.trim(),

      source:
        "new",

      valid:
        true
    };
  }

  // إذا عنده عنوان محفوظ جديد
  if (
    addressInfo.hasNewAddress
  ) {
    return {
      address:
        addressInfo.newAddress,

      source:
        "new_saved",

      valid:
        true
    };
  }

  // إذا ما عنده الجديد، نستخدم القديم
  if (
    addressInfo.hasOldAddress
  ) {
    return {
      address:
        addressInfo.oldAddress,

      source:
        "old_saved",

      valid:
        true
    };
  }

  // لا يوجد عنوان
  return {
    address:
      "",

    source:
      "missing",

    valid:
      false
  };
}

// ======================================================
// 10. قراءة بيانات المستخدم المتعلقة بالعنوان
// ======================================================

async function getUserDeliveryData(
  user
) {
  if (!user) {
    return {
      area: null,
      oldAddress: "",
      newAddress: ""
    };
  }

  const users =
    await getSheetRows(
      "Users"
    );

  const normalized =
    normalizeWhatsAppNumber(
      user.whatsappNumber
    );

  const row =
    users.find(
      item =>
        normalizeWhatsAppNumber(
          item["WhatsApp Number"] ||
          ""
        ) === normalized
    );

  if (!row) {
    return {
      area: null,
      oldAddress: "",
      newAddress: ""
    };
  }

  const areaValue =
    String(
      row["Area"] ||
      ""
    ).trim();

  const area =
    await findArea(
      areaValue
    );

  return {
    area,

    oldAddress:
      String(
        row["Address"] ||
        row["Old Address"] ||
        row["Delivery Address"] ||
        ""
      ).trim(),

    newAddress:
      String(
        row["New Address"] ||
        ""
      ).trim()
  };
}

// ======================================================
// 11. تحليل المنطقة من رسالة المستخدم
// ======================================================

async function detectAreaFromMessage(
  userMessage
) {
  const areas =
    await getSheetRows(
      "Areas"
    );

  const message =
    normalizeText(
      userMessage
    );

  if (!message) {
    return null;
  }

  for (const area of areas) {
    const areaId =
      String(
        area["Area ID"] || ""
      ).trim();

    const areaName =
      String(
        area["Area Name"] || ""
      ).trim();

    if (!areaId || !areaName) {
      continue;
    }

    const normalizedName =
      normalizeText(
        areaName
      );

    const normalizedId =
      normalizeText(
        areaId
      );

    if (
      message.includes(
        normalizedName
      )
    ) {
      return {
        areaId,
        areaName,
        source:
          "message"
      };
    }

    if (
      message.includes(
        normalizedId
      )
    ) {
      return {
        areaId,
        areaName,
        source:
          "message"
      };
    }
  }

  return null;
}

// ======================================================
// 12. منطق المنطقة والعنوان
// ======================================================

async function resolveDeliveryLocation(
  user,
  userMessage
) {
  if (!user) {
    return {
      success:
        false,

      reason:
        "user_not_registered",

      area:
        null,

      address:
        null
    };
  }

  const detectedArea =
    await detectAreaFromMessage(
      userMessage
    );

  const savedData =
    await getUserDeliveryData(
      user
    );

  let finalArea =
    detectedArea ||
    savedData.area;

  // ====================================================
  // صارم:
  // المنطقة يجب أن تكون موجودة في Areas
  // ====================================================

  if (!finalArea) {
    return {
      success:
        false,

      reason:
        "area_missing",

      area:
        null,

      address:
        null
    };
  }

  const address =
    resolveAddress(
      {
        oldAddress:
          savedData.oldAddress,

        newAddress:
          savedData.newAddress
      },
      ""
    );

  // ====================================================
  // صارم:
  // لا عنوان = لا اعتماد للطلب
  // ====================================================

  if (!address.valid) {
    return {
      success:
        false,

      reason:
        "address_missing",

      area:
        finalArea,

      address:
        null
    };
  }

  return {
    success:
      true,

    reason:
      "valid",

    area:
      finalArea,

    address:
      address.address,

    addressSource:
      address.source
  };
}

// ======================================================
// 13. البحث عن المنتجات
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

  const areas =
    await getSheetRows(
      "Areas"
    );

  const message =
    normalizeText(
      userMessage
    );

  const stopWords =
    [
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
          !stopWords.includes(
            word
          )
      );

  if (!words.length) {
    return [];
  }

  const results = [];

  for (
    const product of products
  ) {
    const available =
      normalizeText(
        product["Available"]
      );

    const active =
      String(
        product["Active"] || ""
      ).toUpperCase();

    if (
      available !==
        "yes" &&
      available !==
        "نعم"
    ) {
      continue;
    }

    if (
      active !==
      "TRUE"
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

    for (
      const word of words
    ) {
      if (
        productName ===
        word
      ) {
        score += 10;
      }

      else if (
        productName.startsWith(
          word
        )
      ) {
        score += 7;
      }

      else if (
        productName.includes(
          word
        )
      ) {
        score += 2;
      }
    }

    if (
      message.includes(
        productName
      )
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
            product["Area"] ||
            ""
          )
      );

    results.push({
      score,

      productId:
        product["Product ID"] ||
        "",

      productName:
        product["Product Name"] ||
        "",

      unit:
        product["Unit"] ||
        "",

      price:
        product["Price"] ||
        "",

      storeId:
        product["Store ID"] ||
        "",

      storeName:
        store?.["Store Name"] ||
        "",

      address:
        store?.["Adress"] ||
        store?.["Address"] ||
        "",

      areaId:
        area?.["Area ID"] ||
        "",

      areaName:
        area?.["Area Name"] ||
        ""
    });
  }

  results.sort(
    (a, b) =>
      b.score -
      a.score
  );

  return results.slice(
    0,
    10
  );
}
// ======================================================
// 14. قراءة الطلبات الخاصة بالمستخدم
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

  const customerId =
    String(
      user.customerId ||
      ""
    ).trim();

  const mobile =
    normalizeWhatsAppNumber(
      user.mobile ||
      user.whatsappNumber ||
      ""
    );

  const results = [];

  for (
    const order of orders
  ) {
    const orderCustomerId =
      String(
        order["Customer ID"] ||
        ""
      ).trim();

    const orderMobile =
      normalizeWhatsAppNumber(
        order["Mobile"] ||
        ""
      );

    if (
      customerId &&
      orderCustomerId ===
      customerId
    ) {
      results.push(
        order
      );

      continue;
    }

    if (
      mobile &&
      orderMobile &&
      mobile ===
      orderMobile
    ) {
      results.push(
        order
      );
    }
  }

  console.log(
    `📦 Orders للمستخدم: ${results.length}`
  );

  return results;
}

// ======================================================
// 15. قراءة تفاصيل الطلب
// ======================================================

async function getOrderDetails(
  requestId
) {
  if (!requestId) {
    return [];
  }

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

  for (
    const detail of details
  ) {
    const detailRequestId =
      String(
        detail["Request ID"] ||
        ""
      ).trim();

    if (
      detailRequestId !==
      String(
        requestId
      ).trim()
    ) {
      continue;
    }

    const productId =
      String(
        detail["Product ID"] ||
        ""
      ).trim();

    const storeId =
      String(
        detail["Store ID"] ||
        ""
      ).trim();

    const areaId =
      String(
        detail["Area"] ||
        ""
      ).trim();

    const product =
      products.find(
        item =>
          String(
            item["Product ID"] ||
            ""
          ).trim() ===
          productId
      );

    const store =
      stores.find(
        item =>
          String(
            item["Store ID"] ||
            ""
          ).trim() ===
          storeId
      );

    const area =
      areas.find(
        item =>
          String(
            item["Area ID"] ||
            ""
          ).trim() ===
          areaId
      );

    result.push({
      requestId:
        detailRequestId,

      productId,

      productName:
        product?.["Product Name"] ||
        "",

      qty:
        detail["Qty"] ||
        "",

      unitPrice:
        detail["Unit Price"] ||
        "",

      storeId,

      storeName:
        store?.["Store Name"] ||
        "",

      areaId,

      areaName:
        area?.["Area Name"] ||
        ""
    });
  }

  console.log(
    `🧾 تفاصيل الطلب ${requestId}: ${result.length}`
  );

  return result;
}

// ======================================================
// 16. تحديد الطلب المقصود من الرسالة
// ======================================================

function detectRequestedOrder(
  orders,
  userMessage
) {
  if (
    !orders ||
    !orders.length
  ) {
    return null;
  }

  const message =
    normalizeText(
      userMessage
    );

  // أولاً: البحث عن Request ID
  for (
    const order of orders
  ) {
    const requestId =
      String(
        order["Request ID"] ||
        ""
      ).trim();

    if (
      requestId &&
      message.includes(
        normalizeText(
          requestId
        )
      )
    ) {
      return order;
    }
  }

  // إذا ما ذكر رقم الطلب
  // نستخدم آخر طلب للمستخدم
  return orders[
    orders.length - 1
  ];
}

// ======================================================
// 17. تجهيز حالة الطلب
// ======================================================

function buildOrderStatus(
  order
) {
  if (!order) {
    return null;
  }

  return {
    requestId:
      order["Request ID"] ||
      "",

    approvalStatus:
      order["Approval Status"] ||
      "",

    deliveryStatus:
      order["Delivery Status"] ||
      "",

    assignedDriver:
      order["Assigned Driver"] ||
      "",

    area:
      order["Area"] ||
      "",

    deliveryAddress:
      order["Delivery Adress"] ||
      order["Delivery Address"] ||
      "",

    itemsCost:
      order["Items Cost"] ||
      "",

    deliveryFee:
      order["Delivery Fee"] ||
      "",

    totalAmount:
      order["Total Amount"] ||
      ""
  };
}

// ======================================================
// 18. تجهيز Context كامل للبوت 2
// ======================================================

async function buildBot2Context(
  user,
  userMessage
) {
  // المستخدم غير المسجل
  if (!user) {
    return {
      registered:
        false,

      user:
        null,

      area:
        null,

      address:
        null,

      products:
        [],

      orders:
        [],

      selectedOrder:
        null,

      orderDetails:
        []
    };
  }

  // ----------------------------------------------
  // بيانات المنطقة والعنوان
  // ----------------------------------------------

  const delivery =
    await resolveDeliveryLocation(
      user,
      userMessage
    );

  // ----------------------------------------------
  // المنتجات
  // ----------------------------------------------

  const products =
    await searchProducts(
      userMessage
    );

  // ----------------------------------------------
  // الطلبات
  // ----------------------------------------------

  const orders =
    await getUserOrders(
      user
    );

  const selectedOrder =
    detectRequestedOrder(
      orders,
      userMessage
    );

  const orderStatus =
    buildOrderStatus(
      selectedOrder
    );

  let orderDetails =
    [];

  if (
    selectedOrder &&
    selectedOrder["Request ID"]
  ) {
    orderDetails =
      await getOrderDetails(
        selectedOrder[
          "Request ID"
        ]
      );
  }

  return {
    registered:
      true,

    user: {
      userId:
        user.userId ||
        "",

      customerId:
        user.customerId ||
        "",

      name:
        user.name ||
        "",

      mobile:
        user.mobile ||
        "",

      whatsappNumber:
        user.whatsappNumber ||
        "",

      role:
        user.role ||
        "",

      status:
        user.status ||
        "",

      active:
        user.active ||
        ""
    },

    area:
      delivery.area,

    address:
      delivery.address,

    deliverySuccess:
      delivery.success,

    deliveryReason:
      delivery.reason,

    products,

    orders,

    selectedOrder:
      orderStatus,

    orderDetails
  };
}

// ======================================================
// 19. تحديد نوع طلب المستخدم
// ======================================================

function detectIntent(
  userMessage
) {
  const message =
    normalizeText(
      userMessage
    );

  if (!message) {
    return "unknown";
  }

  // تحية
  const greetings =
    [
      "مرحبا",
      "مرحباً",
      "اهلا",
      "أهلا",
      "هاي",
      "hello",
      "hi"
    ];

  if (
    greetings.some(
      item =>
        message ===
        normalizeText(item)
    )
  ) {
    return "greeting";
  }

  // سؤال عن المنتجات
  const productWords =
    [
      "منتج",
      "موجود",
      "عندكم",
      "بدي",
      "اريد",
      "وين",
      "سعر"
    ];

  if (
    productWords.some(
      word =>
        message.includes(
          normalizeText(word)
        )
    )
  ) {
    return "product_search";
  }

  // سؤال عن الطلب
  const orderWords =
    [
      "طلب",
      "طلبي",
      "اوردر",
      "أوردر",
      "التوصيل",
      "التوصيل وين",
      "وصل",
      "الطلب وين"
    ];

  if (
    orderWords.some(
      word =>
        message.includes(
          normalizeText(word)
        )
    )
  ) {
    return "order_status";
  }

  // سؤال عن الموقع
  const websiteWords =
    [
      "الموقع",
      "رابط",
      "ويبسايت",
      "موقعكم"
    ];

  if (
    websiteWords.some(
      word =>
        message.includes(
          normalizeText(word)
        )
    )
  ) {
    return "website";
  }

  // سؤال عن التواصل
  const contactWords =
    [
      "ايميل",
      "إيميل",
      "تواصل",
      "الادارة",
      "الإدارة"
    ];

  if (
    contactWords.some(
      word =>
        message.includes(
          normalizeText(word)
        )
    )
  ) {
    return "contact";
  }

  return "unknown";
}

// ======================================================
// 20. سجل مراقبة البوت 2
// ======================================================

function buildBot2Observation(
  user,
  userMessage,
  context
) {
  return {
    timestamp:
      new Date().toISOString(),

    phone:
      normalizeWhatsAppNumber(
        user?.whatsappNumber ||
        ""
      ),

    registered:
      Boolean(user),

    userId:
      user?.userId ||
      "",

    customerId:
      user?.customerId ||
      "",

    userName:
      user?.name ||
      "",

    intent:
      detectIntent(
        userMessage
      ),

    message:
      userMessage,

    area:
      context?.area ||
      null,

    address:
      context?.address ||
      null,

    productsFound:
      context?.products?.length ||
      0,

    ordersFound:
      context?.orders?.length ||
      0,

    selectedRequestId:
      context?.selectedOrder?.requestId ||
      "",

    deliveryStatus:
      context?.selectedOrder?.deliveryStatus ||
      "",

    approvalStatus:
      context?.selectedOrder?.approvalStatus ||
      ""
  };
}

// ======================================================
// 21. البوت 2 لا ينفذ أي Action
// ======================================================

function buildBot2Decision(
  user,
  userMessage,
  context
) {
  const intent =
    detectIntent(
      userMessage
    );

  /*
   * مهم جداً:
   *
   * هذا البوت لا يقوم بأي:
   *
   * Add
   * Update
   * Delete
   * إنشاء Order
   * تعديل User
   * تعديل Cart
   * تغيير Delivery Status
   * تغيير Approval Status
   * تعيين Driver
   *
   * فقط يحدد ماذا فهم من الرسالة.
   */

  if (!user) {
    return {
      action:
        "NONE",

      reason:
        "USER_NOT_REGISTERED",

      intent
    };
  }

  return {
    action:
      "OBSERVE_ONLY",

    reason:
      "BOT2_LISTEN_COMPARE_PREPARE",

    intent,

    registered:
      true
  };
}
// ======================================================
// 22. قراءة آخر رسائل المستخدم
// ======================================================

async function getRecentConversation(
  phone
) {
  const messages =
    await getSheetRows(
      "Messages"
    );

  const normalizedPhone =
    normalizeWhatsAppNumber(
      phone
    );

  const result =
    messages
      .filter(
        row =>
          normalizeWhatsAppNumber(
            row["Phone"] ||
            ""
          ) ===
          normalizedPhone
      )
      .slice(-10)
      .map(
        row => ({
          customerMessage:
            row[
              "CustomerMessage"
            ] ||
            "",

          botReply:
            row[
              "AIReply"
            ] ||
            "",

          date:
            row[
              "Date"
            ] ||
            ""
        })
      );

  return result;
}

// ======================================================
// 23. تحديد إذا المحادثة ضمن طلب نشط
// ======================================================

function detectActiveOrder(
  context
) {
  if (
    !context ||
    !context.selectedOrder
  ) {
    return false;
  }

  const approval =
    normalizeText(
      context.selectedOrder
        .approvalStatus ||
      ""
    );

  const delivery =
    normalizeText(
      context.selectedOrder
        .deliveryStatus ||
      ""
    );

  const finishedStatuses =
    [
      "تم التوصيل",
      "delivered",
      "closed",
      "completed",
      "ملغى",
      "cancelled",
      "canceled"
    ];

  if (
    finishedStatuses.includes(
      delivery
    )
  ) {
    return false;
  }

  if (
    finishedStatuses.includes(
      approval
    )
  ) {
    return false;
  }

  return true;
}

// ======================================================
// 24. تحليل جاهزية المستخدم للطلب
// ======================================================

function analyzeOrderReadiness(
  user,
  context
) {
  if (!user) {
    return {
      ready:
        false,

      reason:
        "USER_NOT_REGISTERED"
    };
  }

  if (
    !context
  ) {
    return {
      ready:
        false,

      reason:
        "NO_CONTEXT"
    };
  }

  if (
    !context.area
  ) {
    return {
      ready:
        false,

      reason:
        "AREA_MISSING"
    };
  }

  if (
    !context.address
  ) {
    return {
      ready:
        false,

      reason:
        "ADDRESS_MISSING"
    };
  }

  if (
    !context.products ||
    !context.products.length
  ) {
    return {
      ready:
        false,

      reason:
        "NO_PRODUCT_FOUND"
    };
  }

  return {
    ready:
      true,

    reason:
      "READY_FOR_NEXT_STEP"
  };
}

// ======================================================
// 25. مقارنة بيانات الطلب مع بيانات المنتجات
// ======================================================

function compareOrderWithProducts(
  context
) {
  if (
    !context ||
    !context.orderDetails ||
    !context.orderDetails.length
  ) {
    return {
      matched:
        false,

      matches:
        [],

      missing:
        []
    };
  }

  const products =
    context.products ||
    [];

  const matches = [];
  const missing = [];

  for (
    const item of
    context.orderDetails
  ) {
    const productName =
      normalizeText(
        item.productName
      );

    const found =
      products.find(
        product =>
          normalizeText(
            product.productName
          ) ===
          productName
      );

    if (found) {
      matches.push({
        orderItem:
          item,

        product:
          found
      });
    }
    else {
      missing.push(
        item
      );
    }
  }

  return {
    matched:
      missing.length === 0,

    matches,

    missing
  };
}

// ======================================================
// 26. تجهيز معلومات المستخدم للـAI
// ======================================================

function buildUserAIContext(
  user
) {
  if (!user) {
    return {
      registered:
        false,

      message:
        "المستخدم غير مسجل."
    };
  }

  return {
    registered:
      true,

    userId:
      user.userId ||
      "",

    customerId:
      user.customerId ||
      "",

    name:
      user.name ||
      "",

    role:
      user.role ||
      "",

    mobile:
      user.mobile ||
      "",

    whatsappNumber:
      user.whatsappNumber ||
      "",

    area:
      user.area ||
      "",

    status:
      user.status ||
      "",

    active:
      user.active ||
      ""
  };
}

// ======================================================
// 27. تجهيز Context آمن للـAI
// ======================================================

function buildSafeAIContext(
  user,
  userMessage,
  context,
  history
) {
  const readiness =
    analyzeOrderReadiness(
      user,
      context
    );

  const activeOrder =
    detectActiveOrder(
      context
    );

  const comparison =
    compareOrderWithProducts(
      context
    );

  return {
    user:
      buildUserAIContext(
        user
      ),

    message:
      userMessage,

    intent:
      detectIntent(
        userMessage
      ),

    history:
      history || [],

    delivery: {
      area:
        context?.area ||
        null,

      address:
        context?.address ||
        null,

      success:
        context?.deliverySuccess ||
        false,

      reason:
        context?.deliveryReason ||
        ""
    },

    products:
      context?.products ||
      [],

    orders:
      context?.orders ||
      [],

    selectedOrder:
      context?.selectedOrder ||
      null,

    orderDetails:
      context?.orderDetails ||
      [],

    activeOrder,

    readiness,

    comparison
  };
}

// ======================================================
// 28. Prompt البوت 2
// ======================================================

function buildBot2Prompt(
  safeContext
) {
  return `
أنت Bot 2 الخاص بـ MD-Marketplace.

دورك الأساسي:
تسمع للمستخدم.
تفهم قصده.
تقارن رسالته مع البيانات الموثوقة.
تقرأ المنتجات والطلبات والمناطق والعناوين.
تجهز المعلومات اللازمة للخطوة التالية.

ممنوع عليك تنفيذ أي عملية.

==================================================
قواعد صارمة
==================================================

1. ممنوع إنشاء Order.

2. ممنوع تعديل Order.

3. ممنوع تعديل Cart.

4. ممنوع تعديل User.

5. ممنوع تغيير Delivery Status.

6. ممنوع تغيير Approval Status.

7. ممنوع تعيين Driver.

8. ممنوع حذف أي بيانات.

9. ممنوع اختراع منتج.

10. ممنوع اختراع سعر.

11. ممنوع اختراع متجر.

12. ممنوع اختراع منطقة.

13. ممنوع اختراع عنوان.

14. ممنوع إعطاء معلومات عن طلب مستخدم غير مسجل.

15. إذا البيانات غير موجودة، قل إنها غير موجودة ولا تخمّن.

==================================================
هوية المستخدم
==================================================

${JSON.stringify(
  safeContext.user
)}

==================================================
رسالة المستخدم
==================================================

${safeContext.message}

==================================================
النية المكتشفة
==================================================

${safeContext.intent}

==================================================
بيانات المنطقة والعنوان
==================================================

${JSON.stringify(
  safeContext.delivery
)}

==================================================
المنتجات
==================================================

${JSON.stringify(
  safeContext.products
)}

==================================================
الطلبات
==================================================

${JSON.stringify(
  safeContext.orders
)}

==================================================
الطلب المحدد
==================================================

${JSON.stringify(
  safeContext.selectedOrder
)}

==================================================
تفاصيل الطلب
==================================================

${JSON.stringify(
  safeContext.orderDetails
)}

==================================================
حالة الطلب النشطة
==================================================

${safeContext.activeOrder}

==================================================
جاهزية المستخدم
==================================================

${JSON.stringify(
  safeContext.readiness
)}

==================================================
مقارنة الطلب مع المنتجات
==================================================

${JSON.stringify(
  safeContext.comparison
)}

==================================================
المحادثة السابقة
==================================================

${JSON.stringify(
  safeContext.history
)}

==================================================
طريقة الرد
==================================================

تحدث باللهجة اللبنانية الطبيعية.

لا تتصرف كروبوت جامد.

لا تعيد الترحيب إذا كانت المحادثة بدأت.

إذا كان السؤال يحتاج توضيح، اسأل سؤالاً واحداً فقط.

لا تقل للمستخدم إنك نفذت أي عملية.

إذا طلب المستخدم شراء أو تعديل أو إلغاء:
افهم الطلب وجهزه فقط، ولا تنفذه.

إذا كان المستخدم غير مسجل:
لا تعطيه معلومات خاصة بالطلبات أو الحساب.

إذا لم تجد البيانات:
قل ذلك بصراحة.

ممنوع اختراع أي معلومة.

المخرَج يجب أن يكون جواباً طبيعياً مناسباً للمستخدم.
`;
}

// ======================================================
// 29. تشغيل Groq - Bot 2
// ======================================================

async function runBot2AI(
  userMessage,
  safeContext
) {
  if (
    !GROQ_KEY
  ) {
    return {
      success:
        false,

      reply:
        "أهلا وسهلا! كيف بقدر ساعدك اليوم؟ 😊"
    };
  }

  try {
    const prompt =
      buildBot2Prompt(
        safeContext
      );

    const response =
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
                "openai/gpt-oss-20b",

              messages: [
                {
                  role:
                    "system",

                  content:
                    prompt
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
      await response.json();

    if (
      data.error
    ) {
      console.error(
        "❌ Bot2 Groq Error:",
        JSON.stringify(
          data.error
        )
      );

      return {
        success:
          false,

        reply:
          "صار ضغط شوي، جرب تبعتلي مرة تانية 🙏"
      };
    }

    const reply =
      data
        ?.choices?.[0]
        ?.message
        ?.content;

    if (
      !reply
    ) {
      return {
        success:
          false,

        reply:
          "ما قدرت عالج الرسالة حالياً، جرب مرة تانية 🙏"
      };
    }

    return {
      success:
        true,

      reply:
        reply.trim()
    };

  } catch (error) {
    console.error(
      "❌ Bot2 AI Error:",
      error
    );

    return {
      success:
        false,

      reply:
        "صار عندي مشكلة صغيرة، جرب تبعتلي مرة تانية 🙏"
    };
  }
}
// ======================================================
// 30. تجهيز Context الكامل لـ Bot 2
// ======================================================

async function buildBot2Context(
  user,
  userMessage
) {
  // ----------------------------------------------------
  // قراءة المحادثة السابقة
  // ----------------------------------------------------

  const history =
    await getRecentConversation(
      user?.whatsappNumber ||
      ""
    );

  // ----------------------------------------------------
  // بيانات الطلبات
  // ----------------------------------------------------

  const orders =
    user
      ? await getUserOrders(
          user
        )
      : [];

  // ----------------------------------------------------
  // تحديد الطلب الحالي
  // ----------------------------------------------------

  let selectedOrder =
    null;

  if (
    orders.length
  ) {
    const message =
      normalizeText(
        userMessage
      );

    // أولاً: محاولة إيجاد Request ID داخل الرسالة
    for (
      const order of orders
    ) {
      const requestId =
        normalizeText(
          order["Request ID"] ||
          ""
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

    // إذا لم يذكر Request ID
    // نستخدم آخر طلب متاح للمستخدم
    if (
      !selectedOrder
    ) {
      selectedOrder =
        orders[
          orders.length - 1
        ];
    }
  }

  // ----------------------------------------------------
  // تفاصيل الطلب
  // ----------------------------------------------------

  let orderDetails =
    [];

  if (
    selectedOrder &&
    selectedOrder["Request ID"]
  ) {
    orderDetails =
      await getOrderDetails(
        selectedOrder[
          "Request ID"
        ]
      );
  }

  // ----------------------------------------------------
  // البحث عن المنتجات
  // ----------------------------------------------------

  let products =
    [];

  if (user) {
    products =
      await searchProducts(
        userMessage
      );
  }

  // ----------------------------------------------------
  // بيانات المنطقة والعنوان
  // ----------------------------------------------------

  let deliveryLocation =
    {
      success:
        false,

      reason:
        "user_not_registered",

      area:
        null,

      address:
        null
    };

  if (user) {
    deliveryLocation =
      await resolveDeliveryLocation(
        user,
        userMessage
      );
  }

  // ----------------------------------------------------
  // Context داخلي موحد
  // ----------------------------------------------------

  const context =
    {
      area:
        deliveryLocation.area,

      address:
        deliveryLocation.address,

      deliverySuccess:
        deliveryLocation.success,

      deliveryReason:
        deliveryLocation.reason,

      products,

      orders,

      selectedOrder,

      orderDetails
    };

  // ----------------------------------------------------
  // بناء Context الآمن للـAI
  // ----------------------------------------------------

  const safeContext =
    buildSafeAIContext(
      user,
      userMessage,
      context,
      history
    );

  return safeContext;
}


// ======================================================
// 31. WhatsApp GET Verification - Bot 2
// ======================================================

export async function GET(
  req
) {
  try {
    const {
      searchParams
    } =
      new URL(
        req.url
      );

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

    console.log(
      "🔐 Bot 2 WhatsApp Verification"
    );

    if (
      mode ===
        "subscribe" &&
      token ===
        VERIFY_TOKEN
    ) {
      console.log(
        "✅ Bot 2 Verification Success"
      );

      return new Response(
        challenge,
        {
          status:
            200
        }
      );
    }

    console.error(
      "❌ Bot 2 Verification Failed"
    );

    return new Response(
      "Forbidden",
      {
        status:
          403
      }
    );

  } catch (
    error
  ) {
    console.error(
      "❌ Bot 2 GET Error:",
      error
    );

    return new Response(
      "Forbidden",
      {
        status:
          403
      }
    );
  }
}


// ======================================================
// 32. WhatsApp POST - Bot 2
// ======================================================

export async function POST(
  req
) {
  try {
    const body =
      await req.json();

    console.log(
      "📩 Bot 2 Webhook:",
      JSON.stringify(
        body
      )
    );

    // ==================================================
    // قراءة رسالة WhatsApp
    // ==================================================

    const message =
      body
        ?.entry?.[0]
        ?.changes?.[0]
        ?.value
        ?.messages?.[0];

    // --------------------------------------------------
    // رقم المرسل
    // --------------------------------------------------

    const from =
      message?.from ||
      body?.from ||
      "";

    // --------------------------------------------------
    // النص
    // --------------------------------------------------

    const userText =
      message
        ?.text
        ?.body ||
      body?.text ||
      "";

    // --------------------------------------------------
    // تجاهل أي Webhook غير نصي
    // --------------------------------------------------

    if (
      !from ||
      !userText
    ) {
      console.log(
        "ℹ️ Bot 2: لا توجد رسالة نصية"
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

    console.log(
      `📩 Bot 2 Message | From: ${from} | Text: ${userText}`
    );

    // ==================================================
    // توحيد رقم WhatsApp
    // ==================================================

    const whatsappNumber =
      normalizeWhatsAppNumber(
        from
      );

    console.log(
      `📱 Bot 2 Normalized Number: ${whatsappNumber}`
    );

    // ==================================================
    // التعرف على المستخدم
    // ==================================================

    const user =
      await getUserByWhatsAppNumber(
        whatsappNumber
      );

    if (
      user
    ) {
      console.log(
        `👤 Bot 2 User: ${user.name} | Role: ${user.role} | Customer ID: ${user.customerId}`
      );
    }
    else {
      console.log(
        "⚠️ Bot 2: المستخدم غير موجود في Users"
      );
    }

    // ==================================================
    // بناء Context
    // ==================================================

    const safeContext =
      await buildBot2Context(
        user,
        userText
      );

    console.log(
      "🧠 Bot 2 Safe Context:",
      JSON.stringify(
        safeContext
      )
    );

    // ==================================================
    // تشغيل AI
    // ==================================================

    const aiResult =
      await runBot2AI(
        userText,
        safeContext
      );

    const aiReply =
      aiResult?.reply ||
      "أهلا وسهلا! كيف بقدر ساعدك اليوم؟ 😊";

    console.log(
      "🤖 Bot 2 Reply:",
      aiReply
    );

    // ==================================================
    // إرسال الرد فقط
    // ==================================================

    await sendMessage(
      whatsappNumber,
      aiReply
    );

    // ==================================================
    // حفظ المحادثة فقط
    // ==================================================

    await saveToAppSheet(
      from,
      userText,
      aiReply
    );

    // ==================================================
    // مهم جداً:
    // Bot 2 لا ينفذ أي عملية على Marketplace
    // ==================================================

    console.log(
      "👂 Bot 2 انتهى: Listen / Compare / Reply فقط"
    );

    return Response.json(
      {
        status:
          "ok",

        bot:
          "bot2",

        readOnly:
          true
      },
      {
        status:
          200
      }
    );

  } catch (
    error
  ) {
    console.error(
      "❌ Bot 2 POST Error:",
      error
    );

    // --------------------------------------------------
    // WhatsApp يفضل استلام 200
    // حتى لا يعيد إرسال Webhook
    // --------------------------------------------------

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
