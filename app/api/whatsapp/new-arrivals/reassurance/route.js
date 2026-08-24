import { createClient } from "@supabase/supabase-js";
import { getgooglesheets } from "@/lib/googlesheets";

export const dynamic = "force-dynamic";

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const APPSHEET_APP_ID = process.env.APPSHEET_APP_ID;
const APPSHEET_API_KEY = process.env.APPSHEET_API_KEY;
const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID;
const CRON_SECRET = process.env.CRON_SECRET || "MDM_SECRET_123";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

function normalize(phone) {
  let c = String(phone || "").replace(/\D/g, "");
  if (!c) return null;
  if (c.startsWith("961")) return c;
  if (c.startsWith("0")) return "961" + c.substring(1);
  if (c.length === 8) return "961" + c;
  if (c.length === 7) return "9613" + c;
  return c;
}

function getBeirutNow() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Beirut" }));
}

async function getSheetRows(sheetName) {
  const sheets = await getgooglesheets();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEETS_ID, range: sheetName });
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
  const clean = normalize(to);
  if (!clean) return false;
  const res = await fetch(`https://graph.facebook.com/v26.0/${PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: clean, type: "text", text: { body: String(text||"") } })
  });
  const txt = await res.text();
  console.log(`SEND to ${clean}: ${res.status} - ${txt}`);
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

export async function GET(req) {
  const url = new URL(req.url);
  if (url.searchParams.get("secret")!== CRON_SECRET && req.headers.get("authorization")!== `Bearer ${CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const messages = await getSheetRows("Messages");
    const users = await getSheetRows("Users");
    const nowBeirut = getBeirutNow();

    // من تحت لفوق - آخر واحد حكى بس - بلا لوب
    let last = null;
    for (let i = messages.length - 1; i >= 0; i--) {
      const row = messages[i];
      if (!String(row["CustomerMessage"] || "").trim()) continue;
      if (String(row["Reassurance_Sent"] || "") === "YES") continue; // اذا already YES تخطاه
      last = row;
      break;
    }

    if (!last) {
      return new Response(JSON.stringify({ ok: true, msg: "ما في حدا جديد" }), { status: 200 });
    }

    const phone = normalize(last["Phone"]);
    const user = users.find(u => normalize(u["WhatsApp Number"]) === phone);

    if (!user) {
      return new Response(JSON.stringify({ ok: false, msg: `رقم ${phone} مش موجود بـ Users` }), { status: 200 });
    }

    const name = user["Name"] || "حبيبي";
    const isFemale = String(user["Gender"] || "").toLowerCase() === "female";

    // رسالة وحدة تكست
    const finalMsg = isFemale
     ? `صباح الخير ${name} 🌸 حبيت تكوني أول العارفين، نزل عنا شي جديد بيجنن 😍 بتحبي تشوفيه؟`
      : `صباح الخير ${name} 👋 حبيت تكون أول العارفين، نزل عنا شي جديد مرتب كتير، بتحب تشوفو؟`;

    console.log(`TRY SEND to ${phone}: ${finalMsg}`);
    const sent = await sendMessage(phone, finalMsg);

    if (sent) {
      await appSheetAction("Messages", "Edit", [{
        "Message ID": last["Message ID"],
        "Reassurance_Sent": "YES",
        "Reassurance_At": nowBeirut.toLocaleString("en-US", { timeZone: "Asia/Beirut" })
      }]);
    }

    return new Response(JSON.stringify({ ok: sent, phone, msg: finalMsg }), { status: 200 });

  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 });
  }
}
