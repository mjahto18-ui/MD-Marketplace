const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'mjahto123';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID || '1180849365118543'; // الرقم الأمريكي الاختباري
const GROQ_KEY = process.env.GROQ_API_KEY;
const APPSHEET_APP_ID = process.env.APPSHEET_APP_ID;
const APPSHEET_API_KEY = process.env.APPSHEET_API_KEY;

// 1. دالة إرسال الرد للزبون عبر واتساب
async function sendMessage(to, text) {
  if (!WHATSAPP_TOKEN) {
    console.error("❌ خطأ: WHATSAPP_TOKEN غير مضاف في Vercel");
    return;
  }
  
  const res = await fetch(`https://graph.facebook.com/v20.0/${PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: { body: text }
    })
  });
  
  const resData = await res.json();
  console.log("📤 نتيجة إرسال الواتساب:", JSON.stringify(resData));
}

// 2. دالة حفظ المحادثة تلقائياً في AppSheet
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
  } catch (e) {
    console.error("❌ خطأ AppSheet:", e);
  }
}

// 3. دالة توليد الرد من Groq AI (معدلة ومحميّة)
async function getAIReply(userMessage) {
  if (!GROQ_KEY) {
    console.error("❌ خطأ: GROQ_API_KEY غير مضاف في Vercel!");
    return "أهلا بك! كيف بقدر ساعدك اليوم؟ 😊";
  }

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
- استعمل كلمات لبنانية: هلا، تكرم، حبيبي، كيف بقدر ساعدك، ولو، يلا
- لا تحكي سوري ابدا!
- خليك قصير و مفيد
- اذا سألوك عن التوصيل: عنا توصيل لكل لبنان 1-3 ايام والدفع عند الاستلام
- متجرنا: md-marketplace.store`
          },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7
      })
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("❌ خطأ قادم من Groq API:", JSON.stringify(data));
      return "هلا والله! تكرم عينك، كيف بقدر ساعدك؟";
    }

    return data.choices?.[0]?.message?.content || "هلا! كيف بقدر ساعدك اليوم؟";
  } catch (e) {
    console.error("❌ خطأ أثناء الاتصال بـ Groq:", e);
    return "هلا والله! صار عنا ضغط شوي، بس كيف بقدر ساعدك؟ 🙏";
  }
}

// 4. دالة التحقق من ميتا (GET)
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

// 5. دالة استقبال الرسائل (POST)
export async function POST(req) {
  try {
    const body = await req.json();
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (message) {
      const from = message.from;
      const text = message.text?.body || '';
      console.log(`📩 رسالة من ${from}: ${text}`);

      // 1. الحصول على الرد
      const reply = await getAIReply(text);
      console.log(`🤖 رد الـ AI: ${reply}`);

      // 2. إرسال للواتساب وحفظ في AppSheet
      await sendMessage(from, reply);
      await saveToAppSheet(from, text, reply);
    }
    return Response.json({ status: 'ok' }, { status: 200 });
  } catch (e) {
    console.error("❌ خطأ في POST Handler:", e);
    return Response.json({ status: 'ok' }, { status: 200 });
  }
}
