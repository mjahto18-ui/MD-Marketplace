// حط هاد الكود مكان القديم: app/api/load-test/route.js

export async function GET(req) {
  const BASE_URL = 'https://www.md-marketplace.store';
  const url = new URL(req.url);
const CLIENTS = parseInt(url.searchParams.get("clients") || "50", 10);

  const tests = [
    { name: 'الصفحة الرئيسية', url: `${BASE_URL}/` },
    { name: 'صفحة المنتجات', url: `${BASE_URL}/products` },
    { name: 'API المنتجات', url: `${BASE_URL}/api/products` },
    { name: 'API السلة', url: `${BASE_URL}/api/cart` },
  ];

  let results = [];

  for (const test of tests) {
    const promises = Array.from({ length: CLIENTS }, async (_, i) => {
      const t0 = Date.now();
      try {
        const res = await fetch(test.url, { cache: 'no-store' });
        const text = await res.text();
        return { 
          client: i + 1, 
          status: res.status, 
          duration: Date.now() - t0, 
          ok: res.ok,
          body: text.slice(0, 200) // اول 200 حرف من الخطأ
        };
      } catch (err) {
        return { client: i + 1, status: 0, duration: Date.now() - t0, ok: false, body: err.message };
      }
    });

    const responses = await Promise.all(promises);
    const success = responses.filter(r => r.ok).length;
    const failed = CLIENTS - success;
    
    // جمع اكواد الخطأ
    const statusCounts = {};
    const errorBodies = {};
    responses.forEach(r => {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
      if (!r.ok && !errorBodies[r.status]) {
        errorBodies[r.status] = r.body;
      }
    });

    results.push({
      page: test.name,
      url: test.url,
      total: CLIENTS,
      success,
      failed,
      failRate: ((failed / CLIENTS) * 100).toFixed(1) + '%',
      avgTime: Math.round(responses.reduce((a, b) => a + b.duration, 0) / CLIENTS) + 'ms',
      statusCodes: statusCounts,
      errorExample: errorBodies,
      status: failed === 0 ? '✅' : '❌',
    });
  }

  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
