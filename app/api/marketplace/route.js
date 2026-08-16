import { google } from "googleapis";
export const dynamic = "force-dynamic";

const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

const SHEET_IDS = [
  '16Sx7YjtCMyVtvHTBLDowKeiUrLPDc9-PdD9hGgOLL6o',
  '1JdCGyVh6HZCBHlWgAVKuVsWwwoCgGf4__UUXP1YlPO4'
];

let CACHE = null;
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
    const meta = await sheets.spreadsheets.get({ spreadsheetId: id });
    for (const s of meta.data.sheets) {
      const title = s.properties.title;
      try {
        const res = await sheets.spreadsheets.values.get({ spreadsheetId: id, range: `${title}!A2:F` });
        for (const r of (res.data.values || [])) if (r[0]) all.push({ code: r[0], name: r[1]||'', brand: r[2]||'', quantity: r[3]||'', countries: r[4]||'', image: r[5]||'' });
      } catch(e){}
    }
  }
  CACHE = all; CACHE_TIME = Date.now();
  return all;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('warmup') === 'true') {
    const data = await loadAll();
    return Response.json({ warmed: true, count: data.length });
  }
  return Response.json({ status: "Marketplace API ready - POST query" });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const query = (body.query || body.text || '').toString().trim();
    const needCalories = body.needCalories || body.text?.toLowerCase().includes('سعرات');

    if (!query) return Response.json({ reply: "ابعت query" });

    const products = await loadAll();
    const q = query.toLowerCase();

    let found = products.filter(p => p.code === query);
    if (!found.length) {
      found = products.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)).slice(0,3);
    }

    if (!found.length) {
      return Response.json({ reply: "المنتج مش موجود ضمن البيانات عندنا، ممكن يكون جديد أو ممنوع من العرض" });
    }

    const p = found[0];
    let reply = `📦 ${p.name}\n🏷️ ${p.brand}\n🔢 ${p.code}\n⚖️ ${p.quantity}\n🌍 ${p.countries}`;

    if (needCalories) {
      try {
        const r = await fetch(`https://world.openfoodfacts.org/api/v0/product/${p.code}.json`);
        const d = await r.json();
        const kcal = d.product?.nutriments?.['energy-kcal_100g'];
        if (kcal) reply += `\n🔥 السعرات: ${kcal} سعرة / 100g`;
      } catch(e){}
    } else {
      reply += `\n\nبدك السعرات؟`;
    }

    return Response.json({ reply, image: p.image, product: p, count: products.length });
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
