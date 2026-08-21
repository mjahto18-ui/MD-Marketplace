export const dynamic = 'force-dynamic';

async function edgeTTS(text, voice) {
  const token = "6A5AAE6D4FFA4B2A503544B1CC2E9E11F7E9C0E3A0F8C1E2D3B4A5C6D7E8F9"; // TrustedClientToken ثابت
  const ssml = `<speak version='1.0' xml:lang='ar-LB'><voice name='${voice}'><prosody rate='-10%'>${text}</prosody></voice></speak>`;
  const res = await fetch(`https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${token}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/ssml+xml",
      "User-Agent": "Mozilla/5.0",
      "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3"
    },
    body: ssml
  });
  if (!res.ok) throw new Error(`Edge ${res.status} ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

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
      const buf = await edgeTTS(sampleText, p.voice);
      results.push({ ...p, folder, ok: true, audio: `data:audio/mpeg;base64,${buf.toString('base64')}` });
    } catch (e) {
      results.push({ ...p, folder, ok: false, error: e.message });
    }
  }
  const html = `<html dir="rtl"><head><meta charset="utf-8"></head><body style="background:#111;color:#fff;padding:20px;font-family:sans-serif"><h1>🎙 تيست Edge Direct - لبناني مجاني</h1><p>${sampleText}</p>${results.map(r => `<div style="border:1px solid #333;padding:15px;margin:15px 0;border-radius:10px;background:#222"><h3>${r.ok?'✅':'❌'} ${r.name} - ${r.voice}</h3>${r.ok?`<audio controls src="${r.audio}"></audio>`:`<pre style="color:red">${r.error}</pre>`}</div>`).join('')}</body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
