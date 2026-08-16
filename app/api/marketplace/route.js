import { google } from "googleapis";
export const dynamic = "force-dynamic";

const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

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
          const res = await sheets.spreadsheets.values.get({
            spreadsheetId: id,
            range: `${title}!A2:F`
          });
          for (const r of (res.data.values || [])) {
            if (!r[0]) continue;
            all.push({
              code: String(r[0]).trim(),
              name: r[1] || '',
              nameLower: String(r[1] || '').toLowerCase(),
              brand: r[2] || '',
              brandLower: String(r[2] || '').toLowerCase(),
              quantity: r[3] || '',
              countries: r[4] || '',
              image: r[5] || ''
            });
          }
        } catch(e){}
      }
    } catch(e){ console.error('Sheet error', e.message) }
  }

  CACHE = all;
  CODE_INDEX.clear();
  for (const p of all) CODE_INDEX.set(p.code, p);
  CACHE_TIME = Date.now();

  console.log(`✅ Loaded ${all.length}`);
  return all;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('warmup') === 'true') {
    const data = await loadAll();
    return Response.json({ warmed: true, count: data.length });
  }
  return Response.json({ status: "Marketplace ready - POST query" });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const query = String(body.query || body.text || '').trim();
    const needCalories = body.needCalories || false;

    if (!query) return Response.json({ reply: "ابعت query" });

    const products = await loadAll();
    const q = query.toLowerCase();

    let found = [];

    // باركود = 0.001 ثانية
    if (CODE_INDEX.has(query)) {
      found = [CODE_INDEX.get(query)];
    } else {
      // اسم = بيوقف بعد 3 - 0.3 ثانية
      for (let i = 0; i < products.length; i++) {
        const p = products[i];
        if (p.nameLower.includes(q) || p.brandLower.includes(q)) {
          found.push(p);
          if (found.length >= 3) break;
        }
      }
    }

    if (!found.length) {
      return Response.json({
        reply: "المنتج مش موجود ضمن البيانات عندنا، ممكن يكون جديد أو ممنوع من العرض"
      });
    }

    const p = found[0];
    let reply = `📦 ${p.name}\n🏷️ ${p.brand}\n🔢 ${p.code}\n⚖️ ${p.quantity}\n🌍 ${p.countries}`;

    if (needCalories || q.includes('سعرات') || q.includes('كالوري')) {
      try {
        const r = await fetch(`https://world.openfoodfacts.org/api/v0/product/${p.code}.json`);
        const d = await r.json();
        const kcal = d.product?.nutriments?.['energy-kcal_100g'];
        const proteins = d.product?.nutriments?.['proteins_100g'];
        const carbs = d.product?.nutriments?.['carbohydrates_100g'];
        const fat = d.product?.nutriments?.['fat_100g'];
        if (kcal) {
          reply += `\n\n🔥 السعرات:\n${kcal} سعرة / 100g`;
          if (proteins) reply += `\n💪 بروتين: ${proteins}g`;
          if (carbs) reply += `\n🍞 كارب: ${carbs}g`;
          if (fat) reply += `\n🧈 دهون: ${fat}g`;
        }
      } catch(e){}
    } else {
      reply += `\n\nبدك السعرات؟ اكتب سعرات`;
    }

    return Response.json({ reply, image: p.image, product: p, count: products.length });

  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
