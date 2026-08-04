const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'mjahto123';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const GROQ_KEY = process.env.GROQ_API_KEY;

async function sendMessage(to, text) {
  await fetch(`https://graph.facebook.com/v20.0/${PHONE_ID}/messages`, {
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
}

async function getAIReply(userMessage) {
  if (!GROQ_KEY) return "أهلا! كيف بقدر ساعدك اليوم؟ 😊";

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
- لا تحكي سوري ابدا! ممنوع تقول: شلونك، ايش، هلق بدي احكي لبناني
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
    return data.choices[0].message.content;
  } catch (e) {
    console.error(e);
    return "هلا والله! صار عنا ضغط شوي، بس كيف بقدر ساعدك؟ 🙏";
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('hub.mode') === 'subscribe' && searchParams.get('hub.verify_token') === VERIFY_TOKEN) {
    return new Response(searchParams.get('hub.challenge'), { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (message) {
      const from = message.from;
      const text = message.text?.body || '';
      console.log(`من ${from}: ${text}`);
      const reply = await getAIReply(text);
      await sendMessage(from, reply);
    }
    return Response.json({ status: 'ok' }, { status: 200 });
  } catch (e) {
    console.error(e);
    return Response.json({ status: 'ok' }, { status: 200 });
  }
}
