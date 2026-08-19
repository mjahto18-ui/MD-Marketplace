// lib/groq.js

const GROQ_KEYS = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
].filter(Boolean);

export async function callGroqWithFallback(messages, maxTokens = 300) {
  if (GROQ_KEYS.length === 0) {
    throw new Error("ما في ولا مفتاح GROQ_API_KEY بالـ env");
  }

  for (let i = 0; i < GROQ_KEYS.length; i++) {
    const key = GROQ_KEYS[i];
    try {
      console.log(`🔑 عم جرب مفتاح ${i + 1}/${GROQ_KEYS.length}`);

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: messages,
          temperature: 0.4,
          max_tokens: maxTokens
        })
      });

      // اذا ضرب ليمت 429 جرب المفتاح يلي بعدو
      if (res.status === 429) {
        console.log(`⚠️ مفتاح ${i + 1} خلص (429) - بنتقل`);
        continue;
      }

      const data = await res.json();

      if (data.error) {
        console.log(`❌ خطأ مفتاح ${i + 1}:`, data.error.message);
        continue;
      }

      if (data.choices?.[0]?.message?.content) {
        console.log(`✅ نجح مع مفتاح ${i + 1}`);
        return data;
      }

    } catch (e) {
      console.log(`❌ فشل مفتاح ${i + 1}:`, e.message);
      continue;
    }
  }

  // اذا كل المفاتيح خلصو
  throw new Error("كل مفاتيح Groq خلصت اليوم");
}
