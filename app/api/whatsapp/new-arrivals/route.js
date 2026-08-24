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
  console.log(`📥 Reading ${sheetName}`); // LOG ADDED
  const sheets = await getgooglesheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: GOOGLE_SHEETS_ID,
    range: sheetName,
  });
  const rows = res.data.values || [];
  console.log(`📄 ${sheetName} -> ${rows.length} rows`); // LOG ADDED
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map((r) => {
    const obj = {};
    headers.forEach((h, i) => (obj[h] = r[i] || ""));
    return obj;
  });
}

async function sendMessage(to, text) {
  console.log(`📤 SEND MSG TRY to ${to}: ${String(text||"").slice(0,100)}`); // LOG ADDED
  const res = await fetch(`https://graph.facebook.com/v26.0/${PHONE_ID}/messages`, {
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
  const txt = await res.text();
  console.log(`📬 SEND MSG to ${to}: ${res.status} - ${txt}`); // LOG ADDED
  return res.ok;
}

async function sendImage(to, imageUrl, caption) {
  console.log(`📤 SEND IMG TRY to ${to}: ${imageUrl}`); // LOG ADDED
  const res = await fetch(`https://graph.facebook.com/v26.0/${PHONE_ID}/messages`, {
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
  const txt = await res.text();
  console.log(`📬 SEND IMG to ${to}: ${res.status} - ${txt}`); // LOG ADDED
  return res.ok;
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
  console.log(`📥 WEBHOOK HIT: ${JSON.stringify(body).slice(0,800)}`); // LOG ADDED
  const entry = body.entry?.[0]?.changes?.[0]?.value;
  const msg = entry?.messages?.[0];

  if (!msg) {
    console.log(`❌ WEBHOOK No msg found`); // LOG ADDED
    return Response.json({ ok: true });
  }

  const from = normalize(msg.from);
  const text = msg.text?.body?.trim().toLowerCase() || "";

  // ----------------------------
  // 1) إذا ما قال "إيه" → تجاهل
  // ----------------------------
  const yesWords = ["ايه", "اي", "نعم", "اوكي", "يلا", "تمام", "شوف", "خليني شوف"];
  const isYes = yesWords.some(w => text.includes(w));
  console.log("📩 from:", from, "text:", text, "isYes:", isYes);
  if (!isYes) {
    console.log(`⏭️ SKIP ${from} not yes word`); // LOG ADDED
    return Response.json({ ok: true });
  }

  // ----------------------------
  // 2) جيب بيانات الزبون - من غوغل شيت
  // ----------------------------
  const users = await getSheetRows("Users");
  console.log(`Users loaded: ${users.length}`); // LOG ADDED
  console.log(`Users nums:`, users.map(u => `${u["WhatsApp Number"]} -> ${normalize(u["WhatsApp Number"])}`)); // LOG ADDED
  const user = users.find(u => normalize(u["WhatsApp Number"]) === from);
  if (!user) {
    console.log(`❌ SKIP ${from} مش موجود بجدول Users!`); // LOG ADDED
    return Response.json({ ok: true });
  }

  console.log(`✅ USER FOUND ${from} -> ${user["Name"]} Gender=${user["Gender"]}`); // LOG ADDED

  const gender = String(user["Gender"] || "male").toLowerCase();

  // ----------------------------
  // 3) جيب المنتجات الجديدة - من غوغل شيت
  // ----------------------------
  const now = new Date();
  const arrivals = await getSheetRows("new_arrivals");
  console.log(`new_arrivals loaded: ${arrivals.length}`); // LOG ADDED

  const suitable = arrivals.filter(p => {
    const added = new Date(p["Date Added"]);
    const diffDays = (now - added) / (1000 * 60 * 60 * 24);
    if (diffDays > 3) {
      console.log(`⏭️ SKIP product ${p["Product Name"]} diffDays=${diffDays.toFixed(1)} >3`); // LOG ADDED
      return false;
    }

    const target = String(p["Gender Target"] || "both").toLowerCase();
    if (target === "both") return true;
    if (target === gender) return true;

    console.log(`⏭️ SKIP product ${p["Product Name"]} target=${target}!= gender=${gender}`); // LOG ADDED
    return false;
  });

  console.log(`✅ Suitable products: ${suitable.length}`); // LOG ADDED

  if (suitable.length === 0) {
    console.log(`📤 No suitable, sending fallback msg`); // LOG ADDED
    await sendMessage(from, "ولا يهمّك! ما في شي جديد مناسب إلك هاليومين 🌸");
    return Response.json({ ok: true });
  }

  // ----------------------------
  // 4) كبّ المنتجات واحد واحد
  // ----------------------------
  for (const p of suitable) {
    const isSensitive = String(p["Is Sensitive"] || "").toUpperCase() === "TRUE";
    console.log(`📦 Product: ${p["Product Name"]} sensitive=${isSensitive} gender=${gender} -> ${isSensitive && gender==="male"? "SKIP" : "SEND"}`); // LOG ADDED

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
  console.log(`📝 Logging to AppSheet Messages Add`); // LOG ADDED
  await appSheetAction("Messages", "Add", [{
    Phone: from,
    CustomerMessage: "BOT1_NEW_ARRIVALS_SENT",
    AIReply: "PRODUCTS_SENT",
    Date: new Date().toISOString(),
    Bot: "BOT1",
    "Message Type": "NEW_ARRIVALS",
  }]);

  console.log(`✅ DONE for ${from}`); // LOG ADDED
  return Response.json({ ok: true });
}
