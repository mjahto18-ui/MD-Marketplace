import { createClient } from "@supabase/supabase-js";
import { getgooglesheets } from "@/lib/googlesheets"; // غيّر المسار اذا عندك غير

export const dynamic = "force-dynamic";

// ----------------------------
// 🔥 مفاتيح البيئة
// ----------------------------

// WhatsApp Cloud API
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID;

// AppSheet
const APPSHEET_APP_ID = process.env.APPSHEET_APP_ID;
const APPSHEET_API_KEY = process.env.APPSHEET_API_KEY;

// Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Google Sheets
const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID;

// CRON Secret
const CRON_SECRET = process.env.CRON_SECRET || "MDM_SECRET_123";

// ----------------------------
// 🔧 Helpers
// ----------------------------

function normalize(phone) {
  function normalize(phone) {
  let c = String(phone || "").replace(/\D/g, "");
  if (!c) return null;

  // 1- اذا الرقم اصلا دولي - رجعه متل ما هو
  if (c.startsWith("961")) return c; // لبنان 9613xxxxxx (10) او 96171xxxxxx (11)
  if (c.startsWith("966")) return c; // السعودية 9665xxxxxxxx (12)

  // 2- اذا سعودي محلي: 0551653968 (10 ارقام) او 551653968 (9 ارقام)
  if (c.startsWith("0") && c.length === 10 && c[1] === '5') {
    return "966" + c.substring(1); // 0551653968 -> 966551653968
  }
  if (c.length === 9 && c.startsWith("5")) {
    return "966" + c; // 551653968 -> 966551653968
  }

  // 3- اذا لبناني محلي: 03xxxxxx او 71xxxxxx
  if (c.startsWith("0")) c = c.substring(1); // شيل الصفر

  if (c.length === 8) {
    return "961" + c; // 3177653(0) -> 9613177653 و 71777653 -> 96171777653
  }

  return null;
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
  const clean = normalize(to); // هون استخدمناها!!!
  if (!clean) { console.log(`❌ رقم غلط ${to}`); return false; }

  const res = await fetch(`https://graph.facebook.com/v26.0/${PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: clean, type: "text", text: { body: String(text||"") } })
  });
  const txt = await res.text();
  console.log(`SEND to ${clean} (from ${to}): ${res.status} - ${txt}`);
  return res.ok;
}

async function sendImage(to, imageUrl, caption) {
  const clean = normalize(to); // هون كمان!!!
  if (!clean) return false;
  const res = await fetch(`https://graph.facebook.com/v26.0/${PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: clean, type: "image", image: { link: imageUrl, caption: String(caption||"") } })
  });
  const txt = await res.text();
  console.log(`SEND IMAGE to ${clean}: ${res.status} - ${txt}`);
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
// 🔥 المنطق الأساسي للـ CRON
// ----------------------------

export async function GET(req) {
  const url = new URL(req.url);
const authHeader = req.headers.get("authorization");
const secretParam = url.searchParams.get("secret");
if (authHeader!== `Bearer ${CRON_SECRET}` && secretParam!== CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // قراءة الجداول
    const messages = await getSheetRows("Messages");
    const users = await getSheetRows("Users");
    const newArrivals = await getSheetRows("new_arrivals");
    console.log("Messages:", messages.length, "Users:", users.length, "NewArrivals:", newArrivals.length);

    const nowBeirut = getBeirutNow();
    const nowHour = nowBeirut.getHours();

    // ----------------------------
    // 1) آخر رسالة لكل رقم
    // ----------------------------
    const lastMsg = {};
    for (let i = messages.length - 1; i >= 0; i--) {
      const row = messages[i];
      const phone = normalize(row["Phone"]);
      if (!phone) continue;
      if (lastMsg[phone]) continue;

      const cust = String(row["CustomerMessage"] || "").trim();
      if (!cust) continue;

      lastMsg[phone] = {
        phone,
        text: cust,
        date: new Date(row["Date"]),
        row
      };
    }

    // 🔥 LOG ADDED
    console.log(`lastMsg unique=${Object.keys(lastMsg).length}`);
    console.log(`lastMsg phones:`, Object.keys(lastMsg));

    let processed = 0;

    // ----------------------------
    // 2) معالجة كل زبون
    // ----------------------------
    for (const phone in lastMsg) {
      const last = lastMsg[phone];

      const diffHours = (nowBeirut - last.date) / (1000 * 60 * 60);

    // if (diffHours < 12) continue;
    // if (diffHours > 24) continue;

      // 🔥 LOG ADDED
      console.log(`--- ${phone} Reassurance_Sent=[${last.row["Reassurance_Sent"]}] Date=${last.row["Date"]} diffHours=${diffHours.toFixed(2)} ---`);

      if (String(last.row["Reassurance_Sent"] || "") === "YES") {
        console.log(`⏭️ SKIP ${phone} already YES`);
        continue;
      }

      const user = users.find(u => normalize(u["WhatsApp Number"]) === phone);
      if (!user) {
        // 🔥 LOG ADDED
        console.log(`❌ SKIP ${phone} مش موجود بجدول Users!`);
        console.log(`Users normalized:`, users.map(u => `${u["WhatsApp Number"]} -> ${normalize(u["WhatsApp Number"])}`));
        continue;
      }

      // 🔥 LOG ADDED
      console.log(`✅ USER FOUND ${phone} -> Name=${user["Name"]} Gender=${user["Gender"]}`);

      const name = user["Name"];
      const gender = String(user["Gender"] || "male").toLowerCase();
      const isFemale = gender === "female";

      let allowed = true;
      if (gender === "female") {
        //if (nowHour >= 10 && nowHour <= 12) allowed = true;
      } else {
        //if (nowHour >= 9 && nowHour <= 11) allowed = true;
      }
      if (!allowed) {
        // 🔥 LOG ADDED
        console.log(`⏭️ SKIP ${phone} not allowed hour=${nowHour}`);
        continue;
      }

      const lower = last.text.toLowerCase();
      let type = "general";

      if (lower.includes("طلب") || lower.includes("اطلب") || lower.includes("اوردر")) type = "order";
      else if (lower.includes("وين") || lower.includes("موجود") || lower.includes("بدي")) type = "product";

      // 🔥 LOG ADDED
      console.log(`type=${type} text=${last.text.slice(0,50)}`);

      // ----------------------------
      // 3) فلترة المنتجات الجديدة المناسبة
      // ----------------------------
      const suitableProducts = newArrivals.filter(p => {
        const added = new Date(p["Date Added"]);
        const diffDays = (nowBeirut - added) / (1000 * 60 * 60 * 24);
        if (diffDays > 3) return false;

        const target = String(p["Gender Target"] || "both").toLowerCase();
        if (target === "both") return true;
        if (target === gender) return true;

        return false;
      });

      const hasNew = suitableProducts.length > 0;

      // 🔥 LOG ADDED
      console.log(`hasNew=${hasNew} suitableCount=${suitableProducts.length} for ${phone}`);

      // ----------------------------
      // 4) بناء الرسالة الصباحية - الرسايل الجديدة
      // ----------------------------
      let finalMsg = "";
      if (isFemale) {
        const femalePool = [
          `صباح الخير ${name} 🌸 حبيت تكوني أول العارفين، نزل عنا شي جديد بيجنن 😍 بتحبي تشوفيه؟`,
          `مرحبا كيفك ${name} 🌸 عطول بتذكرك، في اشيا رخيصة عم تنعرض هاليومين و حبيت فيدك، بتحبي تشوفي؟`,
          `هلا ${name} 🫶 نزلنا شغلات جديدة و قلت انتي لازم تكوني أول وحدة بتعرف، بدك تشوفي؟`,
          `هلا ${name} كيفك؟ انتي عطول عالبال 🌸 في عروض حلوة و رخيصة نازلة و قلت فيدك دغري 😊`
        ];
        finalMsg = femalePool[Math.floor(Math.random() * femalePool.length)];
      } else {
        const malePool = [
          `صباح الخير ${name} 👋 حبيت تكون أول العارفين، نزل عنا شي جديد مرتب كتير، بتحب تشوفو؟`,
          `مرحبا كيفك ${name} 👋 عطول بتذكرك، في اشيا رخيصة عم تنعرض و حبيت فيدك، بتحب تشوف؟`,
          `هلا ${name}، نزلنا جديد و قلت انت أول واحد لازم يعرف، بتحب أبعتلك؟`,
          `هلا ${name} كيفك؟ انت عطول عالبال، في شغلات رخيصة و مرتبة نازلة و حبيت خبرك`
        ];
        finalMsg = malePool[Math.floor(Math.random() * malePool.length)];
      }

      // 🔥 LOG ADDED
      console.log(`💬 FINAL MSG to ${phone}: ${finalMsg}`);

      // ----------------------------
      // 5) إرسال الرسالة الصباحية
      // ----------------------------
      // 🔥 LOG ADDED
      console.log(`📤 SEND TRY to ${phone}`);
      await sendMessage(phone, finalMsg);

      // ----------------------------
      // 6) تسجيل YES داخل Messages
      // ----------------------------
      await appSheetAction("Messages", "Edit", [{
        "Message ID": last.row["Message ID"],
        "Reassurance_Sent": "YES",
        "Reassurance_At": nowBeirut.toLocaleString("en-US", { timeZone: "Asia/Beirut" })
      }]);

      processed++;
    }

    return new Response(JSON.stringify({ ok: true, processed }), {
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
