import { createClient } from "@supabase/supabase-js";
import { getgooglesheets } from "@/lib/googlesheets";

export const dynamic = "force-dynamic";

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const APPSHEET_APP_ID = process.env.APPSHEET_APP_ID;
const APPSHEET_API_KEY = process.env.APPSHEET_API_KEY;
const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID;
const CRON_SECRET = process.env.CRON_SECRET || "MDM_SECRET_123";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

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
  const res = await fetch(
    `https://api.appsheet.com/api/v2/apps/${APPSHEET_APP_ID}/tables/${table}/Action`,
    {
      method: "POST",
      headers: { "ApplicationAccessKey": APPSHEET_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ Action: action, Properties: { Locale: "en-US", Timezone: "Asia/Beirut" }, Rows: rows })
    }
  );
  const txt = await res.text();
  console.log(`AppSheet ${table} ${action}:`, res.status, txt);
  return txt;
}

export async function GET(req) {
  const url = new URL(req.url);
  const authHeader = req.headers.get("authorization");
  const secretParam = url.searchParams.get("secret");
  if (authHeader!== `Bearer ${CRON_SECRET}` && secretParam!== CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const messages = await getSheetRows("Messages");
    const users = await getSheetRows("Users");
    console.log("Messages:", messages.length, "Users:", users.length);

    const nowBeirut = getBeirutNow();

    // آخر رسالة لكل رقم - بلا شرط وقت
    const lastMsg = {};
    for (let i = messages.length - 1; i >= 0; i--) {
      const row = messages[i];
      const phone = normalize(row["Phone"]);
      if (!phone) continue;
      if (lastMsg[phone]) continue;
      const cust = String(row["CustomerMessage"] || "").trim();
      if (!cust) continue;
      lastMsg[phone] = { phone, text: cust, date: new Date(row["Date"]), row };
    }

    console.log(`lastMsg unique=${Object.keys(lastMsg).length}`);

    let processed = 0;

    for (const phone in lastMsg) {
      const last = lastMsg[phone];

      // ❌ لغينا شرط 12 و 24 ساعة كلياً - بيشتغل عالاستدعاء
      // const diffHours = (nowBeirut - last.date) / (1000 * 60 * 60);
      // if (diffHours < 12) continue;
      // if (diffHours > 24) continue;

      if (String(last.row["Reassurance_Sent"] || "") === "YES") {
        console.log(`⏭ SKIP ${phone} already YES`);
        continue;
      }

      const user = users.find(u => normalize(u["WhatsApp Number"]) === phone);
      if (!user) {
        console.log(`❌ SKIP ${phone} مش موجود بجدول Users!`);
        continue;
      }

      const name = user["Name"];
      const gender = String(user["Gender"] || "male").toLowerCase();
      const isFemale = gender === "female";

      let finalMsg = "";
      if (isFemale) {
        const pool = [
          `صباح الخير ${name} 🌸 حبيت تكوني أول العارفين، نزل عنا شي جديد بيجنن 😍 بتحبي تشوفيه؟`,
          `مرحبا كيفك ${name} 🌸 عطول بتذكرك، في اشيا رخيصة عم تنعرض هاليومين و حبيت فيدك، بتحبي تشوفي؟`,
          `هلا ${name} 🫶 نزلنا شغلات جديدة و قلت انتي لازم تكوني أول وحدة بتعرف، بدك تشوفي؟`,
          `هلا ${name} كيفك؟ انتي عطول عالبال 🌸 في عروض حلوة و رخيصة نازلة و قلت فيدك دغري 😊`
        ];
        finalMsg = pool[Math.floor(Math.random() * pool.length)];
      } else {
        const pool = [
          `صباح الخير ${name} 👋 حبيت تكون أول العارفين، نزل عنا شي جديد مرتب كتير، بتحب تشوفو؟`,
          `مرحبا كيفك ${name} 👋 عطول بتذكرك، في اشيا رخيصة عم تنعرض و حبيت فيدك، بتحب تشوف؟`,
          `هلا ${name}، نزلنا جديد و قلت انت أول واحد لازم يعرف، بتحب أبعتلك؟`,
          `هلا ${name} كيفك؟ انت عطول عالبال، في شغلات رخيصة و مرتبة نازلة و حبيت خبرك`
        ];
        finalMsg = pool[Math.floor(Math.random() * pool.length)];
      }

      console.log(`💬 FINAL MSG to ${phone}: ${finalMsg}`);
      console.log(`📤 SEND TRY to ${phone}`);
      await sendMessage(phone, finalMsg);

      // سجل YES
      if (last.row["Message ID"]) {
        await appSheetAction("Messages", "Edit", [{
          "Message ID": last.row["Message ID"],
          "Reassurance_Sent": "YES",
          "Reassurance_At": nowBeirut.toLocaleString("en-US", { timeZone: "Asia/Beirut" })
        }]);
      }

      processed++;
    }

    return new Response(JSON.stringify({ ok: true, processed, mode: "ON_CALL_NO_TIME_CHECK" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (e) {
    console.error("Keepalive error:", e);
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
