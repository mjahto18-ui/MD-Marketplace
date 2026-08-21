export const dynamic = 'force-dynamic';
import { EdgeTTS } from "@andresaya/edge-tts";

export async function GET() {
  const PERSONAS = {
    melissa: { name: "ميليسا", voice: "ar-LB-LaylaNeural" },
    sara: { name: "سارة", voice: "ar-LB-LaylaNeural" },
    leen: { name: "لين", voice: "ar-SA-ZariyahNeural" },
    chaza: { name: "شذى", voice: "ar-SA-ZariyahNeural" },
    jad: { name: "جاد", voice: "ar-SA-HamedNeural" },
    karim: { name: "كريم", voice: "ar-EG-ShakirNeural" },
    mohamed: { name: "محمد", voice: "ar-SA-HamedNeural" },
    mahmoud: { name: "محمود", voice: "ar-EG-ShakirNeural" }
  };

  const sampleText = "أهلا حبيبي أنا من أم دي ماركت بليس كيف بقدر ساعدك اليوم";
  const results = [];

  for (const [folder, p] of Object.entries(PERSONAS)) {
    try {
      const tts = new EdgeTTS();
      const readable = await tts.synthesize(sampleText, { voice: p.voice, rate: "-10%" });
      const chunks = [];
      for await (const chunk of readable) chunks.push(chunk);
      const buffer = Buffer.concat(chunks);
      const base64 = buffer.toString('base64');
      results.push({ ...p, folder, ok: true, audio: `data:audio/mpeg;base64,${base64}` });
    } catch (e) {
      results.push({ ...p, folder, ok: false, error: e.message + " " + e.stack?.slice(0,300) });
    }
  }

  const html = `<html dir="rtl"><head><meta charset="utf-8"></head><body style="background:#111;color:#fff;padding:20px;font-family:sans-serif"><h1>🎙 تيست Vercel - صوت لبناني</h1><p>${sampleText}</p>${results.map(r => `<div style="border:1px solid #333;padding:15px;margin:15px 0;border-radius:10px;background:#222"><h3>${r.ok?'✅':'❌'} ${r.name} (${r.folder}) - ${r.voice}</h3>${r.ok?`<audio controls src="${r.audio}"></audio>`:`<pre style="color:red;white-space:pre-wrap">${r.error}</pre>`}</div>`).join('')}</body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
