process.removeAllListeners('warning'); // حل مشكلة DEP0169
import { google } from "googleapis";
export const dynamic = "force-dynamic";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "mjahto123";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID || "1183824331491327";
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

const SHEET_IDS = [
  '16Sx7YjtCMyVtvHTBLDowKeiUrLPDc9-PdD9hGgOLL6o',
  '1JdCGyVh6HZCBHlWgAVKuVsWwwoCgGf4__UUXP1YlPO4'
];

let CACHE = null;
let CODE_INDEX = new Map();
let CACHE_TIME = 0;
let LOADING_PROMISE = null;
let LAST_PRODUCT = new Map();

function getSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: GOOGLE_CLIENT_EMAIL, private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n") },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
  });
  return google.sheets({ version: "v4", auth });
}

async function loadAll() {
  if (CACHE && Date.now() - CACHE_TIME < 24*3600*1000) return CACHE;
  if (LOADING_PROMISE) return await LOADING_PROMISE;
  LOADING_PROMISE = (async () => {
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
      } catch(e){}
    }
    CACHE = all; CODE_INDEX.clear(); for(const p of all) CODE_INDEX.set(p.code,p); CACHE_TIME=Date.now();
    console.log(`✅ Loaded ${all.length}`);
    return all;
  })();
  const result = await LOADING_PROMISE;
  LOADING_PROMISE = null;
  return result;
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
  if (!WHATSAPP_TOKEN) return false;
  const cleanPhone = normalizeWhatsAppNumber(to);
  try {
    const res = await fetch(`https://graph.facebook.com/v26.0/${PHONE_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: cleanPhone, type: "text", text: { body: String(text).substring(0,4000) } })
    });
    return res.ok;
  } catch(e){ return false; }
}

async function sendImageMessage(to, imageUrl, caption) {
  if (!WHATSAPP_TOKEN ||!imageUrl) return await sendMessage(to, caption);
  const cleanPhone = normalizeWhatsAppNumber(to);
  try {
    const res = await fetch(`https://graph.facebook.com/v26.0/${PHONE_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "image",
        image: { link: imageUrl, caption: String(caption).substring(0, 1000) }
      })
    });
    if (res.ok) return true;
    return await sendMessage(to, caption);
  } catch(e){ return await sendMessage(to, caption); }
}

async function getCaloriesFromGoogle(barcode) {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await res.json();
    if (data.status === 1 && data.product?.nutriments) {
      const n = data.product.nutriments;
      let reply = `🔥 *السعرات لـ ${data.product.product_name || barcode}:*\n\n`;
      if (n['energy-kcal_100g']) reply += `⚡ ${n['energy-kcal_100g']} سعرة / 100غ\n`;
      if (n['energy-kcal_serving']) reply += `🍽 ${n['energy-kcal_serving']} سعرة / حصة\n`;
      if (n.fat_100g) reply += `🧈 دهون: ${n.fat_100g}غ\n`;
      if (n.sugars_100g) reply += `🍬 سكر: ${n.sugars_100g}غ\n`;
      if (n.proteins_100g) reply += `💪 بروتين: ${n.proteins_100g}غ\n`;
      if (n.carbohydrates_100g) reply += `🍞 كارب: ${n.carbohydrates_100g}غ\n`;
      return reply + `\n📚 المصدر: OpenFoodFacts`;
    }
    return `❌ ما لقيت سعرات للباركود ${barcode}`;
  } catch(e) {
    return `❌ خطأ بجلب السعرات: ${e.message}`;
  }
}

function buildReply(p) {
  return `📦 *${p.name}*\n\n🏷 ${p.brand}\n🔢 ${p.code}\n⚖ ${p.quantity}\n🌍 ${p.countries}`;
}

function isCaloriesWord(text) {
  const t = String(text||'').toLowerCase().trim();
  return ["ايه","إيه","اي","نعم","yes","y","سعرات","بدي السعرات","ايه نعم"].some(w => t.includes(w)) || t.length <= 3;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('warmup') === 'true') {
    const data = await loadAll();
    return Response.json({ warmed: true, count: data.length });
  }
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === VERIFY_TOKEN) return new Response(challenge, { status: 200 });
  return Response.json({ status: "ready", count: CACHE?.length || 0 });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const waMessage = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (waMessage) {
      const from = waMessage.from;
      const userText = (waMessage.text?.body || "").trim();
      if (!from ||!userText) return Response.json({ status: "ok" }, { status: 200 });

      // ✅ فحص السعرات قبل كل شي - مع normalize
      if (isCaloriesWord(userText)) {
        const cleanFrom = normalizeWhatsAppNumber(from);
        const last = LAST_PRODUCT.get(cleanFrom) || LAST_PRODUCT.get(from);
        if (!last) {
          await sendMessage(from, "❌ ابعت باركود أول شي");
          return Response.json({ status: "ok" }, { status: 200 });
        }
        await sendMessage(from, `⏳ عم جيب السعرات لـ ${last.code}...`);
        const cal = await getCaloriesFromGoogle(last.code);
        await sendMessage(from, cal);
        return Response.json({ status: "ok" }, { status: 200 });
      }

      const products = await loadAll();
      let found = [];
      if (CODE_INDEX.has(userText)) found = [CODE_INDEX.get(userText)];
      else {
        const q = userText.toLowerCase();
        for (let i = 0; i < products.length; i++) {
          const p = products[i];
          if (p.nameLower.includes(q) || p.brandLower.includes(q)) { found.push(p); if(found.length>=1) break; }
        }
      }

      if (!found.length) {
        await sendMessage(from, `❌ "${userText}" مش موجود`);
      } else {
        const p = found[0];
        LAST_PRODUCT.set(normalizeWhatsAppNumber(from), p); // ✅ نفس normalize
        LAST_PRODUCT.set(from, p); // احتياط
        let reply = buildReply(p) + `\n\n❓ *بدك السعرات؟* اكتب: ايه`;
        if (p.image && p.image.startsWith('http')) await sendImageMessage(from, p.image, reply);
        else await sendMessage(from, reply);
      }
      return Response.json({ status: "ok" }, { status: 200 });
    }

    // AppSheet
    const query = String(body.query || body.text || body.BARCODE || body.Barcode || body.barcode || '').trim();
    const phoneFromAppSheet = body.Mobile || body.mobile || body.Phone || body.phone || body.to || body.From;
    if (!query) return Response.json({ reply: "ابعت query" });

    // ✅ فحص السعرات من AppSheet - هون كانت المشكلة!
    if (isCaloriesWord(query)) {
      const cleanPhone = normalizeWhatsAppNumber(phoneFromAppSheet);
      const last = LAST_PRODUCT.get(cleanPhone) || LAST_PRODUCT.get(phoneFromAppSheet) || [...LAST_PRODUCT.values()].pop();
      if (!last) {
        const msg = `❌ ما في منتج محفوظ - ابعت باركود أول`;
        if (phoneFromAppSheet) await sendMessage(phoneFromAppSheet, msg);
        return Response.json({ reply: msg });
      }
      const cal = await getCaloriesFromGoogle(last.code);
      if (phoneFromAppSheet) await sendMessage(phoneFromAppSheet, cal);
      return Response.json({ reply: cal });
    }

    const products = await loadAll();
    let found = [];
    if (CODE_INDEX.has(query)) found = [CODE_INDEX.get(query)];
    else {
      const lowerQ = query.toLowerCase();
      for (let i = 0; i < products.length; i++) {
        const p = products[i];
        if (p.nameLower.includes(lowerQ) || p.brandLower.includes(lowerQ)) { found.push(p); if(found.length>=3) break; }
      }
    }

    if (!found.length) {
      const notFound = `❌ "${query}" مش موجود`;
      if (phoneFromAppSheet) await sendMessage(phoneFromAppSheet, notFound);
      return Response.json({ reply: notFound });
    }

    const p = found[0];
    if (phoneFromAppSheet) {
      LAST_PRODUCT.set(normalizeWhatsAppNumber(phoneFromAppSheet), p);
      LAST_PRODUCT.set(phoneFromAppSheet, p);
    }
    const reply = buildReply(p) + `\n\n❓ بدك السعرات؟ اكتب: ايه`;

    if (phoneFromAppSheet) {
      if (p.image && p.image.startsWith('http')) await sendImageMessage(phoneFromAppSheet, p.image, reply);
      else await sendMessage(phoneFromAppSheet, reply);
    }

    return Response.json({ reply, image: p.image, product: p });

  } catch(e) {
    console.error("Error", e);
    return Response.json({ status: "ok", error: e.message }, { status: 200 });
  }
}
