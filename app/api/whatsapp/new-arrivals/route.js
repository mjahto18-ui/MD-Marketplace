import { getgooglesheets } from "@/lib/googlesheets";
export const dynamic = "force-dynamic";

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const APPSHEET_APP_ID = process.env.APPSHEET_APP_ID;
const APPSHEET_API_KEY = process.env.APPSHEET_API_KEY;
const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID;

function normalize(phone) {
  let c = String(phone || "").replace(/\D/g, "");
  if (!c) return null;
  if (c.startsWith("961")) return c;
  if (c.startsWith("966")) return c;
  if (c.startsWith("0")) c = c.substring(1);
  if (c.length === 9 && c.startsWith("5")) return "966" + c;
  if (c.length === 10 && c.startsWith("5")) return "966" + c;
  if (c.length === 7 && c.startsWith("3")) return "961" + c;
  if (c.length === 8) return "961" + c;
  return c;
}
function getBeirutNow() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Beirut" }));
}
async function getSheetRows(sheetName) {
  console.log(`📥 Reading ${sheetName}`);
  const sheets = await getgooglesheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: GOOGLE_SHEETS_ID,
    range: sheetName,
  });
  const rows = res.data.values || [];
  console.log(`📄 ${sheetName} -> ${rows.length} rows`);
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map((r) => {
    const obj = {};
    headers.forEach((h, i) => (obj[h] = r[i] || ""));
    return obj;
  });
}

async function sendMessage(to, text) {
  console.log(`📤 SEND MSG TRY to ${to}: ${String(text||"").slice(0,100)}`);
  const res = await fetch(`https://graph.facebook.com/v26.0/${PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } })
  });
  const txt = await res.text();
  console.log(`📬 SEND MSG to ${to}: ${res.status} - ${txt}`);
  return res.ok;
}

async function sendImage(to, imageUrl, caption) {
  console.log(`📤 SEND IMG TRY to ${to}: ${imageUrl}`);
  const res = await fetch(`https://graph.facebook.com/v26.0/${PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "image", image: { link: imageUrl, caption } })
  });
  const txt = await res.text();
  console.log(`📬 SEND IMG to ${to}: ${res.status} - ${txt}`);
  return res.ok;
}

async function appSheetAction(table, action, rows) {
  const res = await fetch(`https://api.appsheet.com/api/v2/apps/${APPSHEET_APP_ID}/tables/${table}/Action`, {
    method: "POST",
    headers: { "ApplicationAccessKey": APPSHEET_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ Action: action, Properties: { Locale: "en-US", Timezone: "Asia/Beirut" }, Rows: rows })
  });
  const txt = await res.text();
  console.log(`AppSheet ${table} ${action}:`, res.status, txt);
  return txt;
}

export async function POST(req) {
  const body = await req.json();
  console.log(`📥 WEBHOOK HIT: ${JSON.stringify(body).slice(0,800)}`);
  const entry = body.entry?.[0]?.changes?.[0]?.value;
  const msg = entry?.messages?.[0];
  if (!msg) return Response.json({ ok: true });

  const from = normalize(msg.from);
  const rawText = msg.text?.body?.trim() || "";
  const text = rawText.toLowerCase();

  // 1) بوابة ايه - اول كلمة بس
  const yesWords = ["ايه", "اي", "نعم", "اوكي", "يلا", "تمام", "شوف", "خليني شوف"];
  const firstWord = text.split(" ")[0];
  const isYes = yesWords.includes(firstWord) || yesWords.includes(text);
  console.log("📩 from:", from, "text:", text, "isYes:", isYes);
  if (!isYes) return Response.json({ ok: true });

  // 2) FIXED: شوف ساعة الـ YES مش ساعة المحادثة + آخر صف بس
  const allMessages = await getSheetRows("Messages");
  const userMessages = allMessages.filter(m => normalize(m["Phone"]) === from);
  if (userMessages.length === 0) {
    console.log(`❌ No messages for ${from}`);
    return Response.json({ ok: true });
  }
  const lastRow = userMessages[userMessages.length - 1]; // آخر صف فقط
  console.log(`🔍 Last row for ${from}:`, JSON.stringify(lastRow));

  // اذا آخر صف هو تبع عروض انبعتت قبل، لا ترجع تبعت
  if (String(lastRow["Message Type"]||"").includes("NEW_ARRIVALS")) {
    console.log(`⏭ SKIP ${from} last msg was already NEW_ARRIVALS`);
    return Response.json({ ok: true });
  }

  const reassuranceSent = String(lastRow["Reassurance_Sent"] || "").toUpperCase();
  if (reassuranceSent!== "YES") {
    console.log(`⏭ SKIP ${from} last row Reassurance_Sent=${reassuranceSent}!= YES`);
    return Response.json({ ok: true });
  }

  const reassuranceAtStr = lastRow["Reassurance_At"] || lastRow["Date"];
  if (!reassuranceAtStr) {
    console.log(`❌ SKIP ${from} no Reassurance_At`);
    return Response.json({ ok: true });
  }
  const yesTime = new Date(reassuranceAtStr);
  const now = getBeirutNow();
  const diffMin = (now - yesTime) / (1000 * 60);
  console.log(`⏰ YES time: ${reassuranceAtStr} -> diff ${diffMin.toFixed(1)}min`);

  if (diffMin < 0 || diffMin > 30) { // ساعة الـ YES
    console.log(`⏭ SKIP ${from} diffMin ${diffMin} > 30`);
    return Response.json({ ok: true });
  }

  console.log(`✅ بوابة العروض مفتوحة لـ ${from}`);

  // 3) جيب الزبون
  const users = await getSheetRows("Users");
  const user = users.find(u => normalize(u["WhatsApp Number"]) === from);
  if (!user) {
    console.log(`❌ SKIP ${from} مش موجود بجدول Users!`);
    return Response.json({ ok: true });
  }
  const gender = String(user["Gender"] || "male").toLowerCase();

  // 4) جيب العروض
  const arrivals = await getSheetRows("new_arrivals");
  const suitable = arrivals.filter(p => {
    const added = new Date(p["Date Added"]);
    const diffDays = (now - added) / (1000 * 60 * 60 * 24);
    if (diffDays > 3) return false;
    const target = String(p["Gender Target"] || "both").toLowerCase();
    return target === "both" || target === gender;
  });

  if (suitable.length === 0) {
  await sendMessage(from, "ولا يهمّك! ما في شي جديد مناسب إلك هاليومين 🌸");
} else {
  for (const p of suitable) {
    const isSensitive = String(p["Is Sensitive"] || "").toUpperCase() === "TRUE";
    if (isSensitive && gender === "male") continue;

    if (isSensitive) {
      // حساس -> صورة + معلومات قصيرة بلا Description
      const shortText = `${p["Product Name"]}\nالسعر: ${p["Price"]}\nالحجم: ${p["Size"]}\n\nللطلب 👇\n${p["Product Link"]}`;
      if (p["Image URL"]) {
        await sendImage(from, p["Image URL"], shortText);
      } else {
        await sendMessage(from, shortText);
      }
    } else {
      // مش حساس -> صورة + وصف كامل
      const fullText = `*${p["Product Name"]}*\n🏷 ${p["Brand"]}\n💰 ${p["Price"]}\n📦 ${p["Size"]}\n${p["Description"]}\n\nللطلب 👇\n${p["Product Link"]}`;
      if (p["Image URL"]) {
        await sendImage(from, p["Image URL"], fullText);
      } else {
        await sendMessage(from, fullText);
      }
    }
    await new Promise(r => setTimeout(r, 1000));
  }
}

  // 5) سكر البوابة - سجل انه انبعت
  const beirutStr = now.toLocaleString("en-US", { timeZone: "Asia/Beirut" });
  await appSheetAction("Messages", "Add", [{
    Phone: from,
    CustomerMessage: rawText,
    AIReply: "PRODUCTS_SENT_VIA_BRIDGE",
    Date: beirutStr,
    "Reassurance_Sent": "OFFERS_DONE", // مش YES عشان ما ترجع تفتح
    "Reassurance_At": beirutStr,
    Bot: "BOT1",
    "Message Type": "NEW_ARRIVALS",
  }]);

  return Response.json({ ok: true });
}
