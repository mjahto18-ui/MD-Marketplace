export const dynamic = "force-dynamic";
import { createClient } from "@supabase/supabase-js";

const VERIFY = process.env.CRON_SECRET || "MDM_SECRET_123";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

function normalize(phone) {
  let c = String(phone || "").replace(/\D/g, "");
  if (c.startsWith("05")) c = "966" + c.substring(1);
  else if (c.length === 9 && c.startsWith("5")) c = "966" + c;
  else if (c.startsWith("03")) c = "9613" + c.substring(2);
  else if (c.length === 7 && c.startsWith("3")) c = "961" + c;
  else if (c.startsWith("0")) c = "961" + c.slice(1);
  else if (c.length === 8) c = "961" + c;
  return c;
}
function getBeirutNow() { return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Beirut" })); }

async function sendMessage(to, text) {
  const PHONE_ID = process.env.WHATSAPP_PHONE_ID || "1183824331491327";
  await fetch(`https://graph.facebook.com/v18.0/${PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } }),
  });
}

async function appSheetAction(table, action, rows) {
  await fetch(`https://api.appsheet.com/api/v2/apps/${process.env.APPSHEET_APP_ID}/tables/${table}/Action`, {
    method: "POST",
    headers: { ApplicationAccessKey: process.env.APPSHEET_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ Action: action, Properties: { Locale: "en-US", TimeZone: "Asia/Beirut" }, Rows: rows }),
  });
}

export async function GET(req) {
  if (req.headers.get("authorization") !== `Bearer ${VERIFY}`) return new Response("Unauthorized", { status: 401 });
  try {
    // ✅ القراية من SUPABASE
    const { data: messages } = await supabase.from("Messages").select("*").order("Date", { ascending: false }).limit(5000);
    const { data: users } = await supabase.from("Users").select("*");
    const { data: sessions } = await supabase.from("Bot Sessions").select("*");
    const { data: newArrivals } = await supabase.from("New Arrivals").select("*").eq("Active", "YES");

    const nowBeirut = getBeirutNow();
    const nowHour = nowBeirut.getHours();

    const recentProducts = (newArrivals || []).filter(p => {
      const added = new Date(p["Date Added"]);
      if (isNaN(added)) return false;
      const diffDays = (nowBeirut - added) / (1000 * 60 * 60 * 24);
      return diffDays <= 3;
    });

    // آخر رسالة لكل رقم
    const lastCustomerMsg = {};
    for (const row of (messages || [])) {
      const phone = normalize(row["Phone"] || "");
      if (!phone || lastCustomerMsg[phone]) continue;
      if (String(row["CustomerMessage"] || "").trim()) {
        lastCustomerMsg[phone] = { text: row["CustomerMessage"], date: new Date(row["Date"]) };
      }
    }

    for (const phone in lastCustomerMsg) {
      const last = lastCustomerMsg[phone];
      const diffHours = (nowBeirut - last.date) / (1000 * 60 * 60);
      if (diffHours < 12 || diffHours > 24) continue;
      if ((sessions || []).find(s => normalize(s["Phone"]) === phone && s["Reassurance Sent"] === "YES")) continue;

      const user = (users || []).find(u => normalize(u["WhatsApp Number"]) === phone);
      if (!user) continue;

      const customerGender = String(user["Gender"] || "male").toLowerCase();
      const isFemale = customerGender === "female";
      const name = user["Name"] || "";

      const suitableForUser = recentProducts.filter(p => {
        const target = String(p["Gender Target"] || "both").toLowerCase();
        const isSensitive = String(p["Is Sensitive"] || "").toUpperCase() === "TRUE";
        if (isSensitive && !isFemale) return false;
        if (target === "both") return true;
        return target === customerGender;
      });

      if (suitableForUser.length === 0) continue;

      let allowed = false;
      if (isFemale && nowHour >= 10 && nowHour <= 12) allowed = true;
      if (!isFemale && nowHour >= 9 && nowHour <= 11) allowed = true;
      if (!allowed) continue;

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

      await sendMessage(phone, finalMsg);

      // ✅ الكتابة على APPSHEET
      await appSheetAction("Bot Sessions", "Add", [{
        Phone: phone, "Active Bot": "BOT1", "Assigned Persona": user["Assigned Persona"] || "",
        Status: "ACTIVE", "Reassurance Sent": "YES", "Reassurance Type": "NEW_ARRIVALS",
        "Reassurance At": nowBeirut.toLocaleString("en-US", { timeZone: "Asia/Beirut" }),
        "Last Activity": nowBeirut.toLocaleString("en-US", { timeZone: "Asia/Beirut" })
      }]);
    }
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
