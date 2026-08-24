import { createClient } from "@supabase/supabase-js";

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

// CRON Secret
const CRON_SECRET = process.env.CRON_SECRET || "MDM_SECRET_123";

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

function getBeirutNow() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Beirut" }));
}

async function getSheetRows(tableName) {
  const { data, error } = await supabase.from(tableName).select("*");
  if (error) throw new Error(error.message);
  return data || [];
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
    `https://api.appsheet.com/api/v2/apps/${APPSHEET_APP_ID}/tables/${table}/actions`,
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
// 🔥 المنطق الأساسي للـ CRON
// ----------------------------

export async function GET(req) {
  const url = new URL(req.url);
const authHeader = req.headers.get("authorization");
const secretParam = url.searchParams.get("secret");
if (authHeader !== `Bearer ${CRON_SECRET}` && secretParam !== CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // قراءة الجداول
    const messages = await getSheetRows("messages");
    const users = await getSheetRows("users");
    const newArrivals = await getSheetRows("new_arrivals");

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

    let processed = 0;

    // ----------------------------
    // 2) معالجة كل زبون
    // ----------------------------
    for (const phone in lastMsg) {
      const last = lastMsg[phone];

      const diffHours = (nowBeirut - last.date) / (1000 * 60 * 60);

     //if (diffHours < 12) continue;
     //if (diffHours > 24) continue;

      if (String(last.row["Reassurance_Sent"] || "") === "YES") continue;

      const user = users.find(u => normalize(u["WhatsApp Number"]) === phone);
      if (!user) continue;

      const name = user["Name"];
      const gender = String(user["Gender"] || "male").toLowerCase();
      const isFemale = gender === "female";

      let allowed = true;
      if (gender === "female") {
        //if (nowHour >= 10 && nowHour <= 12) allowed = true;
      } else {
       // if (nowHour >= 9 && nowHour <= 11) allowed = true;
      }
      if (!allowed) continue;

      const lower = last.text.toLowerCase();
      let type = "general";

      if (lower.includes("طلب") || lower.includes("اطلب") || lower.includes("اوردر")) type = "order";
      else if (lower.includes("وين") || lower.includes("موجود") || lower.includes("بدي")) type = "product";

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

      // ----------------------------
      // 5) إرسال الرسالة الصباحية
      // ----------------------------
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
