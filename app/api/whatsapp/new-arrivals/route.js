import { getgooglesheets } from "@/lib/googlesheets";

export const dynamic = "force-dynamic";

// ----------------------------
// 🔥 مفاتيح البيئة
// ----------------------------
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const APPSHEET_APP_ID = process.env.APPSHEET_APP_ID;
const APPSHEET_API_KEY = process.env.APPSHEET_API_KEY;
const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID;

// ----------------------------
// 🔧 Helpers
// ----------------------------
function normalize(phone) {
  let c = String(phone || "").replace(/\D/g, "");
  if (!c) return null;

  // اذا اصلا نورمالايزد
  if (c.startsWith("961")) return c; // 9613177653 (10) او 96171177653 (11) - التنين صح

  // اذا ببلش بـ 0 -> 03 177653 -> 9613177653
  if (c.startsWith("0")) {
    return "961" + c.substring(1); // بيشيل الصفر وبيحط 961
  }

  // اذا 8 ارقام بدون صفر -> 71177653 -> 96171177653
  if (c.length === 8) {
    return "961" + c;
  }

  // اذا 7 ارقام (نادر) -> 3177653 -> 9613177653
  if (c.length === 7) {
    return "9613" + c;
  }

  return c;
}


async function getSheetRows(sheetName) {
  const sheets = await getgooglesheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: GOOGLE_SHEETS_ID,
    range: sheetName,
  });
  const rows = res.data.values || [];
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map((r) => {
    const obj = {};
    headers.forEach((h, i) => (obj[h] = r[i] || ""));
    return obj;
  });
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
  const res = await fetch(
    `https://api.appsheet.com/api/v2/apps/${APPSHEET_APP_ID}/tables/${table}/Action`,
    {
      method: "POST",
      headers: {
        "ApplicationAccessKey": APPSHEET_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        Action: action,
        Properties: { Locale: "en-US", Timezone: "Asia/Beirut" },
        Rows: rows
      })
    }
  );
  const txt = await res.text();
  console.log(`AppSheet ${table} ${action}:`, res.status, txt);
  return txt;
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
  console.log("📩 from:", from, "text:", text, "isYes:", isYes);
  if (!isYes) return Response.json({ ok: true });

  // ----------------------------
  // 2) جيب بيانات الزبون - من غوغل شيت
  // ----------------------------
  const users = await getSheetRows("Users");
  const user = users.find(u => normalize(u["WhatsApp Number"]) === from);
  if (!user) return Response.json({ ok: true });

  const gender = String(user["Gender"] || "male").toLowerCase();

  // ----------------------------
  // 3) جيب المنتجات الجديدة - من غوغل شيت
  // ----------------------------
  const now = new Date();
  const arrivals = await getSheetRows("new_arrivals");

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
      const caption =
        `${p["Product Name"]}\n` +
        `السعر: ${p["Price"]}\n` +
        `الحجم: ${p["Size"]}\n` +
        `🔗 للطلب: ${p["Product Link"]}`;

      await sendImage(from, p["Image URL"], caption);
    } else {
      const textMsg =
        `*${p["Product Name"]}*\n\n` +
        `🏷 البراند: ${p["Brand"]}\n` +
        `📦 الحجم: ${p["Size"]}\n` +
        `💰 السعر: ${p["Price"]}\n\n` +
        `${p["Description"]}\n\n` +
        `📍 موجود بفرع الحمرا وحارة حريك!\n` +
        `🔗 للطلب: ${p["Product Link"]}`;

      await sendMessage(from, textMsg);
    }
  }

  // ----------------------------
  // 5) سجّل داخل Messages إنو كبّينا المنتجات - AppSheet
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
