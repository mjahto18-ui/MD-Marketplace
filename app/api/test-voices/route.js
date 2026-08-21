export const dynamic = 'force-dynamic';
import { EdgeTTS } from "node-edge-tts";
import fs from "fs";
import os from "os";
import path from "path";

export async function GET() {
  const PERSONAS = {
    melissa: { name: "ميليسا", voice: "ar-LB-LaylaNeural", gender: "بنت لبنانية" },
    sara: { name: "سارة", voice: "ar-LB-LaylaNeural", gender: "بنت لبنانية" },
    leen: { name: "لين", voice: "ar-SA-ZariyahNeural", gender: "بنت سعودية ناعمة" },
    chaza: { name: "شذى", voice: "ar-SA-ZariyahNeural", gender: "بنت سعودية" },
    jad: { name: "جاد", voice: "ar-SA-HamedNeural", gender: "شب سعودي" },
    karim: { name: "كريم", voice: "ar-EG-ShakirNeural", gender: "شب مصري مهضوم" },
    mohamed: { name: "محمد", voice: "ar-SA-HamedNeural", gender: "شب سعودي جاد" },
    mahmoud: { name: "محمود", voice: "ar-EG-ShakirNeural", gender: "شب مصري حماسي" }
  };

  const sampleText = "أهلا حبيبي أنا من أم دي ماركت بليس كيف بقدر ساعدك اليوم";
  const results = [];

  for (const [folder, p] of Object.entries(PERSONAS)) {
    try {
      const tmpFile = path.join(os.tmpdir(), `${folder}-${Date.now()}.mp3`);
      const tts = new EdgeTTS({ voice: p.voice, lang: "ar-LB", rate: "-10%", pitch: "+0Hz" });
      await tts.ttsPromise(sampleText, tmpFile);
      
      const buffer = fs.readFileSync(tmpFile);
      const base64 = buffer.toString('base64');
      fs.unlinkSync(tmpFile);
      
      results.push({ ...p, folder, ok: true, audio: `data:audio/mpeg;base64,${base64}` });
    } catch (e) {
      results.push({ ...p, folder, ok: false, error: e.message });
    }
  }

  const html = `<html dir="rtl"><head><meta charset="utf-8"><title>Voice Test FREE LB</title></head>
  <body style="font-family:sans-serif;padding:20px;background:#111;color:#fff">
  <h1>🎙 تيست مجاني - صوت لبناني ar-LB-LaylaNeural</h1>
  <p>النص: "${sampleText}"</p>
  ${results.map(r => `<div style="border:1px solid #333;padding:15px;margin:15px 0;border-radius:10px;background:#222"><h3>${r.ok?'✅':'❌'} ${r.name} (${r.folder}) - ${r.voice} - ${r.gender}</h3>${r.ok?`<audio controls src="${r.audio}"></audio>`:`<pre style="color:red;white-space:pre-wrap">${r.error}</pre>`}</div>`).join('')}
  </body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
