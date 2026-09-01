import { createClient } from '@supabase/supabase-js'
export const dynamic = "force-dynamic";

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

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
  return new Date();
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

export async function POST(req) {
  const supabase = getSupabase();
  const body = await req.json();
  console.log(`📥 WEBHOOK HIT: ${JSON.stringify(body).slice(0,800)}`);
  const entry = body.entry?.[0]?.changes?.[0]?.value;
  const msg = entry?.messages?.[0];
  if (!msg) return Response.json({ ok: true });

  const from = normalize(msg.from);
  const rawText = msg.text?.body?.trim() || "";
  const text = rawText.toLowerCase();

  const yesWords = ["ايه", "اي", "نعم", "اوكي", "يلا", "تمام", "شوف", "خليني شوف"];
  const firstWord = text.split(" ")[0];
  const isYes = yesWords.includes(firstWord) || yesWords.includes(text);
  console.log("📩 from:", from, "text:", text, "isYes:", isYes);
  if (!isYes) return Response.json({ ok: true });

  const { data: allMessages } = await supabase
    .from('messages')
    .select('*')
    .eq('Phone', from)
    .order('Date', { ascending: true });

  const userMessages = allMessages || [];
  if (userMessages.length === 0) {
    console.log(`❌ No messages for ${from}`);
    return Response.json({ ok: true });
  }
  const lastRow = userMessages[userMessages.length - 1];
  console.log(`🔍 Last row for ${from}:`, JSON.stringify(lastRow));

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

  if (diffMin < 0 || diffMin > 30) {
    console.log(`⏭ SKIP ${from} diffMin ${diffMin} > 30`);
    return Response.json({ ok: true });
  }

  console.log(`✅ بوابة العروض مفتوحة لـ ${from}`);

  const { data: users } = await supabase
    .from('users')
    .select('*');
  
  const user = users?.find(u => normalize(u["WhatsApp Number"]) === from);
  if (!user) {
    console.log(`❌ SKIP ${from} مش موجود بجدول Users!`);
    return Response.json({ ok: true });
  }
  const gender = String(user["Gender"] || "male").toLowerCase();

  const { data: arrivals } = await supabase
    .from('new_arrivals')
    .select('*');

  const suitable = (arrivals || []).filter(p => {
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
        const shortText = `${p["Product Name"]}\nالسعر: ${p["Price"]}\nالحجم: ${p["Size"]}\n\nللطلب 👇\n${p["Product Link"]}`;
        if (p["Image URL"]) {
          await sendImage(from, p["Image URL"], shortText);
        } else {
          await sendMessage(from, shortText);
        }
      } else {
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

    const beirutStr = new Date().toISOString();
  await supabase.from('messages').insert([{
    Phone: from,
    CustomerMessage: rawText,
    AIReply: "PRODUCTS_SENT_VIA_BRIDGE",
    Date: beirutStr,
    "Reassurance_Sent": "YES",
    "Reassurance_At": beirutStr,
    "Bot Session": "BOT_OFFER",
    Bot: "New Offre",
    "Message Type": "NEW_ARRIVALS",
  }]);

  return Response.json({ ok: true });
}
