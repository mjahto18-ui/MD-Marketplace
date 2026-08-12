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
// 1. توحيد رقم واتساب
// ======================================================

function normalizeWhatsAppNumber(phone) {
  let clean = String(phone || "").replace(/\D/g, "");

  // 03177653 → 9613177653
  if (clean.startsWith("03")) {
    clean = "9613" + clean.substring(2);
  }

  // 3177653 → 9613177653
  else if (
    clean.length === 7 &&
    clean.startsWith("3")
  ) {
    clean = "961" + clean;
  }

  // 9613177653
  return clean;
}


// ======================================================
// 2. إرسال رسالة WhatsApp
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
          messaging_product: "whatsapp",

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
// 3. Google Sheets Authentication
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
// 4. التعرف على المستخدم من Users
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

  try {

    const response =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          GOOGLE_SHEETS_ID,

        range:
          "Users!A:Z"
      });

    const rows =
      response.data.values || [];

    if (rows.length === 0) {

      console.log(
        "⚠️ جدول Users فارغ"
      );

      return null;
    }

    const headers =
      rows[0].map(
        h => String(h || "").trim()
      );

    console.log(
      "📋 أعمدة Users:",
      headers
    );


    // البحث عن العمود حسب اسمه
    const getColumnIndex =
      (columnName) =>
        headers.findIndex(
          h =>
            h.toLowerCase() ===
            columnName.toLowerCase()
        );


    const userIdIndex =
      getColumnIndex("User ID");

    const roleIndex =
      getColumnIndex("Role");

    const nameIndex =
      getColumnIndex("Name");

    const mobileIndex =
      getColumnIndex("Mobile");

    const customerIdIndex =
      getColumnIndex("Customer ID");

    const whatsappIndex =
      getColumnIndex("WhatsApp Number");


    if (whatsappIndex === -1) {

      console.error(
        "❌ عمود WhatsApp Number غير موجود في Users"
      );

      return null;
    }


    // البحث عن الرقم
    for (
      let i = 1;
      i < rows.length;
      i++
    ) {

      const row =
        rows[i];

      const rowWhatsApp =
        normalizeWhatsAppNumber(
          row[whatsappIndex] || ""
        );


      if (
        rowWhatsApp === normalized
      ) {

        const user = {

          userId:
            userIdIndex >= 0
              ? row[userIdIndex] || ""
              : "",

          role:
            roleIndex >= 0
              ? row[roleIndex] || ""
              : "",

          name:
            nameIndex >= 0
              ? row[nameIndex] || ""
              : "",

          mobile:
            mobileIndex >= 0
              ? row[mobileIndex] || ""
              : "",

          customerId:
            customerIdIndex >= 0
              ? row[customerIdIndex] || ""
              : "",

          whatsappNumber:
            row[whatsappIndex] || ""
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

  } catch (error) {

    console.error(
      "❌ خطأ قراءة Users من Google Sheets:",
      error.message
    );

    return null;
  }
}


// ======================================================
// 5. حفظ الرسالة في Messages
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
              TimeZone: "Asia/Beirut"
            },

            Rows: [

              {

                Phone: from,

                CustomerMessage:
                  userMessage,

                AIReply:
                  aiReply,

                Date:
                  today

                // Message ID
                // لا نضعه هنا
                // AppSheet هو المسؤول عنه
                // إذا كان Initial Value = UNIQUEID()
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
// 6. Groq AI
// ======================================================

async function getAIReply(
  userMessage,
  user
) {

  if (!GROQ_KEY) {

    return "أهلا بك! كيف بقدر ساعدك اليوم؟ 😊";
  }


  try {

    // معلومات المستخدم
    let userContext =
      "المستخدم غير معروف في نظام Users.";

    if (user) {

      userContext = `

بيانات المستخدم الموثوقة من Users:

الاسم: ${user.name || "غير معروف"}
الدور: ${user.role || "غير معروف"}
Customer ID: ${user.customerId || "غير موجود"}
User ID: ${user.userId || "غير موجود"}
رقم WhatsApp: ${user.whatsappNumber || "غير موجود"}

`;
    }


    const systemPrompt = `

أنت موظف خدمة العملاء في MD-Marketplace.

تعامل مع المستخدم كمحادثة طبيعية باللهجة اللبنانية الودودة.

${userContext}

قواعد مهمة جداً:

1. إذا كان المستخدم معروفاً، استخدم اسمه عند الحاجة.
لا تنادِه برقم الهاتف.

2. لا تخترع أي معلومات.

3. لا تخترع أسعاراً.

4. لا تخترع منتجات.

5. لا تخترع متاجر.

6. لا تخترع مناطق.

7. لا تخترع أوقات توصيل.

8. لا تقل إن منتجاً موجود إلا إذا كانت بيانات المنتجات التي سنوفرها لك تؤكد ذلك.

9. حالياً أنت لا تملك بيانات Products أو Orders داخل هذا الطلب.
لذلك إذا سألك المستخدم عن منتج أو طلب أو سعر، لا تخمّن.
قل له أنك ستتحقق من البيانات.

10. لا تعطي أي معلومات عن الطلبات إذا كان المستخدم غير موجود في Users.

11. لا تعيد الترحيب أو تعريف MD-Marketplace في كل رسالة.

12. أجب مباشرة على آخر رسالة.

13. إذا السؤال غير واضح، اسأل سؤالاً واحداً فقط.

14. إذا قال المستخدم مرحبا أو كيفك، رد بشكل طبيعي ومختصر.

15. لا تقل للمستخدم أنك "ذكاء اصطناعي" إلا إذا سأل.

16. لا تذكر أكواد AppSheet أو Store ID أو Product ID للمستخدم.
لاحقاً عندما نوفر لك بيانات المتاجر، استخدم Store Name بدلاً من Store ID.

17. لا تخترع أسماء منتجات أو متاجر من الأكواد.

18. إذا لم تكن البيانات متوفرة لك، قل بوضوح إنك بحاجة للتحقق.

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
              0.4
          })
        }
      );


    const data =
      await res.json();


    if (
      data.error
    ) {

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
// 7. WhatsApp Verification GET
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
// 8. WhatsApp POST
// ======================================================

export async function POST(req) {

  try {

    const body =
      await req.json();


    // --------------------------------------------------
    // بيانات AppSheet الخاصة بإنشاء مستخدم جديد
    // --------------------------------------------------

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


    // --------------------------------------------------
    // قراءة رسالة WhatsApp
    // --------------------------------------------------

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


    // --------------------------------------------------
    // توحيد الرقم
    // --------------------------------------------------

    const whatsappNumber =
      normalizeWhatsAppNumber(
        from
      );


    console.log(
      `📱 WhatsApp Number بعد التوحيد: ${whatsappNumber}`
    );


    // --------------------------------------------------
    // التعرف على المستخدم
    // --------------------------------------------------

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


    // --------------------------------------------------
    // توليد الرد
    // --------------------------------------------------

    const aiReply =
      await getAIReply(
        userText,
        user
      );


    console.log(
      `🤖 الرد المولّد: ${aiReply}`
    );


    // --------------------------------------------------
    // إرسال WhatsApp
    // --------------------------------------------------

    await sendMessage(
      whatsappNumber,
      aiReply
    );


    // --------------------------------------------------
    // حفظ الرسالة
    // --------------------------------------------------

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


    // نرجع 200 لـ Meta حتى لا تعيد إرسال نفس الرسالة
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
