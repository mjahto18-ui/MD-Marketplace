// حط هاد الملف بمشروعك: app/api/load-test/route.js
// او pages/api/load-test.js اذا مشروعك قديم

export async function GET() {
  const BASE_URL = 'https://www.md-marketplace.store';
  const startTime = Date.now();
  
  // عدد العملاء اللي بدك تفحصهم
  const CLIENTS = 50;

  const tests = [
    { name: 'الصفحة الرئيسية', url: `${BASE_URL}/` },
    { name: 'صفحة المنتجات', url: `${BASE_URL}/products` },
    { name: 'API المنتجات', url: `${BASE_URL}/api/products` },
  ];

  let results = [];

  // هون منعمل 50 طلب بنفس الوقت لكل صفحة
  for (const test of tests) {
    const promises = Array.from({ length: CLIENTS }, async (_, i) => {
      const t0 = Date.now();
      try {
        const res = await fetch(test.url, { cache: 'no-store' });
        const duration = Date.now() - t0;
        return { client: i + 1, status: res.status, duration, ok: res.ok };
      } catch (err) {
        return { client: i + 1, status: 0, duration: Date.now() - t0, ok: false, error: err.message };
      }
    });

    const responses = await Promise.all(promises);
    const success = responses.filter(r => r.ok).length;
    const failed = CLIENTS - success;
    const avgTime = Math.round(responses.reduce((a, b) => a + b.duration, 0) / CLIENTS);
    const maxTime = Math.max(...responses.map(r => r.duration));

    results.push({
      page: test.name,
      url: test.url,
      total: CLIENTS,
      success,
      failed,
      failRate: ((failed / CLIENTS) * 100).toFixed(1) + '%',
      avgTime: avgTime + 'ms',
      maxTime: maxTime + 'ms',
      status: failed < 3 ? '✅ ممتاز' : failed < 10 ? '⚠️ مقبول' : '❌ في مشكلة',
    });
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

  return new Response(JSON.stringify({
    message: `فحص ${CLIENTS} عميل بنفس الوقت خلص`,
    totalTime: totalTime + ' ثانية',
    summary: results,
    نصيحة: results.some(r => r.failed > 5) 
      ? 'عندك مشكلة - السيرفر ما تحمل 50 - غالبا قاعدة البيانات'
      : 'موقعك ممتاز وبيتحمل 50 زبون واكتر',
  }, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
