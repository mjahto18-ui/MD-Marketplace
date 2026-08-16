import { google } from "googleapis";
export const dynamic = "force-dynamic";

// ===== تعريف الويبهوك تبع ميتا =====
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "mjahto123";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID || "1183824331491327";

// ===== تعريف المتغيرات =====
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

// ===== تعريف الجدولين =====
const SHEET_IDS = [
  '16Sx7YjtCMyVtvHTBLDowKeiUrLPDc9-PdD9hGgOLL6o',
  '1JdCGyVh6HZCBHlWgAVKuVsWwwoCgGf4__UUXP1YlPO4'
];

let CACHE = null;
let CODE_INDEX = new Map();
let CACHE_TIME = 0;

function getSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: GOOGLE_CLIENT_EMAIL, private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n") },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
  });
  return google.sheets({ version: "v4", auth });
}

async function loadAll() {
  if (CACHE && Date.now() - CACHE_TIME < 24*3600*1000) return CACHE;
  const sheets = getSheets();
  let all = [];
  for (const id of SHEET_IDS) {
    try {
      const meta = await sheets.spreadsheets.get({ spreadsheetId: id });
      for (const s of meta.data.sheets) {
        const title = s.properties.title;
        try {
          const res = await sheets.spreadsheets.values.get({ spreadsheetId: id, range: `${title}!A2:F` });
          for (const r of (res.data.values || [])) {
            if (!r[0]) continue;
            all.push({
              code: String(r[0]).trim(),
              name: r[1] || '', nameLower: String(r[1] || '').toLowerCase(),
              brand: r[2] || '', brandLower: String(r[2] || '').toLowerCase(),
              quantity: r[3] || '', countries: r[4] || '', image: r[5] || ''
            });
          }
        } catch(e){}
      }
    } catch(e){ console.error('Sheet error', e.message) }
  }
  CACHE = all; CODE_INDEX.clear(); for(const p of all) CODE_INDEX.set(p.code,p); CACHE_TIME=Date.now();
  console.log(`✅ Marketplace Loaded ${all.length}`);
  return all;
}

function normalizeWhatsAppNumber(phone) {
  let clean = String(phone || "").replace(/\D/g, "");
  if (clean.startsWith("05")) clean = "966" + clean.substring(1);
  else if (clean.length === 9 && clean.startsWith("5")) clean = "966" + clean;
  else if (clean.startsWith("03")) clean = "9613" + clean.substring(2);
  else if (clean.length === 7 && clean.startsWith("3")) clean = "961" + clean;
  return clean;
}

async function sendMessage(to, text) {
  if (!WHATSAPP_TOKEN) { console.log("❌ NO WHATSAPP_TOKEN"); return false; }
  const cleanPhone = normalizeWhatsAppNumber(to);
  if (!cleanPhone) return false;
  try {
    const res = await fetch(`https://graph.facebook.com/v26.0/${PHONE_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: cleanPhone, type: "text", text: { body: String(text) } })
    });
    const data = await res.json();
    console.log("📤 WhatsApp Marketplace:", JSON.stringify(data));
    return res.ok;
  } catch(e){ console.error("❌ Send Error", e); return false; }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('warmup') === 'true') {
    const data = await loadAll();
    return Response.json({ warmed: true, count: data.length, route: "marketplace + whatsapp webhook" });
  }
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook Verified - Marketplace");
    return new Response(challenge, { status: 200 });
  }
  return Response.json({ status: "Marketplace + WhatsApp Webhook ready", count: CACHE?.length || 0 });
}

export async function POST(req) {
  try {
    const body = await req.json();

    // ===== 1. اذا جاي من واتساب (ميتا) =====
    const waMessage = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (waMessage) {
      const from = waMessage.from;
      const userText = waMessage.text?.body || "";
      if (!from ||!userText) return Response.json({ status: "ok" }, { status: 200 });
      console.log(`📩 WhatsApp -> Marketplace: ${from} | ${userText}`);
      const products = await loadAll();
      const q = userText.toLowerCase().trim();
      let found = [];
      if (CODE_INDEX.has(userText.trim())) found = [CODE_INDEX.get(userText.trim())];
      else {
        for (let i = 0; i < products.length; i++) {
          const p = products[i];
          if (p.nameLower.includes(q) || p.brandLower.includes(q)) { found.push(p); if(found.length>=1) break; }
        }
      }
      let reply;
      if (!found.length) reply = `❌ "${userText}" مش موجود ضمن 2.15M`;
      else {
        const p = found[0];
        reply = `🧪 Marketplace Test\n\n📦 ${p.name}\n🏷 ${p.brand}\n🔢 ${p.code}\n⚖ ${p.quantity}\n🌍 ${p.countries}\n\n✅ شغال! منفصل عن BOT1`;
      }
      await sendMessage(from, reply);
      return Response.json({ status: "ok", source: "whatsapp" }, { status: 200 });
    }

    // ===== 2. اذا جاي من AppSheet =====
    const query = String(body.query || body.text || body.BARCODE || body.Barcode || body.barcode || '').trim();
    const phoneFromAppSheet = body.Mobile || body.mobile || body.Phone || body.phone || body.to || body.From;

    if (!query) return Response.json({ reply: "ابعت query" }, { status: 200 });

    const products = await loadAll();
    const q = query.toLowerCase();
    let found = [];
    if (CODE_INDEX.has(query)) found = [CODE_INDEX.get(query)];
    else {
      for (let i = 0; i < products.length; i++) {
        const p = products[i];
        if (p.nameLower.includes(q) || p.brandLower.includes(q)) { found.push(p); if(found.length>=3) break; }
      }
    }

    if (!found.length) {
      const notFound = `❌ "${query}" مش موجود ضمن 2.15M`;
      if (phoneFromAppSheet) {
        console.log(`📤 AppSheet -> WhatsApp (Not Found): ${phoneFromAppSheet}`);
        await sendMessage(phoneFromAppSheet, notFound);
      }
      return Response.json({ reply: notFound, sent_to_whatsapp: phoneFromAppSheet || null });
    }

    const p = found[0];
    let reply = `📦 ${p.name}\n🏷 ${p.brand}\n🔢 ${p.code}\n⚖ ${p.quantity}\n🌍 ${p.countries}`;

    // اذا في رقم موبايل من AppSheet -> ابعت واتساب
    if (phoneFromAppSheet) {
      console.log(`📤 AppSheet -> WhatsApp: ${phoneFromAppSheet} | ${query} -> ${p.name}`);
      await sendMessage(phoneFromAppSheet, reply);
      return Response.json({ reply, sent_to_whatsapp: phoneFromAppSheet, image: p.image, product: p, count: products.length });
    }

    // اذا ما في رقم - رجع JSON عادي
    return Response.json({ reply, image: p.image, product: p, count: products.length });

  } catch(e) {
    console.error("Marketplace Error", e);
    return Response.json({ status: "ok", error: e.message }, { status: 200 });
  }
}
