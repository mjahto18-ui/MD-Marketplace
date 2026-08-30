import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const CRON_SECRET = process.env.CRON_SECRET || "MDM_SECRET_123";

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
function getBeirutNow() { return new Date(); }
function getBeirutHour(d = new Date()) {
  return parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Beirut', hour: '2-digit', hour12: false }).format(d));
}
function formatForAppSheet(d = new Date()) {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Beirut', year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).formatToParts(d).reduce((a,x)=>{a[x.type]=x.value;return a;},{});
  return `${parseInt(p.month)}/${parseInt(p.day)}/${p.year} ${p.hour}:${p.minute}:${p.second}`;
}
async function sendMessage(to, text) {
  const clean = normalize(to); if (!clean) return false;
  const res = await fetch(`https://graph.facebook.com/v26.0/${PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: clean, type: "text", text: { body: String(text||"") } })
  });
  const txt = await res.text(); console.log(`SEND to ${clean}: ${res.status} - ${txt}`); return res.ok;
}
async function sendImage(to, imageUrl, caption) {
  const clean = normalize(to); if (!clean) return false;
  const res = await fetch(`https://graph.facebook.com/v26.0/${PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: clean, type: "image", image: { link: imageUrl, caption: String(caption||"") } })
  });
  const txt = await res.text(); console.log(`SEND IMAGE to ${clean}: ${res.status} - ${txt}`); return res.ok;
}

export async function GET(req) {
  const url = new URL(req.url);
  const secretParam = url.searchParams.get("secret");
  const authHeader = req.headers.get("authorization");
  if (authHeader!== `Bearer ${CRON_SECRET}` && secretParam!== CRON_SECRET) return new Response("Unauthorized", { status: 401 });
  try {
    const { data: messages } = await supabase.from('messages').select('*').order('Date', { ascending: false }).limit(5000);
    const { data: users } = await supabase.from('users').select('*');
    const { data: newArrivals } = await supabase.from('new_arrivals').select('*').order('supa_id', { ascending: false });
    const msgs = messages || []; const usrs = users || []; const arrv = newArrivals || [];
    console.log("Messages:", msgs.length, "Users:", usrs.length, "NewArrivals:", arrv.length);
    const nowBeirut = getBeirutNow(); const nowHour = getBeirutHour(nowBeirut);
    const lastMsg = {};
    for (let i = msgs.length - 1; i >= 0; i--) {
      const row = msgs[i]; const phone = normalize(row["Phone"]); if (!phone) continue; if (lastMsg[phone]) continue;
      const cust = String(row["CustomerMessage"] || "").trim(); if (!cust) continue;
      lastMsg[phone] = { phone, text: cust, date: new Date(row["Date"]), row };
    }
    console.log(`lastMsg unique=${Object.keys(lastMsg).length}`); console.log(`lastMsg phones:`, Object.keys(lastMsg));
    let processed = 0;
    for (const phone in lastMsg) {
      const last = lastMsg[phone];
      const diffHours = (nowBeirut - last.date) / (1000 * 60 * 60);
      if (diffHours < 12 || diffHours > 24) continue;
      console.log(`--- ${phone} Reassurance_Sent=[${last.row["Reassurance_Sent"]}] Date=${last.row["Date"]} diffHours=${diffHours.toFixed(2)} ---`);
      if (String(last.row["Reassurance_Sent"] || "") === "YES") { console.log(`⏭ SKIP ${phone} already YES`); continue; }
      const user = usrs.find(u => normalize(u["WhatsApp Number"]) === phone);
      if (!user) { console.log(`❌ SKIP ${phone} مش موجود بجدول Users!`); continue; }
      console.log(`✅ USER FOUND ${phone} -> Name=${user["Name"]} Gender=${user["Gender"]}`);
      const name = user["Name"]; const gender = String(user["Gender"] || "male").toLowerCase(); const isFemale = gender === "female";
      let allowed = false; if (isFemale) { if (nowHour >= 10 && nowHour <= 12) allowed = true; } else { if (nowHour >= 9 && nowHour <= 11) allowed = true; }
      if (!allowed) { console.log(`⏭ SKIP ${phone} not allowed hour=${nowHour}`); continue; }
      const lower = last.text.toLowerCase(); let type = "general";
      if (lower.includes("طلب") || lower.includes("اطلب") || lower.includes("اوردر")) type = "order";
      else if (lower.includes("وين") || lower.includes("موجود") || lower.includes("بدي")) type = "product";
      console.log(`type=${type} text=${last.text.slice(0,50)}`);
      const suitableProducts = arrv.filter(p => {
        const added = new Date(p["Date Added"]); const diffDays = (nowBeirut - added) / (1000 * 60 * 60 * 24); if (diffDays > 3) return false;
        const target = String(p["Gender Target"] || "both").toLowerCase(); return target === "both" || target === gender;
      });
      console.log(`hasNew=${suitableProducts.length > 0} suitableCount=${suitableProducts.length} for ${phone}`);
      let finalMsg = ""; if (isFemale) {
        const pool = [`صباحو ${name} 🌸 نزل عنا شي جديد ع ذوقك، قلت خبرك قبل الكل 😍 ببعتلك؟`,`هاي ${name} كيفك؟ لقيت شغلة اتذكرتك دغري، سعرها لقطة اليوم 🫶 بتحبي تشوفي صورتها؟`,`يسعد صباحك ${name} ✨ في كم منتج جديد وصل، فكرت فيكي أول وحدة، بدك ابعتلك ياهن؟`,`صباح الخير ${name} 🌸 عنا شي جديد مرتب، وقلت انتي لازم تشوفيه قبل ما يخلص`];
        finalMsg = pool[Math.floor(Math.random() * pool.length)];
      } else {
        const pool = [`صباحو ${name} 👋 نزل شي جديد مرتب، قلت انت أول واحد لازم تعرف، ابعتلك؟`,`هاي ${name}، كيف الوضع؟ في شغلة حلوة نزلت وسعرها لقطة اليوم، بتحب تشوفها؟`,`يسعد صباحك ${name} 👌 وصلنا جديد وقلت خبرك دغري قبل ما يخلص`,`صباح الخير ${name}، عنا كم شغلة جديدة نزلوا، فكرت فيك، ببعتلك الصور؟`];
        finalMsg = pool[Math.floor(Math.random() * pool.length)];
      }
      console.log(`💬 FINAL MSG to ${phone}: ${finalMsg}`); console.log(`📤 SEND TRY to ${phone}`);
      await sendMessage(phone, finalMsg);
      await supabase.from('messages').update({ "Reassurance_Sent": "YES", "Reassurance_At": formatForAppSheet(nowBeirut) }).eq('Message ID', last.row["Message ID"]);
      processed++;
    }
    return new Response(JSON.stringify({ ok: true, processed }), { status: 200 });
  } catch (e) {
    console.error("Keepalive error:", e); return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 });
  }
}
