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

const GOOGLE_SHEETS_ID =
  process.env.GOOGLE_SHEETS_ID;

const GOOGLE_CLIENT_EMAIL =
  process.env.GOOGLE_CLIENT_EMAIL;

const GOOGLE_PRIVATE_KEY =
  process.env.GOOGLE_PRIVATE_KEY;


// ======================================================
// 1. توحيد رقم واتساب
// ======================================================

function normalizeWhatsAppNumber(phone) {

  let clean = String(phone || "").replace(/\D/g, "");

  // 03177653
  if (clean.startsWith("03")) {
    clean = "9613" + clean.substring(2);
  }

  // 3177653
  else if (
    clean.length === 7 &&
    clean.startsWith("3")
  ) {
    clean = "961" + clean;
  }

  // +9613177653
  // 009613177653
  else if (clean.startsWith("00961")) {
    clean = clean.substring(2);
  }

  return clean;
}


// ======================================================
// 2. إرسال WhatsApp
// ======================================================

async function sendMessage(to, text) {

  if (!WHATSAPP_TOKEN) {
    console.error("❌ WHATSAPP_TOKEN غير موجود");
    return;
  }

  const cleanPhone =
    normalizeWhatsAppNumber(to);

  try {

    const res = await fetch(
      `https://graph.facebook.com/v26.0/${PHONE_ID}/messages`,
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

          to: cleanPhone,

          type: "text",

          text: {
            body: text
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
// 4. قراءة Sheet كاملة
// ======================================================

async function getSheetRows(
  sheets,
  sheetName
) {

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
      return [];
    }

    const headers =
      rows[0].map(
        h => String(h || "").trim()
      );

    return rows
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

  } catch (error) {

    console.error(
      `❌ خطأ قراءة ${sheetName}:`,
      error.message
    );

    return [];
  }
}


// ======================================================
// 5. Users
// ======================================================

async function getUserByWhatsAppNumber(
  whatsappNumber
) {

  const sheets =
    getGoogleSheetsClient();

  if (!sheets) {
    return null;
  }

  const normalized =
    normalizeWhatsAppNumber(
      whatsappNumber
    );

  console.log(
    `🔎 البحث في Users | WhatsApp Number: ${normalized}`
  );

  const rows =
    await getSheetRows(
      sheets,
      "Users"
    );

  console.log(
    "📋 عدد مستخدمي Users:",
    rows.length
  );

  for (const row of rows) {

    const rowWhatsApp =
      normalizeWhatsAppNumber(
        row["WhatsApp Number"] || ""
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
          row["WhatsApp Number"] || ""

      };

      console.log(
        "🎯 تم التعرف على المستخدم:",
        JSON.stringify(user)
      );

      return user;
    }
  }

  console.log(
    `⚠️ الرقم ${normalized} غير موجود في Users`
  );

  return null;
}


// ======================================================
// 6. قراءة المحادثة السابقة من Messages
// ======================================================

async function getConversationHistory(
  phone
) {

  const sheets =
    getGoogleSheetsClient();

  if (!sheets) {
    return [];
  }

  const rows =
    await getSheetRows(
      sheets,
      "Messages"
    );

  const normalized =
    normalizeWhatsAppNumber(phone);

  const conversation =
    rows
      .filter(row => {

        const rowPhone =
          normalizeWhatsAppNumber(
            row["Phone"] || ""
          );

        return rowPhone === normalized;

      })
      .slice(-12);

  console.log(
    `💬 عدد رسائل المحادثة السابقة المستخدمة: ${conversation.length}`
  );

  return conversation;
}


// ======================================================
// 7. Products
// ======================================================

async function getProducts() {

  const sheets =
    getGoogleSheetsClient();

  if (!sheets) {
    return [];
  }

  const rows =
    await getSheetRows(
      sheets,
      "Products"
    );

  return rows.filter(row => {

    const active =
      String(row["Active"] || "")
        .toLowerCase();

    const available =
      String(row["Available"] || "")
        .toLowerCase();

    return (
      active === "true" &&
      (
        available === "yes" ||
        available === "true"
      )
    );

  });
}


// ======================================================
// 8. Stores
// ======================================================

async function getStores() {

  const sheets =
    getGoogleSheetsClient();

  if (!sheets) {
    return [];
  }

  return await getSheetRows(
    sheets,
    "Stores"
  );
}


// ======================================================
// 9. Categories
// ======================================================

async function getCategories() {

  const sheets =
    getGoogleSheetsClient();

  if (!sheets) {
    return [];
  }

  return await getSheetRows(
    sheets,
    "Categories"
  );
}


// ======================================================
// 10. Areas
// ======================================================

async function getAreas() {

  const sheets =
    getGoogleSheetsClient();

  if (!sheets) {
    return [];
  }

  return await getSheetRows(
    sheets,
    "Areas"
  );
}


// ======================================================
// 11. Drivers
// ======================================================

async function getDrivers() {

  const sheets =
    getGoogleSheetsClient();

  if (!sheets) {
    return [];
  }

  return await getSheetRows(
    sheets,
    "Drivers"
  );
}


// ======================================================
// 12. البحث عن المنتجات
// ======================================================

async function searchProducts(
  userMessage
) {

  const products =
    await getProducts();

  const stores =
    await getStores();

  const categories =
    await getCategories();

  const message =
    String(userMessage || "")
      .toLowerCase()
      .trim();

  if (!message) {
    return [];
  }

  const words =
    message
      .split(/\s+/)
      .filter(word =>
        word.length >= 2
      );

  const matches = [];

  for (const product of products) {

    const productName =
      String(
        product["Product Name"] || ""
      ).toLowerCase();

    const description =
      String(
        product["Description"] || ""
      ).toLowerCase();

    const barcode =
      String(
        product["Products_Base_ID"] || ""
      ).toLowerCase();

    let score = 0;

    // الاسم الكامل
    if (
      productName &&
      message.includes(productName)
    ) {
      score += 100;
    }

    // الباركود
    if (
      barcode &&
      message.includes(barcode)
    ) {
      score += 150;
    }

    // كلمات المنتج
    for (const word of words) {

      if (
        productName.includes(word)
      ) {
        score += 10;
      }

      if (
        description.includes(word)
      ) {
        score += 3;
      }
    }

    if (score <= 0) {
      continue;
    }

    // ------------------------------------------
    // المتجر
    // ------------------------------------------

    const storeId =
      product["Store ID"] || "";

    const store =
      stores.find(
        s =>
          String(s["Store ID"] || "") ===
          String(storeId)
      );

    // ------------------------------------------
    // التصنيف
    // ------------------------------------------

    const categoryId =
      store?.["Category"] || "";

    const category =
      categories.find(
        c =>
          String(c["Category ID"] || "") ===
          String(categoryId)
      );

    matches.push({

      productId:
        product["Product ID"] || "",

      productBaseId:
        product["Products_Base_ID"] || "",

      productName:
        product["Product Name"] || "",

      unit:
        product["Unit"] || "",

      price:
        product["Price"] || "",

      description:
        product["Description"] || "",

      storeName:
        store?.["Store Name"] || "غير معروف",

      categoryName:
        category?.["Category Name"] || "",

      area:
        store?.["Area"] || "",

      address:
        store?.["Adress"] || "",

      openTime:
        store?.["Open Time"] || "",

      closeTime:
        store?.["Close Time"] || "",

      score

    });
  }

  matches.sort(
    (a, b) =>
      b.score - a.score
  );

  const result =
    matches
      .slice(0, 10)
      .map(item => {

        const copy = {
          ...item
        };

        // لا نرسل الأكواد الداخلية إلى Groq
        delete copy.productId;
        delete copy.productBaseId;
        delete copy.score;
        delete copy.area;

        return copy;
      });

  console.log(
    "🔎 نتائج البحث عن المنتجات:",
    JSON.stringify(result)
  );

  return result;
}


// ======================================================
// 13. تجهيز بيانات المنتج لـ Groq
// ======================================================

async function getProductContext(
  userMessage
) {

  const products =
    await searchProducts(
      userMessage
    );

  if (!products.length) {

    return `
لا توجد حالياً نتيجة مؤكدة من جدول Products
مطابقة لسؤال المستخدم.

ممنوع اختراع منتج أو سعر أو متجر.
`;
  }

  return `
نتائج مؤكدة من قاعدة بيانات MD-Marketplace:

${JSON.stringify(
  products,
  null,
  2
)}

استخدم فقط المعلومات الموجودة هنا.
`;
}


// ======================================================
// 14. تجهيز المحادثة السابقة
// ======================================================

function buildConversationContext(
  conversation
) {

  if (!conversation.length) {

    return "لا توجد محادثة سابقة مسجلة.";
  }

  return conversation
    .map(row => {

      return `
العميل:
${row["CustomerMessage"] || ""}

البوت:
${row["AIReply"] || ""}
`;

    })
    .join("\n");
}


// ======================================================
// 15. حفظ الرسالة في Messages
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
          method: "POST",

          headers: {

            ApplicationAccessKey:
              APPSHEET_API_KEY,

            "Content-Type":
              "application/json"

          },

          body: JSON.stringify({

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
// 16. Groq AI
// ======================================================

async function getAIReply(
  userMessage,
  user,
  conversation,
  productContext
) {

  if (!GROQ_KEY) {

    return "أهلا بك! كيف بقدر ساعدك اليوم؟ 😊";
  }

  try {

    let userContext =
      "المستخدم غير معروف في نظام Users.";

    if (user) {

      userContext = `

بيانات المستخدم الموثوقة من Users:

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

    const conversationContext =
      buildConversationContext(
        conversation
      );

    const systemPrompt = `

أنت موظف خدمة العملاء في MD-Marketplace.

تحدث مع المستخدم باللهجة اللبنانية الودودة والطبيعية.

${userContext}

==============================
المحادثة السابقة
==============================

${conversationContext}

==============================
بيانات المنتجات
==============================

${productContext}

==============================
قواعد صارمة جداً
==============================

1. لا تخترع أي معلومة.

2. لا تخترع أسعاراً.

3. لا تخترع منتجات.

4. لا تخترع متاجر.

5. لا تخترع مناطق.

6. لا تخترع أوقات فتح أو إغلاق.

7. عندما تكون بيانات المنتج متوفرة في "بيانات المنتجات"،
   استخدمها كما هي.

8. السعر يجب أن يأتي فقط من Price الموجود في بيانات المنتجات.

9. اسم المتجر يجب أن يأتي فقط من Store Name.

10. ممنوع ذكر Product ID أو Store ID أو Category ID
    أو أي كود داخلي للعميل.

11. إذا وجدت منتجاً في البيانات،
    يمكنك إخبار العميل باسمه وسعره ومتجره وتصنيفه
    حسب البيانات المتوفرة.

12. إذا لم تجد المنتج في البيانات،
    لا تقل إنه موجود.

13. إذا لم تجد سعراً،
    لا تخترع سعراً.

14. إذا كان السؤال عن طلب Order،
    لا تعطِ أي معلومات عن الطلب إذا كان المستخدم
    غير موجود في Users.

15. إذا كان المستخدم معروفاً،
    استخدم اسمه الحقيقي الموجود في Users كما هو.
    لا تترجمه ولا تختصره ولا تغيّره.

16. لا تنادِ المستخدم برقم الهاتف.

17. اقرأ المحادثة السابقة.
    إذا قال المستخدم مثلاً:
    "عنو"
    أو "قديش سعره"
    أو "بدي 2"
    افهم المقصود من سياق المحادثة السابقة.

18. لا تعيد الترحيب أو تعريف MD-Marketplace
    في كل رسالة.

19. أجب مباشرة على آخر رسالة.

20. إذا كان السؤال غير واضح فعلاً،
    اسأل سؤالاً واحداً فقط.

21. إذا قال المستخدم "مرحبا" أو "كيفك"،
    رد بشكل طبيعي ومختصر.

22. لا تقل إنك ذكاء اصطناعي إلا إذا سأل المستخدم.

23. لا تذكر للمستخدم أنك قرأت Google Sheets
    أو قاعدة بيانات أو AppSheet.

24. لا تقل "حسب قاعدة البيانات".
    تحدث معه بشكل طبيعي.

25. لا تقل إن منتجاً موجود إلا إذا كانت البيانات
    المقدمة لك تؤكد ذلك.

26. لا تستنتج معلومات غير موجودة في البيانات.

27. لا تستخدم معلومات قديمة من ذاكرتك إذا تعارضت
    مع البيانات المقدمة في هذه الرسالة.

28. إذا كانت هناك نتائج منتجات متعددة،
    اعرض الخيارات بوضوح واطلب منه تحديد المنتج
    إذا كان غير واضح أي واحد يقصد.

29. حالياً لا توجد لديك بيانات Order Requuest
    أو Order Details.
    لذلك لا تجيب عن تفاصيل الطلبات من التخمين.

`;

    const res =
      await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",

          headers: {

            Authorization:
              `Bearer ${GROQ_KEY}`,

            "Content-Type":
              "application/json"

          },

          body: JSON.stringify({

            model:
              "llama-3.3-70b-versatile",

            messages: [

              {
                role: "system",

                content:
                  systemPrompt
              },

              {
                role: "user",

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

      return "عذراً، صار عندي مشكلة صغيرة. جرب تبعتلي مرة تانية.";
    }

    return (
      data.choices?.[0]?.message?.content ||
      "أهلا بك! كيف بقدر ساعدك اليوم؟ 😊"
    );

  } catch (error) {

    console.error(
      "❌ خطأ اتصال Groq:",
      error
    );

    return "عذراً، صار عندي مشكلة صغيرة. جرب تبعتلي مرة تانية.";
  }
}


// ======================================================
// 17. WhatsApp Verification GET
// ======================================================

export async function GET(req) {

  const {
    searchParams
  } = new URL(req.url);

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
// 18. WhatsApp POST
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
رمز الـ PIN الخاص بك هو: *${customerPIN}*

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
        ?.value
        ?.messages?.[0];


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
          status: "ok"
        },
        {
          status: 200
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
        "⚠️ المستخدم غير موجود في Users"
      );
    }


    // ==================================================
    // قراءة المحادثة السابقة
    // ==================================================

    const conversation =
      await getConversationHistory(
        whatsappNumber
      );


    // ==================================================
    // البحث عن المنتج
    // ==================================================

    const productContext =
      await getProductContext(
        userText
      );


    // ==================================================
    // Groq
    // ==================================================

    const aiReply =
      await getAIReply(
        userText,
        user,
        conversation,
        productContext
      );


    console.log(
      `🤖 الرد المولّد: ${aiReply}`
    );


    // ==================================================
    // WhatsApp
    // ==================================================

    await sendMessage(
      whatsappNumber,
      aiReply
    );


    // ==================================================
    // Messages
    // ==================================================

    await saveToAppSheet(
      from,
      userText,
      aiReply
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
      "❌ خطأ POST:",
      error
    );


    // مهم حتى Meta لا تعيد إرسال الرسالة
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
