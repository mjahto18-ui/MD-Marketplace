export const dynamic = "force-dynamic";
import { createClient } from "@supabase/supabase-js";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "mjahto123";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID || "1183824331491327";
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

async function sendImage(to, imageUrl, caption) {
  await fetch(`https://graph.facebook.com/v18.0/${PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "image", image: { link: imageUrl, caption } }),
  });
}
async function sendText(to, text) {
  await fetch(`https://graph.facebook.com/v18.0/${PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } }),
  });
}
function buildAdText(p) {
  const name = p["Product Name"];
  const size = p["Size"] || p["Weight"] || "";
  const price = p["Price"];
  const desc = p["Description"] || "";
  const link = p["Product Link"] || p["Link"] || "";
  return `*${name}*\n\n${size ? `⚖️ الوزن: ${size}\n` : ""}💰 السعر: ${price}\n\n${desc ? `${desc}\n\n` : ""}🛒 للطلب: ${link}`;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("hub.mode") === "subscribe" && searchParams.get("hub.verify_token") === VERIFY_TOKEN) {
    return new Response(searchParams.get("hub.challenge"), { status: 200 });
  }
  return new Response("OK", { status: 200 });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const msg = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!msg) return Response.json({ ok: true });
    const from = normalize(msg.from);
    const text = (msg.text?.body || "").toLowerCase().trim();
    if (!["ايه", "اي", "نعم", "ok", "yes", "ورجيني", "بدي", "شوف", "شوفي"].some(w => text.includes(w))) return Response.json({ ok: true });

    // ✅ القراية من SUPABASE
    const { data: users } = await supabase.from("Users").select("*");
    const { data: newArrivals } = await supabase.from("New Arrivals").select("*").eq("Active", "YES");

    const user = (users || []).find(u => normalize(u["WhatsApp Number"]) === from);
    if (!user) return Response.json({ ok: true });

    const customerGender = String(user["Gender"] || "male").toLowerCase();
    const isFemale = customerGender === "female";
    const name = user["Name"] || "";
    const nowBeirut = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Beirut" }));

    const recentProducts = (newArrivals || []).filter(p => {
      const added = new Date(p["Date Added"]);
      if (isNaN(added)) return false;
      const diffDays = (nowBeirut - added) / (1000 * 60 * 60 * 24);
      return diffDays <= 3;
    });

    let suitable = recentProducts.filter(p => {
      const target = String(p["Gender Target"] || "both").toLowerCase();
      const isSensitive = String(p["Is Sensitive"] || "").toUpperCase() === "TRUE";
      if (isSensitive && !isFemale) return false;
      if (target === "both") return true;
      return target === customerGender;
    }).slice(0, 2);

    if (suitable.length === 0) {
      await sendText(from, isFemale ? `ولا يهمك ${name} 🌸 هلأ ما في شي جديد بيناسبك، بس أول ما يوصل شي رح خبرك دغري!` : `ولا يهمك ${name}، هلأ ما في شي جديد بيناسبك، بس أول ما يوصل شي بخبرك دغري`);
      return Response.json({ ok: true });
    }

    for (let i = 0; i < suitable.length; i++) {
      const p = suitable[i];
      let intro = "";
      if (i === 0) {
        if (isFemale) {
          const intros = [`ليكي ${name} 😍 هيدا وصل جديد و دغري تذكرتك`, `تفرجي ${name} 🌸 هيدا الجديد`, `شوفي ${name} هيدا يلي قصدي عليه، بجنن!`];
          intro = intros[Math.floor(Math.random()*intros.length)] + "\n\n";
        } else {
          const intros = [`شوف ${name} هيدا وصل جديد و دغري تذكرتك`, `تفرج ${name} هيدا الجديد`, `هيدا يلي قصدي عليه ${name}، مرتب كتير`];
          intro = intros[Math.floor(Math.random()*intros.length)] + "\n\n";
        }
      }
      await sendImage(from, p["Image URL"], intro + buildAdText(p));
      await new Promise(r => setTimeout(r, 2500));
    }

    await sendText(from, isFemale ? `شو رأيك ${name}؟ أي شي عجبك قوليلي بثبتلك ياه دغري 🌸` : `شو رأيك ${name}؟ أي شي عجبك قللي بثبتلك ياه دغري`);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
