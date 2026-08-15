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

// ======================================================
// GOOGLE SHEETS
// ======================================================

const GOOGLE_SHEETS_ID =
  process.env.GOOGLE_SHEETS_ID;

const GOOGLE_CLIENT_EMAIL =
  process.env.GOOGLE_CLIENT_EMAIL;

const GOOGLE_PRIVATE_KEY =
  process.env.GOOGLE_PRIVATE_KEY;

// ======================================================
// BOT BRIDGE
// ======================================================

// البوت الثاني
const BOT2_URL =
  process.env.BOT2_URL ||
  "https://www.md-marketplace.store/api/whatsapp-bot2";

// المفتاح الذي يرسله البوت الأول للبوت الثاني
const BOT2_BRIDGE_KEY =
  process.env.BOT2_BRIDGE_KEY ||
  "MDM_BOT1_TO_BOT2_ORDER";

// اسم Session للبوت الأول
const BOT1_SESSION =
  "BOT1";

// اسم Session للبوت الثاني
const BOT2_SESSION =
  "BOT2";

// ======================================================
// GENERAL
// ======================================================

const WEBSITE_URL =
  "www.md-marketplace.store";

const INFO_EMAIL =
  "info@md-marketplace.store";

// ======================================================
// CACHE
// ======================================================

const SHEETS_CACHE =
  new Map();

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

  // سعودي
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

  // لبناني
  else if (
    clean.startsWith("03")
  ) {

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

async function sendMessage(
  to,
  text
) {

  if (!WHATSAPP_TOKEN) {

    console.error(
      "❌ WHATSAPP_TOKEN غير موجود"
    );

    return false;
  }

  const cleanPhone =
    normalizeWhatsAppNumber(to);

  try {

    const res =
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
      await res.json();

    console.log(
      "📤 WhatsApp:",
      JSON.stringify(data)
    );

    return res.ok;

  }

  catch (error) {

    console.error(
      "❌ خطأ إرسال WhatsApp:",
      error
    );

    return false;
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

  }

  catch (error) {

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
      getCache(sheetName);

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

      try {
        return await loading;
      }

      catch (error) {

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
          `📡 قراءة Live من Google Sheets: ${sheetName}`
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
            h =>
              String(
                h || ""
              ).trim()
          );

        const result =
          rows
            .slice(1)
            .map(row => {

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
            });

        if (useCache) {

          setCache(
            sheetName,
            result
          );

          console.log(
            `💾 تم تخزين ${sheetName} في Cache`
          );
        }

        return result;

      }

      catch (error) {

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

  }

  finally {

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

function normalizeText(
  text
) {

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
// 6. كشف نية إنشاء طلب جديد
// ======================================================

function isNewOrderIntent(
  userMessage
) {

  const message =
    normalizeText(
      userMessage
    );

  const newOrderPatterns = [

    "بدي اطلب",
    "بدي أطلب",

    "بدي طلب",

    "بدي اعمل طلب",
    "بدي أعمل طلب",

    "بدي اوردر",
    "بدي أوردر",

    "بدي اعمل اوردر",
    "بدي أعمل أوردر",

    "بدي اشتري",
    "بدي شراء",

    "اعمللي طلب",
    "اعمل لي طلب",

    "اعمللي اوردر",
    "اعمل لي اوردر",

    "سجللي طلب",
    "سجل لي طلب",

    "حطلي طلب",
    "حط لي طلب",

    "فيني اطلب",
    "فيني أطلب"
  ];

  const existingOrderPatterns = [

    "وين طلبي",
    "وين الطلب",

    "وين اوردري",
    "وين أوردرِي",

    "شو صار بطلب",
    "شو صار بالطلب",

    "حالة الطلب",
    "حاله الطلب",

    "حالة اوردري",
    "حالة الأوردر",

    "طلبي وين صار",
    "وين صار طلبي",

    "وصل طلبي",
    "وصل الطلب",

    "طلبتي وين"
  ];

  if (
    existingOrderPatterns.some(
      pattern =>
        message.includes(
          normalizeText(pattern)
        )
    )
  ) {

    return false;
  }

  return newOrderPatterns.some(
    pattern =>
      message.includes(
        normalizeText(pattern)
      )
  );
}

// ======================================================
// 7. التعرف على المستخدم
// ======================================================

async function getUserByWhatsAppNumber(
  whatsappNumber
) {

  const normalized =
    normalizeWhatsAppNumber(
      whatsappNumber
    );

  console.log(
    `🔎 البحث في Users: ${normalized}`
  );

  const rows =
    await getSheetRows(
      "Users"
    );

  for (
    const row of rows
  ) {

    const rowWhatsApp =
      normalizeWhatsAppNumber(
        row["WhatsApp Number"] ||
        ""
      );

    if (
      rowWhatsApp ===
      normalized
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
          row["Active"] || "",

        botSession:
          row["Bot Session"] ||
          BOT1_SESSION
      };

      console.log(
        "🎯 المستخدم:",
        JSON.stringify(user)
      );

      return user;
    }
  }

  return null;
}

// ======================================================
// 8. AppSheet Request Helper
// ======================================================

async function appSheetAction(
  tableName,
  action,
  rows
) {

  if (
    !APPSHEET_APP_ID ||
    !APPSHEET_API_KEY
  ) {

    console.error(
      "❌ AppSheet credentials ناقصة"
    );

    return null;
  }

  try {

    const response =
      await fetch(
        `https://api.appsheet.com/api/v2/apps/${APPSHEET_APP_ID}/tables/${encodeURIComponent(tableName)}/Action`,
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
                action,

              Properties: {

                Locale:
                  "ar-SA",

                TimeZone:
                  "Asia/Beirut"
              },

              Rows:
                rows
            })
        }
      );

    const text =
      await response.text();

    console.log(
      `📡 AppSheet ${tableName}/${action}:`,
      response.status,
      text
    );

    return {
      ok:
        response.ok,

      status:
        response.status,

      text
    };

  }

  catch (error) {

    console.error(
      `❌ AppSheet ${tableName}/${action}:`,
      error
    );

    return null;
  }
}

// ======================================================
// 9. تغيير Bot Session في Users
// ======================================================

async function changeBotSession(
  user,
  newSession
) {

  if (!user) {
    return false;
  }

  const key =
    user.userId ||
    user.customerId ||
    user.whatsappNumber;

  if (!key) {

    console.error(
      "❌ لا يوجد مفتاح للمستخدم لتغيير Bot Session"
    );

    return false;
  }

  // ====================================================
  // IMPORTANT
  // ====================================================
  // يجب أن يكون Key في Users مطابقاً لـ User ID.
  // إذا كان الـKey عندك Customer ID أو غيره نعدله لاحقاً.
  // ====================================================

  const row = {

    "User ID":
      user.userId,

    "Bot Session":
      newSession
  };

  const result =
    await appSheetAction(
      "Users",
      "Edit",
      [row]
    );

  return !!result?.ok;
}

// ======================================================
// 10. قراءة Messages
// ======================================================

async function getAllUserMessages(
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

  return messages.filter(
    row =>
      normalizeWhatsAppNumber(
        row["Phone"] || ""
      ) === normalized
  );
}

// ======================================================
// 11. جلب آخر المحادثة
// ======================================================

async function getConversationHistory(
  from
) {

  const messages =
    await getAllUserMessages(
      from
    );

  const userMessages =
    messages
      .filter(row => {

        const session =
          String(
            row["Bot Session"] ||
            BOT1_SESSION
          ).trim();

        return (
          session === BOT1_SESSION ||
          !row["Bot Session"]
        );
      })
      .slice(-10);

  console.log(
    `💬 Messages BOT1: ${userMessages.length}`
  );

  return userMessages;
}

// ======================================================
// 12. حفظ رسالة في Messages
// ======================================================

async function saveToAppSheet(
  from,
  userMessage,
  aiReply,
  options = {}
) {

  const botSession =
    options.botSession ||
    BOT1_SESSION;

  const bot =
    options.bot ||
    "BOT1";

  const messageType =
    options.messageType ||
    "WHATSAPP";

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

    const row = {

      Phone:
        normalizeWhatsAppNumber(
          from
        ),

      CustomerMessage:
        userMessage || "",

      AIReply:
        aiReply || "",

      Date:
        today,

      "Bot Session":
        botSession,

      Bot:
        bot,

      "Message Type":
        messageType
    };

    await appSheetAction(
      "Messages",
      "Add",
      [row]
    );

  }

  catch (error) {

    console.error(
      "❌ خطأ حفظ Messages:",
      error
    );
  }
}

// ======================================================
// 13. نسخ المحادثة إلى BOT2
// ======================================================

async function copyConversationToBot2(
  from
) {

  const messages =
    await getAllUserMessages(
      from
    );

  const normalized =
    normalizeWhatsAppNumber(
      from
    );

  const bot1Messages =
    messages.filter(
      row => {

        const phone =
          normalizeWhatsAppNumber(
            row["Phone"] || ""
          );

        const session =
          String(
            row["Bot Session"] ||
            BOT1_SESSION
          ).trim();

        return (
          phone === normalized &&
          (
            session === BOT1_SESSION ||
            !row["Bot Session"]
          )
        );
      }
    );

  if (!bot1Messages.length) {

    console.log(
      "ℹ️ لا توجد محادثة لنسخها"
    );

    return true;
  }

  // ====================================================
  // ننسخ المحادثة إلى Session BOT2
  // ====================================================

  const rows =
    bot1Messages.map(
      row => ({

        Phone:
          normalized,

        CustomerMessage:
          row["CustomerMessage"] ||
          "",

        AIReply:
          row["AIReply"] ||
          "",

        Date:
          row["Date"] ||
          "",

        "Bot Session":
          BOT2_SESSION,

        Bot:
          "BOT2",

        "Message Type":
          "BRIDGED_HISTORY"
      })
    );

  // AppSheet عادة يقبل مجموعة Rows
  // ولكن نرسلها دفعة واحدة

  const result =
    await appSheetAction(
      "Messages",
      "Add",
      rows
    );

  if (!result?.ok) {

    console.error(
      "❌ فشل نسخ المحادثة إلى BOT2"
    );

    return false;
  }

  console.log(
    `📚 تم نسخ ${rows.length} رسالة إلى BOT2`
  );

  return true;
}

// ======================================================
// 14. إرسال Bridge إلى Bot 2
// ======================================================

async function sendToBot2(
  {
    from,
    user,
    originalMessage,
    history
  }
) {

  if (!BOT2_URL) {

    console.error(
      "❌ BOT2_URL غير موجود"
    );

    return false;
  }

  try {

    const payload = {

      // المفتاح الأساسي
      bridgeKey:
        BOT2_BRIDGE_KEY,

      sourceBot:
        BOT1_SESSION,

      targetBot:
        BOT2_SESSION,

      event:
        "NEW_ORDER",

      phone:
        normalizeWhatsAppNumber(
          from
        ),

      originalMessage:
        originalMessage,

      user:
        user
          ? {
              userId:
                user.userId || "",

              customerId:
                user.customerId || "",

              name:
                user.name || "",

              mobile:
                user.mobile || "",

              whatsappNumber:
                user.whatsappNumber || "",

              area:
                user.area || "",

              role:
                user.role || ""
            }
          : null,

      conversation:
        history.map(
          row => ({

            customerMessage:
              row["CustomerMessage"] ||
              "",

            aiReply:
              row["AIReply"] ||
              "",

            date:
              row["Date"] ||
              ""
          })
        ),

      // هذا يخبر BOT2 ماذا يفعل
      instruction:
        "TRANSFER_TO_ORDER_BOT",

      // هذا يخبر BOT2 أن يبدأ الحديث
      startMessage:
        "تفضل، أنا مساعدك من MD-Marketplace قسم الطلبات، شو بقدر ساعدك؟"

    };

    console.log(
      "🔀 إرسال Bridge إلى BOT2:",
      JSON.stringify(
        {
          event:
            payload.event,

          phone:
            payload.phone,

          originalMessage:
            payload.originalMessage,

          bridgeKey:
            payload.bridgeKey
        }
      )
    );

    const response =
      await fetch(
        BOT2_URL,
        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "application/json",

            "x-md-bridge-key":
              BOT2_BRIDGE_KEY
          },

          body:
            JSON.stringify(
              payload
            )
        }
      );

    const text =
      await response.text();

    console.log(
      "🤖 نتيجة BOT2:",
      response.status,
      text
    );

    return response.ok;

  }

  catch (error) {

    console.error(
      "❌ فشل Bridge إلى BOT2:",
      error
    );

    return false;
  }
}

// ======================================================
// 15. الانتقال الكامل من BOT1 إلى BOT2
// ======================================================

async function transferToBot2(
  {
    from,
    user,
    originalMessage
  }
) {

  console.log(
    "================================================"
  );

  console.log(
    "🔀 بدء الانتقال من BOT1 إلى BOT2"
  );

  console.log(
    "📱 الهاتف:",
    normalizeWhatsAppNumber(from)
  );

  console.log(
    "👤 المستخدم:",
    user?.name
  );

  console.log(
    "📝 الرسالة:",
    originalMessage
  );

  console.log(
    "================================================"
  );

  // ==================================================
  // STEP 1
  // جلب المحادثة الحالية
  // ==================================================

  const history =
    await getConversationHistory(
      from
    );

  // ==================================================
  // STEP 2
  // نسخ المحادثة إلى BOT2
  // ==================================================

  const copied =
    await copyConversationToBot2(
      from
    );

  if (!copied) {

    console.error(
      "❌ لم يتم نسخ المحادثة"
    );

    // لا نكمل حتى لا نخسر الـcontext
    return false;
  }

  // ==================================================
  // STEP 3
  // تسجيل رسالة الانتقال نفسها
  // ==================================================

  await saveToAppSheet(
    from,

    originalMessage,

    "TRANSFER_TO_BOT2",

    {
      botSession:
        BOT1_SESSION,

      bot:
        "BOT1",

      messageType:
        "BOT_TRANSFER"
    }
  );

  // ==================================================
  // STEP 4
  // تغيير Session في Users
  // ==================================================

  const sessionChanged =
    await changeBotSession(
      user,
      BOT2_SESSION
    );

  if (!sessionChanged) {

    console.error(
      "❌ فشل تغيير Bot Session إلى BOT2"
    );

    return false;
  }

  console.log(
    "✅ Bot Session أصبح BOT2"
  );

  // ==================================================
  // STEP 5
  // إرسال البيانات للبوت الثاني
  // ==================================================

  const sent =
    await sendToBot2(
      {
        from,
        user,
        originalMessage,
        history
      }
    );

  if (!sent) {

    console.error(
      "❌ BOT2 لم يستقبل Bridge"
    );

    return false;
  }

  console.log(
    "✅ تم الانتقال بنجاح من BOT1 إلى BOT2"
  );

  return true;
}

// ======================================================
// 16. البحث عن Products
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

  const originalMessage =
    userMessage.toLowerCase();

  // ====================================================
  // المتجر
  // ====================================================

  const storeKeywords = [
    "سوبرماركت",
    "ميني ماركت",
    "بقالة",
    "محل",
    "متجر",
    "ماركت"
  ];

  let mentionedStoreId =
    null;

  let mentionedStoreName =
    "";

  for (
    const store of stores
  ) {

    const storeNameNorm =
      normalizeText(
        store["Store Name"]
      );

    if (!storeNameNorm) {
      continue;
    }

    if (
      message.includes(
        storeNameNorm
      )
    ) {

      mentionedStoreId =
        store["Store ID"];

      mentionedStoreName =
        store["Store Name"];

      break;
    }
  }

  if (!mentionedStoreId) {

    for (
      const keyword of storeKeywords
    ) {

      if (
        originalMessage.includes(
          keyword
        )
      ) {

        const parts =
          originalMessage.split(
            keyword
          );

        if (parts[1]) {

          const afterKeyword =
            normalizeText(
              parts[1]
                .trim()
                .split(" ")[0]
            );

          for (
            const store of stores
          ) {

            if (
              normalizeText(
                store["Store Name"]
              ).includes(
                afterKeyword
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
  }

  // ====================================================
  // المنتجات
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
        w =>
          w.length >= 2 &&
          !stopWords.includes(w)
      );

  if (!words.length) {
    return [];
  }

  const results = [];

  for (
    const product of products
  ) {

    if (
      normalizeText(
        product["Available"]
      ) !== "yes" &&
      product["Available"] !== "Yes"
    ) {
      continue;
    }

    if (
      String(
        product["Active"]
      ).toUpperCase() !==
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
        productName === word
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

    if (score <= 0) {
      continue;
    }

    const store =
      stores.find(
        s =>
          String(
            s["Store ID"]
          ) ===
          String(
            product["Store ID"]
          )
      );

    results.push({

      score,

      storeId:
        product["Store ID"],

      productName:
        product["Product Name"],

      unit:
        product["Unit"],

      price:
        product["Price"],

      storeName:
        store?.["Store Name"] ||
        "غير معروف",

      address:
        store?.["Adress"] ||
        "",

      areaName:
        areas.find(
          a =>
            String(
              a["Area ID"]
            ) ===
            String(
              store?.["Area"] ||
              product["Area"]
            )
        )?.["Area Name"] ||
        ""
    });
  }

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

  if (
    mentionedStoreId
  ) {

    finalResults =
      results.filter(
        r =>
          String(
            r.storeId
          ) ===
          String(
            mentionedStoreId
          )
      );
  }

  return finalResults.slice(
    0,
    3
  );
}

// ======================================================
// 17. جلب طلبات المستخدم
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

  for (
    const order of orders
  ) {

    const orderCustomerId =
      String(
        order["Customer ID"] || ""
      ).trim();

    const orderMobile =
      normalizeWhatsAppNumber(
        order["Mobile"] || ""
      );

    if (isAdmin) {

      results.push(
        order
      );

      continue;
    }

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
      userMobile &&
      orderMobile &&
      userMobile ===
      orderMobile
    ) {

      results.push(
        order
      );
    }
  }

  return results;
}

// ======================================================
// 18. تفاصيل الطلب
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

  for (
    const detail of details
  ) {

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
      detail["Product ID"] ||
      "";

    const storeId =
      detail["Store ID"] ||
      "";

    const areaId =
      detail["Area"] ||
      "";

    const product =
      products.find(
        p =>
          String(
            p["Product ID"] || ""
          ) ===
          String(
            productId
          )
      );

    const store =
      stores.find(
        s =>
          String(
            s["Store ID"] || ""
          ) ===
          String(
            storeId
          )
      );

    const area =
      areas.find(
        a =>
          String(
            a["Area ID"] || ""
          ) ===
          String(
            areaId
          )
      );

    result.push({

      productName:
        product?.["Product Name"] ||
        "منتج غير معروف",

      qty:
        detail["Qty"] ||
        "",

      unitPrice:
        detail["Unit Price"] ||
        "",

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
// 19. تجهيز Order Context
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

  for (
    const order of orders
  ) {

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
          order["Request ID"] ||
          "",

        area:
          order["Area"] ||
          "",

        deliveryAddress:
          order["Delivery Adress"] ||
          "",

        deliveryFee:
          order["Delivery Fee"] ||
          "",

        assignedDriver:
          order["Assigned Driver"] ||
          "",

        approvalStatus:
          order["Approval Status"] ||
          "",

        deliveryStatus:
          order["Delivery Status"] ||
          "",

        itemsCost:
          order["Items Cost"] ||
          "",

        totalAmount:
          order["Total Amount"] ||
          ""
      })
    );

  return {

    orders:
      safeOrders,

    selectedOrder:
      selectedOrder
        ? {

            requestId:
              selectedOrder[
                "Request ID"
              ] || "",

            area:
              selectedOrder[
                "Area"
              ] || "",

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
          }

        : null,

    details
  };
}

// ======================================================
// 20. Groq AI
// ======================================================

async function getAIReply(
  userMessage,
  user,
  productResults,
  orderContext,
  history
) {

  if (!GROQ_KEY) {

    return "أهلا بك! كيف بقدر ساعدك اليوم؟ 😊";
  }

  try {

    let userContext =
      "المستخدم غير معروف في نظام Users.";

    if (user) {

      userContext = `

بيانات المستخدم الموثوقة:
الاسم: ${user.name || "غير معروف"}
الدور: ${user.role || "غير معروف"}
Customer ID: ${user.customerId || "غير موجود"}
User ID: ${user.userId || "غير موجود"}
رقم WhatsApp: ${user.whatsappNumber || "غير موجود"}
Bot Session: ${user.botSession || BOT1_SESSION}
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
                `العميل: ${
                  m["CustomerMessage"] ||
                  ""
                }\nالبوت: ${
                  m["AIReply"] ||
                  ""
                }`
            )
            .join("\n")
        : "لا توجد محادثة سابقة.";

    const systemPrompt = `

أنت مساعدك الذكي من MD-Marketplace.

تحدث باللهجة اللبنانية الودودة والطبيعية.

موقعنا الرسمي:
${WEBSITE_URL}

ايميلنا:
${INFO_EMAIL}

${userContext}

قواعد الهوية والأمان:

1. إذا كان المستخدم معروفاً استخدم اسمه.
2. لا تنادِ المستخدم برقم الهاتف.
3. إذا كان المستخدم غير موجود في Users ممنوع إعطاؤه معلومات عن الطلبات.
4. لا تسمح للمستخدم بالوصول إلى طلبات شخص آخر.
5. بيانات الطلبات الموجودة أدناه موثوقة.
6. لا تخترع أي طلب.
7. لا تخترع أي سعر.
8. لا تخترع أي منتج.
9. لا تخترع أي متجر.
10. لا تخترع أي منطقة.
11. لا تخترع أي حالة طلب.

قواعد الموقع:

إذا سأل عن الموقع:
جاوب:
"موقعنا هو ${WEBSITE_URL} فيك تشوف كل المنتجات والفروع هناك 😊"

إذا سأل عن التواصل:
جاوب:
"فيك تتواصل معنا على ${INFO_EMAIL}"

إذا سأل مين أنت:
جاوب:
"أنا مساعدك الذكي من MD-Marketplace 😊 كيف بقدر ساعدك اليوم؟"

قواعد المنتجات:

- ممنوع Markdown Tables.
- إذا لا توجد نتائج مؤكدة لا تخترع.
- إذا توجد نتائج اعرضها كما هي.

شكل المنتج:

🛒 المنتج: {Product Name} {Unit}
💰 السعر: {Price}
🏪 المتجر: {Store Name}
📍 العنوان: {Address} - {Area}

قواعد الطلبات:

- استخدم Order Request.
- Delivery Status مهم.
- لا تغيّر الحالة.
- إذا Assigned Driver موجود يمكن ذكر اسمه.
- لا تذكر رقم هاتف السائق إلا إذا طلب المستخدم ذلك.

أسلوب المحادثة:

- لا تعيد الترحيب في كل رسالة.
- لا تقل "أنا ذكاء اصطناعي" إلا إذا سأل.
- إذا احتاج السؤال توضيحاً اسأل سؤالاً واحداً فقط.

المحادثة السابقة:

${historyText}

نتائج المنتجات:

${productContext}

طلبات المستخدم:

${orderData}

الطلب المحدد:

${selectedOrder}

تفاصيل الطلب:

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
                "openai/gpt-oss-20b",

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
                0.4
            })
        }
      );

    const data =
      await res.json();

    if (
      data.error ||
      !data.choices?.[0]?.message?.content
    ) {

      console.error(
        "❌ Groq Error:",
        JSON.stringify(
          data.error
        )
      );

      return "صار ضغط شوي على السيرفر، جرب تبعتلي بعد وقت قصير 🙏";
    }

    return (
      data
        .choices?.[0]
        ?.message?.content ||
      "أهلا بك! كيف بقدر ساعدك اليوم؟ 😊"
    );

  }

  catch (error) {

    console.error(
      "❌ خطأ اتصال Groq:",
      error
    );

    return "عذراً، صار عندي مشكلة صغيرة. جرب تبعتلي مرة تانية.";
  }
}

// ======================================================
// 21. WhatsApp GET Verification
// ======================================================

export async function GET(
  req
) {

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
// 22. WhatsApp POST
// ======================================================

export async function POST(
  req
) {

  try {

    const body =
      await req.json();

    // ==================================================
    // AppSheet → مستخدم جديد
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
      "new_user_welcome"
    ) {

      const targetPhone =
        Mobile;

      if (!targetPhone) {

        console.error(
          "❌ Mobile ناقص"
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

      await sendMessage(
        targetPhone,
        welcomeMessage
      );

      await saveToAppSheet(
        targetPhone,

        "تسجيل حساب جديد",

        welcomeMessage,

        {
          botSession:
            BOT1_SESSION,

          bot:
            "BOT1",

          messageType:
            "NEW_USER_WELCOME"
        }
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

    // ==================================================
    // إذا ما في رسالة حقيقية
    // ==================================================

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
      `📩 استقبال رسالة: ${from} | ${userText}`
    );

    const whatsappNumber =
      normalizeWhatsAppNumber(
        from
      );

    // ==================================================
    // التعرف على المستخدم
    // ==================================================

    const user =
      await getUserByWhatsAppNumber(
        whatsappNumber
      );

    // ==================================================
    // IMPORTANT
    // إذا المستخدم أصلاً BOT2
    // BOT1 لا يعالج الرسالة
    // ==================================================

    const currentBotSession =
      String(
        user?.botSession ||
        BOT1_SESSION
      ).trim();

    console.log(
      `🤖 Bot Session الحالي: ${currentBotSession}`
    );

    if (
      currentBotSession ===
      BOT2_SESSION
    ) {

      console.log(
        "⛔ المستخدم حالياً مع BOT2 — BOT1 لن يعالج الرسالة"
      );

      return Response.json(
        {
          status:
            "ok",

          ignored:
            true,

          reason:
            "USER_ASSIGNED_TO_BOT2"
        },
        {
          status:
            200
        }
      );
    }

    // ==================================================
    // كشف نية الطلب
    // ==================================================

    const newOrderIntent =
      isNewOrderIntent(
        userText
      );

    console.log(
      `🛒 نية إنشاء طلب جديد: ${newOrderIntent}`
    );

    // ==================================================
    // 🔀 الانتقال إلى BOT2
    // ==================================================

    if (
      newOrderIntent &&
      user
    ) {

      console.log(
        "🚀 المستخدم يريد إنشاء طلب جديد"
      );

      const transferred =
        await transferToBot2(
          {
            from:
              whatsappNumber,

            user,

            originalMessage:
              userText
          }
        );

      if (
        transferred
      ) {

        console.log(
          "✅ BOT1 سلم المحادثة إلى BOT2"
        );

        // مهم جداً:
        // BOT1 لا يرسل أي رد هنا.
        // BOT2 هو الذي يرسل:
        // "تفضل، أنا مساعدك من MD-Marketplace قسم الطلبات..."

        return Response.json(
          {
            status:
              "ok",

            transferred:
              true,

            target:
              "BOT2"
          },
          {
            status:
              200
          }
        );
      }

      // إذا فشل الانتقال
      // منخلي BOT1 يكمل طبيعي
      console.error(
        "⚠️ فشل الانتقال إلى BOT2 — BOT1 سيكمل"
      );
    }

    // ==================================================
    // البحث عن المنتجات والطلبات
    // ==================================================

    let productResults =
      [];

    let orderContext = {

      orders: [],

      selectedOrder:
        null,

      details:
        []
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
    // History
    // ==================================================

    const history =
      await getConversationHistory(
        whatsappNumber
      );

    // ==================================================
    // AI
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
      "🤖 الرد:",
      aiReply
    );

    // ==================================================
    // إرسال الرد
    // ==================================================

    await sendMessage(
      whatsappNumber,
      aiReply
    );

    // ==================================================
    // حفظ المحادثة
    // ==================================================

    await saveToAppSheet(
      whatsappNumber,

      userText,

      aiReply,

      {
        botSession:
          BOT1_SESSION,

        bot:
          "BOT1",

        messageType:
          "WHATSAPP"
      }
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

  catch (error) {

    console.error(
      "❌ خطأ POST:",
      error
    );

    // Meta لازم تاخد 200
    // حتى ما تعيد إرسال الرسالة
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
