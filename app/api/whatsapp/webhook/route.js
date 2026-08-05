const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'mjahto123';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID || '1180849365118543'; // رقم Meta الاختباري
const GROQ_KEY = process.env.GROQ_API_KEY;
const APPSHEET_APP_ID = process.env.APPSHEET_APP_ID;
const APPSHEET_API_KEY = process.env.APPSHEET_API_KEY;

// 1. دالة إرسال الرسالة إلى الواتساب
async function sendMessage(to, text) {
  if (!WHATSAPP_TOKEN) {
    console.error("❌ WHATSAPP_TOKEN غير موجود!");
    return;
  }

  // تنظيف الرقم وإضافة المفتاح الدولي اللبناني تلقائياً إذا كان محلياً
  let cleanPhone = String(to).replace(/\D/g, '');
  if (cleanPhone.startsWith('03')) {
    cleanPhone = '9613' + cleanPhone.substring(2);
  } else if (cleanPhone.length === 8 && cleanPhone.startsWith('3')) {
    cleanPhone = '961' + cleanPhone;
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v26.0/${PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'text',
        text: { body: text }
      })
    });

    const data = await res.json();
    console.log("📤 نتيجة الإرسال للواتساب:", JSON.stringify(data));
  } catch (e) {
    console.error("❌ خطأ إرسال واتساب:", e);
  }
}

// 2. دالة الحفظ في AppSheet
async function saveToAppSheet(from, userMessage, aiReply) {
  if (!APPSHEET_APP_ID || !APPSHEET_API_KEY) return;

  try {
    const today = new Date().toISOString().split('T')[0];
    await fetch(`https://api.appsheet.com/api/v2/apps/${APPSHEET_APP_ID}/tables/Messages/Action`, {
      method: 'POST',
      headers: {
        'ApplicationAccessKey': APPSHEET_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        Action: "Add",
        Properties: { TimeZone: "UTC" },
        Rows: [
          {
            "Phone": from,
            "CustomerMessage": userMessage,
            "AIReply": aiReply,
            "Date": today
          }
        ]
      })
    });
    console.log("💾 تم الحفظ بنجاح في AppSheet");
  } catch (e) {
    console.error("❌ خطأ AppSheet:", e);
  }
}

// 3. دالة توليد الرد عبر Groq AI
async function getAIReply(userMessage) {
  if (!GROQ_KEY) return "أهلا بك! كيف بقدر ساعدك اليوم؟ 😊";

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `انت موظف خدمة عملاء ب MD-Marketplace بلبنان.
احكي لبناني عامي، مهضوم، و محترم.
- استعمل كلمات لبنانية: هلا، تكرم، حبيبي، كيف بقدر ساعدك
- خليك قصير و مفيد
- توصيلنا لكل لبنان خلال 1-3 ايام والدفع عند الاستلام`
          },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7
      })
    });

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "أهلا بك! كيف بقدر ساعدك اليوم؟ 😊";
  } catch (e) {
    console.error("❌ خطأ اتصال Groq:", e);
    return "أهلا بك! كيف بقدر ساعدك؟";
  }
}

// 4. التحقق (GET)
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

// 5. الاستقبال والتنفيذ (POST)
export async function POST(req) {
  try {
    const body = await req.json();

    // قراءة القيم بأسماء أعمدتك الدقيقة: Mobile, Name, PIN
    const Name = body.name || body.Name;
    const PIN = body.password || body.PIN;
    const Mobile = body.from || body.Mobile;

    // حالة 1: إذا كان الطلب قادماً لإرسال بيانات مستخدم جديد من AppSheet
    if (body.type === 'new_user_welcome' || Name || PIN) {
      const targetPhone = Mobile || "03177653";
      const customerName = Name || "عميلنا العزيز";
      const customerPIN = PIN || "";

      const welcomeMessage = `أهلاً بك يا ${customerName} في MD-Marketplace! 🌸\n\nتم إنشاء حسابك بنجاح.\nرمز الـ PIN الخاص بك هو: *${customerPIN}*\n\nنتمنى لك تجربة تسوق ممتعة! 😊`;

      console.log(`📩 ترحيب بمستخدم جديد: ${customerName} | Mobile: ${targetPhone} | PIN: ${customerPIN}`);

      await sendMessage(targetPhone, welcomeMessage);
      await saveToAppSheet(targetPhone, "تسجيل حساب جديد", welcomeMessage);

      return Response.json({ status: 'ok' }, { status: 200 });
    }

    // حالة 2: محادثة نصية مباشرة قادمة من الواتساب عبر Groq AI
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    const from = message?.from || Mobile;
    const userText = message?.text?.body || body.text;

    console.log(`📩 استقبال رسالة من: ${from} | النص: ${userText}`);

    if (from && userText) {
      const aiReply = await getAIReply(userText);
      console.log(`🤖 الرد المولّد: ${aiReply}`);

      await sendMessage(from, aiReply);
      await saveToAppSheet(from, userText, aiReply);
    }

    return Response.json({ status: 'ok' }, { status: 200 });
  } catch (e) {
    console.error("❌ خطأ POST:", e);
    return Response.json({ status: 'ok' }, { status: 200 });
  }
}
