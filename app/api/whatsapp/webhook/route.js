const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'mjahto123';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID || '1180849365118543';
const GROQ_KEY = process.env.GROQ_API_KEY;
const APPSHEET_APP_ID = process.env.APPSHEET_APP_ID;
const APPSHEET_API_KEY = process.env.APPSHEET_API_KEY;

// =====================================================
// 1. توحيد رقم الهاتف
// =====================================================
function normalizeWhatsAppNumber(phone) {
  let clean = String(phone || '').replace(/\D/g, '');

  if (clean.startsWith('00')) {
    clean = clean.substring(2);
  }

  if (clean.startsWith('03')) {
    clean = '9613' + clean.substring(2);
  } else if (clean.length === 8 && clean.startsWith('3')) {
    clean = '961' + clean;
  } else if (clean.startsWith('3') && clean.length === 9) {
    clean = '961' + clean;
  }

  return clean;
}

// =====================================================
// 2. إرسال رسالة WhatsApp
// =====================================================
async function sendMessage(to, text) {
  if (!WHATSAPP_TOKEN) {
    console.error('❌ WHATSAPP_TOKEN غير موجود!');
    return;
  }

  const cleanPhone = normalizeWhatsAppNumber(to);

  try {
    const res = await fetch(
      `https://graph.facebook.com/v26.0/${PHONE_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'text',
          text: {
            body: text
          }
        })
      }
    );

    const data = await res.json();

    console.log(
      '📤 نتيجة الإرسال للواتساب:',
      JSON.stringify(data)
    );
  } catch (e) {
    console.error('❌ خطأ إرسال واتساب:', e);
  }
}

// =====================================================
// 3. حفظ الرسالة في Messages
// =====================================================
async function saveToAppSheet(from, userMessage, aiReply) {
  if (!APPSHEET_APP_ID || !APPSHEET_API_KEY) {
    console.error('❌ AppSheet API credentials غير موجودة');
    return;
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    const res = await fetch(
      `https://api.appsheet.com/api/v2/apps/${APPSHEET_APP_ID}/tables/Messages/Action`,
      {
        method: 'POST',
        headers: {
          ApplicationAccessKey: APPSHEET_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          Action: 'Add',
          Properties: {
            TimeZone: 'UTC'
          },
          Rows: [
            {
              Phone: from,
              CustomerMessage: userMessage,
              AIReply: aiReply,
              Date: today,
              'Message ID': crypto.randomUUID()
            }
          ]
        })
      }
    );

    const data = await res.text();

    console.log(
      '💾 نتيجة الحفظ في AppSheet:',
      res.status,
      data
    );
  } catch (e) {
    console.error('❌ خطأ AppSheet:', e);
  }
}

// =====================================================
// 4. قراءة Users - اختبار فقط
// =====================================================
async function getUserByWhatsAppNumber(whatsappNumber) {
  if (!APPSHEET_APP_ID || !APPSHEET_API_KEY) {
    console.error('❌ AppSheet credentials غير موجودة');
    return null;
  }

  const normalized = normalizeWhatsAppNumber(whatsappNumber);

  console.log(
    `🔎 البحث عن المستخدم في Users | WhatsApp Number: ${normalized}`
  );

  try {
    const url =
      `https://api.appsheet.com/api/v2/apps/${APPSHEET_APP_ID}/tables/Users/Action`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ApplicationAccessKey: APPSHEET_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        Action: 'Find',
        Properties: {
          Locale: 'en-US',
          TimeZone: 'UTC'
        },
        Rows: [
          {
            'WhatsApp Number': normalized
          }
        ]
      })
    });

    const text = await res.text();

    console.log(
      `🔎 نتيجة قراءة Users: HTTP ${res.status}`,
      text
    );

    if (!res.ok) {
      console.error('❌ AppSheet رفض قراءة Users');
      return null;
    }

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      console.error('❌ رد Users ليس JSON صالح');
      return null;
    }

    // محاولة استخراج أول صف من الرد
    const rows =
      data?.Rows ||
      data?.rows ||
      data?.Result ||
      data?.result ||
      [];

    const user = Array.isArray(rows) ? rows[0] : null;

    if (!user) {
      console.log(
        `⚠️ لم نجد مستخدمًا بالرقم ${normalized}`
      );

      return null;
    }

    const result = {
      role: user.Role || '',
      name: user.Name || '',
      mobile: user.Mobile || '',
      customerId: user['Customer ID'] || '',
      whatsappNumber: user['WhatsApp Number'] || ''
    };

    console.log('👤 المستخدم الموجود في Users:', result);

    return result;

  } catch (e) {
    console.error(
      '❌ خطأ أثناء قراءة Users:',
      e
    );

    return null;
  }
}

// =====================================================
// 5. Groq AI - حاليًا بدون بحث في الجداول
// =====================================================
async function getAIReply(userMessage, userContext = null) {
  if (!GROQ_KEY) {
    return 'أهلا بك! كيف بقدر ساعدك اليوم؟ 😊';
  }

  try {
    const customerContext = userContext
      ? `
معلومات المستخدم الموثوقة من نظام MD-Marketplace:
الاسم: ${userContext.name || 'غير معروف'}
الدور: ${userContext.role || 'غير معروف'}
Customer ID: ${userContext.customerId || 'غير معروف'}

استخدم الاسم عند مخاطبة العميل إذا كان معروفًا.
لا تستخدم رقم الهاتف كاسم للعميل.
`
      : `
المستخدم غير موجود في جدول Users.
لا تعتبره عميلاً مسجلاً.
لا تعطيه أي معلومات عن الطلبات.
`;

    const res = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GROQ_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',

          messages: [
            {
              role: 'system',
              content: `
أنت موظف خدمة العملاء في MD-Marketplace.

تعامل مع المستخدم كمحادثة طبيعية وليس كرسائل منفصلة.

${customerContext}

قواعد مهمة:
- تحدث باللهجة اللبنانية الودودة والطبيعية.
- لا تكرر الترحيب أو تعريف MD-Marketplace في كل رسالة.
- إذا كان اسم العميل معروفًا، استخدمه بشكل طبيعي وليس في كل جملة.
- لا تخترع أي أسعار أو منتجات أو متاجر أو طلبات.
- حاليًا لا تملك بيانات المنتجات أو الطلبات داخل هذا الطلب من النظام، لذلك لا تدّعي أنك بحثت عنها.
- إذا كان المستخدم غير موجود في Users، لا تعطه أي معلومات عن الطلبات.
- إذا قال مرحبا، رحب به باختصار.
- إذا كان السؤال واضحًا، جاوب مباشرة.
- إذا كان السؤال غير واضح، اسأل سؤالًا واحدًا فقط.
`
            },
            {
              role: 'user',
              content: userMessage
            }
          ],

          temperature: 0.5
        })
      }
    );

    const data = await res.json();

    return (
      data.choices?.[0]?.message?.content ||
      'أهلا بك! كيف بقدر ساعدك اليوم؟ 😊'
    );

  } catch (e) {
    console.error('❌ خطأ اتصال Groq:', e);

    return 'أهلا بك! كيف بقدر ساعدك؟ 😊';
  }
}

// =====================================================
// 6. Webhook Verification
// =====================================================
export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new Response(challenge, {
      status: 200
    });
  }

  return new Response('Forbidden', {
    status: 403
  });
}

// =====================================================
// 7. استقبال رسائل WhatsApp
// =====================================================
export async function POST(req) {
  try {
    const body = await req.json();

    // -----------------------------------------------
    // بيانات قادمة من AppSheet لإنشاء مستخدم
    // -----------------------------------------------
    const Name = body.name || body.Name;
    const PIN = body.password || body.PIN;
    const Mobile = body.from || body.Mobile;

    if (
      body.type === 'new_user_welcome' ||
      Name ||
      PIN
    ) {
      const targetPhone = Mobile || '03177653';
      const customerName = Name || 'عميلنا العزيز';
      const customerPIN = PIN || '';

      const welcomeMessage =
        `أهلاً بك يا ${customerName} في MD-Marketplace! 🌸\n\n` +
        `تم إنشاء حسابك بنجاح.\n` +
        `رمز الـ PIN الخاص بك هو: *${customerPIN}*\n\n` +
        `نتمنى لك تجربة تسوق ممتعة! 😊`;

      console.log(
        `📩 ترحيب بمستخدم جديد: ${customerName} | Mobile: ${targetPhone}`
      );

      await sendMessage(
        targetPhone,
        welcomeMessage
      );

      await saveToAppSheet(
        targetPhone,
        'تسجيل حساب جديد',
        welcomeMessage
      );

      return Response.json(
        { status: 'ok' },
        { status: 200 }
      );
    }

    // -----------------------------------------------
    // رسالة WhatsApp
    // -----------------------------------------------
    const message =
      body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    const from =
      message?.from || Mobile;

    const userText =
      message?.text?.body || body.text;

    console.log(
      `📩 استقبال رسالة من: ${from} | النص: ${userText}`
    );

    // -----------------------------------------------
    // إذا في رسالة فعلية
    // -----------------------------------------------
    if (from && userText) {

      // الرقم الحقيقي القادم من WhatsApp
      const whatsappNumber =
        normalizeWhatsAppNumber(from);

      console.log(
        `📱 WhatsApp Number بعد التوحيد: ${whatsappNumber}`
      );

      // ---------------------------------------------
      // البحث في Users
      // ---------------------------------------------
      const user =
        await getUserByWhatsAppNumber(
          whatsappNumber
        );

      if (user) {
        console.log(
          `👤 اسم المستخدم: ${user.name}`
        );

        console.log(
          `👤 Role: ${user.role}`
        );

        console.log(
          `🆔 Customer ID: ${user.customerId}`
        );
      } else {
        console.log(
          '⚠️ الرقم غير موجود في Users'
        );
      }

      // ---------------------------------------------
      // Groq
      // ---------------------------------------------
      const aiReply =
        await getAIReply(
          userText,
          user
        );

      console.log(
        `🤖 الرد المولّد: ${aiReply}`
      );

      // ---------------------------------------------
      // إرسال WhatsApp
      // ---------------------------------------------
      await sendMessage(
        from,
        aiReply
      );

      // ---------------------------------------------
      // حفظ المحادثة
      // ---------------------------------------------
      await saveToAppSheet(
        from,
        userText,
        aiReply
      );
    }

    return Response.json(
      { status: 'ok' },
      { status: 200 }
    );

  } catch (e) {

    console.error(
      '❌ خطأ POST:',
      e
    );

    return Response.json(
      { status: 'ok' },
      { status: 200 }
    );
  }
}
