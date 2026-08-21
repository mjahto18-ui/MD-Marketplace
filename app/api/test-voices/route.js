import { PERSONAS_VOICES, PERSONAS_FALLBACK } from "@/lib/personas";

const VOICE_KEY = process.env.GROQ_API_KEY;

export async function GET() {
  const sampleText = "أهلا حبيبي! أنا من MD-Marketplace، كيف بقدر ساعدك اليوم؟";

  const results = [];

  for (const [folder, voice] of Object.entries(PERSONAS_VOICES)) {
    const persona = PERSONAS_FALLBACK[folder];
    try {
      console.log(`🎙 عم جرب ${persona.Name} - ${voice}`);

      const res = await fetch("https://api.groq.com/openai/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${VOICE_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "playai-tts",
          input: sampleText,
          voice: voice,
          response_format: "mp3"
        })
      });

      if (!res.ok) {
        const err = await res.text();
        results.push({ persona: persona.Name, folder, voice, ok: false, error: err });
      } else {
        const buffer = await res.arrayBuffer();
        // نرفعها مؤقتا على vercel blob او نرجعها base64
        const base64 = Buffer.from(buffer).toString('base64');
        results.push({
          persona: persona.Name,
          folder,
          voice,
          ok: true,
          audio: `data:audio/mpeg;base64,${base64}`,
          gender: persona.Gender
        });
      }
    } catch (e) {
      results.push({ persona: persona.Name, folder, voice, ok: false, error: e.message });
    }
  }

  // نرجع HTML فيه كل الاصوات
  const html = `
  <html dir="rtl"><head><meta charset="utf-8"><title>Voice Test</title></head>
  <body style="font-family:sans-serif;padding:20px;background:#111;color:#fff">
  <h1>🎙 تيست 8 شخصيات - MD-Marketplace</h1>
  <p>النص: "${sampleText}"</p>
  ${results.map(r => `
    <div style="border:1px solid #333;padding:15px;margin:15px 0;border-radius:10px;background:#222">
      <h3>${r.ok? '✅' : '❌'} ${r.persona} (${r.folder}) - ${r.voice} - ${r.gender}</h3>
      ${r.ok? `<audio controls src="${r.audio}"></audio>` : `<pre style="color:red">${r.error}</pre>`}
    </div>
  `).join('')}
  </body></html>
  `;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
