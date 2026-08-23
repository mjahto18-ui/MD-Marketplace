import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// ----------------------------
// 🔥 مفاتيح البيئة
// ----------------------------
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID;

const APPSHEET_APP_ID = process.env.APPSHEET_APP_ID;
const APPSHEET_API_KEY = process.env.APPSHEET_API_KEY;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ----------------------------
// 🔧 Helpers
// ----------------------------
function normalize(phone) {
  let c = String(phone || "").replace(/\D/g, "");
  if (c.startsWith("05")) c = "966" + c.substring(1);
  else if (c.length === 9 && c.startsWith("5")) c = "966" + c;
  else if (c.startsWith("03")) c = "9613" + c.substring(2);
  else if (c.length === 7 && c.startsWith("3")) c = "961" + c;
  return c;
}

async function sendMessage(to, text) {
  await fetch(`https://graph.facebook.com/v26.0/${PHONE_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text }
    })
  });
}

async function sendImage(to, imageUrl, caption) {
  await fetch(`https://graph.facebook.com/v26.0/${PHONE_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "image",
      image: { link: imageUrl, caption }
    })
  });
}

async function appSheetAction(table, action, rows) {
  await fetch(
    `https://api.appsheet.com/api/v2/apps/${APPSHEET_APP_ID}/tables/${table}/actions/${action}`,
    {
      method: "POST",
      headers: {
        ApplicationAccessKey: APPSHEET_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ Rows: rows })
    }
  );
}

// ----------------------------
// 🔥 الرد على رسائل الواتساب
// ----------------------------
export async function POST(req) {
  const body = await req.json();
  const entry = body.entry?.[0]?.changes?.[0]?.value;
  const msg = entry?.messages?.[0];

  if (!msg) return Response.json({ ok: true });

  const from = normalize(msg.from);
  const text = msg.text?.body?.trim().toLowerCase() || "";

  // ----------------------------
  // 1) إذا ما قال "إيه" → تجاهل
  // ----------------------------
  const yesWords = ["ايه", "اي", "نعم", "اوكي", "يلا", "تمام", "شوف", "خليني شوف"];
  const isYes = yesWords.some(w => text.includes(w));
  if (!isYes) return Response.json({ ok: true });

  // ----------------------------
  // 2) جيب بيانات الزبون
  // ----------------------------
  const { data: users } = await supabase.from("Users").select("*");
  const user = users.find(u => normalize(u["WhatsApp Number"]) === from);
  if (!user) return Response.json({ ok: true });

  const gender = String(user["Gender"] || "male").toLowerCase();

  // ----------------------------
  // 3) جيب المنتجات الجديدة
  // ----------------------------
  const now = new Date();
  const { data: arrivals } = await supabase.from("New Arrivals").select("*");

  const suitable = arrivals.filter(p => {
    const added = new Date(p["Date Added"]);
    const diffDays = (now - added) / (1000 * 60 * 60 * 24);
    if (diffDays > 3) return false;

    const target = String(p["Gender Target"] || "both").toLowerCase();
    if (target === "both") return true;
    if (target === gender) return true;

    return false;
  });

  if (suitable.length === 0) {
    await sendMessage(from, "ولا يهمّك! ما في شي جديد مناسب إلك هاليومين 🌸");
    return Response.json({ ok: true });
  }

  // ----------------------------
  // 4) كبّ المنتجات واحد واحد
  // ----------------------------
  for (const p of suitable) {
    const isSensitive = String(p["Is Sensitive"] || "").toUpperCase() === "TRUE";

    // حماية البنات
    if (isSensitive && gender === "male") {
      continue; // ممنوع ينرسل لشب
    }

    if (isSensitive) {
      // ----------------------------
      // 🔥 منتج حساس → صورة + رابط فقط
      // ----------------------------
      const caption =
        `${p["Product Name"]}\n` +
        `السعر: ${p["Price"]}\n` +
        `الحجم: ${p["Size"]}\n` +
        `🔗 للطلب: ${p["Product Link"]}`;

      await sendImage(from, p["Image URL"], caption);
    } else {
      // ----------------------------
      // 🔥 منتج عادي → نص + فروع
      // ----------------------------
      const text =
        `*${p["Product Name"]}*\n\n` +
        `🏷️ البراند: ${p["Brand"]}\n` +
        `📦 الحجم: ${p["Size"]}\n` +
        `💰 السعر: ${p["Price"]}\n\n` +
        `${p["Description"]}\n\n` +
        `📍 موجود بفرع الحمرا وحارة حريك!\n` +
        `🔗 للطلب: ${p["Product Link"]}`;

      await sendMessage(from, text);
    }
  }

  // ----------------------------
  // 5) سجّل داخل Messages إنو كبّينا المنتجات
  // ----------------------------
  await appSheetAction("Messages", "Add", [{
    Phone: from,
    CustomerMessage: "BOT1_NEW_ARRIVALS_SENT",
    AIReply: "PRODUCTS_SENT",
    Date: new Date().toISOString(),
    Bot: "BOT1",
    "Message Type": "NEW_ARRIVALS",
  }]);

  return Response.json({ ok: true });
}
