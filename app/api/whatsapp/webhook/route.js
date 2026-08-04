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

  try {
    const res = await fetch(`https://graph.facebook.com/v26.0/${PHONE_ID}/messages`, {
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

    // قراءة الرسالة وتوليد الرد
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    const userText = message?.text?.body || body.text || "مرحبا";
    
    // ⚠️ ضع رقم هاتفك هنا مع مفتاح الدولة بدلاً من الرقم المؤقت (مثلاً: "9613177653" أو "9613177653")
    const targetPhone = message?.from || body.from || "9613177653";

    console.log(`📩 استقبال رسالة من: ${targetPhone} | النص: ${userText}`);

    // توليد الرد من الذكاء الاصطناعي
    const aiReply = await getAIReply(userText);
    console.log(`🤖 الرد المولّد: ${aiReply}`);

    // إرسال للواتساب وتخزين في AppSheet
    await sendMessage(targetPhone, aiReply);
    await saveToAppSheet(targetPhone, userText, aiReply);

    return Response.json({ status: 'ok' }, { status: 200 });
  } catch (e) {
    console.error("❌ خطأ POST:", e);
    return Response.json({ status: 'ok' }, { status: 200 });
  }
}
