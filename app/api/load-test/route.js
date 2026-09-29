export const dynamic = "force-dynamic";
// app/api/load-test/route.js - V4.1 مصلح - uuid صالح

export async function GET(req) {
  const BASE_URL = 'https://www.md-marketplace.store';
  const url = new URL(req.url);
  const DRIVERS = parseInt(url.searchParams.get("drivers") || "20", 10);
  const CUSTOMERS = parseInt(url.searchParams.get("customers") || "100", 10);

  const now = Date.now();
  const testId = `load-${now}`;
  // ✅ uuid صالح بدل test-order-123 يلي كان يعمل 500
  const TEST_UUID = '00000000-0000-0000-0000-000000000123';

  const scenarios = [
    {
      level: 1,
      group: '🔴 خريطة حية',
      name: 'POST /api/taxi/tracking - سائق يحدث موقع (3 writes)',
      method: 'POST',
      url: `${BASE_URL}/api/taxi/tracking`,
      body: { order_id: TEST_UUID, taxi_id: 'T001', lat: 33.8938, lng: 35.5018, speed: 40, heading: 90 },
      count: DRIVERS,
      expectedMs: 400,
      critical: true
    },
    {
      level: 1,
      group: '🔴 خريطة حية',
      name: 'GET /api/taxi/track/[order_id] - زبون يتابع',
      method: 'GET',
      url: `${BASE_URL}/api/taxi/track/${TEST_UUID}`,
      count: CUSTOMERS,
      expectedMs: 300,
      critical: true
    },
    {
      level: 1,
      group: '🔴 خريطة حية',
      name: 'GET /api/taxi/nearby - بحث سائقين قريبين (haversine)',
      method: 'GET',
      url: `${BASE_URL}/api/taxi/nearby?lat=33.8938&lng=35.5018&vehicle_type=car`,
      count: CUSTOMERS,
      expectedMs: 600,
      critical: true
    },
    {
      level: 1,
      group: '🔴 خريطة حية',
      name: 'POST /api/update-location - زبون يحدث موقعه',
      method: 'POST',
      url: `${BASE_URL}/api/update-location`,
      body: { customerID: 'CUST-TEST', lat: 33.8938, lng: 35.5018 },
      count: Math.floor(CUSTOMERS/2),
      expectedMs: 300,
      critical: true
    },
    {
      level: 1,
      group: '🟠 Middleware',
      name: 'GET /api/global-config - كل request',
      method: 'GET',
      url: `${BASE_URL}/api/global-config`,
      count: DRIVERS + CUSTOMERS,
      expectedMs: 200,
      critical: true
    },
    {
      level: 1,
      group: '🟠 Middleware',
      name: 'POST /api/guest - صفحة /',
      method: 'POST',
      url: `${BASE_URL}/api/guest`,
      count: Math.floor(CUSTOMERS/3),
      expectedMs: 300,
      critical: false
    },
    {
      level: 2,
      group: '🟡 متجر',
      name: 'GET /api/products',
      method: 'GET',
      url: `${BASE_URL}/api/products`,
      count: CUSTOMERS,
      expectedMs: 400,
      critical: true
    },
    {
      level: 2,
      group: '🟡 متجر',
      name: 'GET /api/cart',
      method: 'GET',
      url: `${BASE_URL}/api/cart`,
      count: CUSTOMERS,
      expectedMs: 400,
      critical: true
    },
    {
      level: 2,
      group: '🟡 متجر',
      name: 'GET /api/stores + /api/areas + /api/categories',
      method: 'GET',
      urls: [`${BASE_URL}/api/stores`, `${BASE_URL}/api/areas`, `${BASE_URL}/api/categories`],
      count: Math.floor(CUSTOMERS/2),
      expectedMs: 500,
      critical: false
    },
    {
      level: 3,
      group: '🔵 تاكسي Flow',
      name: 'GET /api/taxi/my-orders + history',
      method: 'GET',
      urls: [`${BASE_URL}/api/taxi/my-orders`, `${BASE_URL}/api/taxi/history`],
      count: Math.floor(CUSTOMERS/2),
      expectedMs: 500,
      critical: false
    },
    {
      level: 3,
      group: '🔵 تاكسي Flow',
      name: 'GET /api/my-orders + /api/my-balance + /api/wallet/me',
      method: 'GET',
      urls: [`${BASE_URL}/api/my-orders`, `${BASE_URL}/api/my-balance`, `${BASE_URL}/api/wallet/me`],
      count: Math.floor(CUSTOMERS/2),
      expectedMs: 500,
      critical: false
    },
  ];

  let results = [];
  let allDurations = [];

  for (const scen of scenarios) {
    const targets = scen.urls || [scen.url];
    let scenResponses = [];

    for (const targetUrl of targets) {
      const promises = Array.from({ length: scen.count }, async (_, i) => {
        const t0 = Date.now();
        try {
          const opts = { cache: 'no-store', headers: { 'x-load-test': testId } };
          if (scen.method === 'POST') {
            opts.method = 'POST';
            opts.headers = { ...opts.headers, 'Content-Type': 'application/json' };
            opts.body = JSON.stringify(scen.body || {});
          }
          const res = await fetch(targetUrl, opts);
          const text = await res.text();
          return { ok: res.ok, status: res.status, duration: Date.now() - t0, body: text.slice(0, 300) };
        } catch (e) {
          return { ok: false, status: 0, duration: Date.now() - t0, error: e.message };
        }
      });
      const responses = await Promise.all(promises);
      scenResponses.push(...responses);
    }

    const success = scenResponses.filter(r => r.ok).length;
    const failed = scenResponses.length - success;
    const durations = scenResponses.map(r => r.duration).sort((a,b)=>a-b);
    const avg = Math.round(durations.reduce((a,b)=>a+b,0)/durations.length);
    const p95 = durations[Math.floor(durations.length*0.95)] || 0;

    const statusCounts = {};
    const errors = {};
    scenResponses.forEach(r => {
      statusCounts[r.status] = (statusCounts[r.status]||0)+1;
      if (!r.ok && !errors[r.status]) errors[r.status] = r.body || r.error;
    });

    allDurations.push(...durations);

    results.push({
      level: scen.level,
      group: scen.group,
      scenario: scen.name,
      clients: scenResponses.length,
      expectedMs: scen.expectedMs,
      avg: avg + 'ms',
      p95: p95 + 'ms',
      min: Math.min(...durations) + 'ms',
      max: Math.max(...durations) + 'ms',
      success,
      failed,
      failRate: ((failed/scenResponses.length)*100).toFixed(1)+'%',
      statusCodes: statusCounts,
      errors: errors,
      health: failed===0 && avg <= scen.expectedMs ? '✅ ممتاز' : 
              failed===0 && avg <= scen.expectedMs*2 ? '⚠️ بطيء' : 
              failed/scenResponses.length < 0.05 ? '⚠️ فشل قليل' : '❌ فشل',
      critical: scen.critical
    });
  }

  const writesPerMin = DRIVERS * 15 * 3;
  const readsPerMin = (CUSTOMERS * 15 * 2) + ((DRIVERS+CUSTOMERS)*6);
  const totalReqPerMin = writesPerMin + readsPerMin;
  const totalAvg = Math.round(allDurations.reduce((a,b)=>a+b,0)/allDurations.length);
  const totalP95 = allDurations.sort((a,b)=>a-b)[Math.floor(allDurations.length*0.95)];

  const criticalFails = results.filter(r => r.critical && r.health.includes('❌'));
  const slowCritical = results.filter(r => r.critical && r.health.includes('⚠️'));

  const alerts = [];
  if (results.find(r => r.scenario.includes('tracking') && parseInt(r.avg) > 400)) alerts.push('🔴 tracking POST بطيء');
  if (results.find(r => r.scenario.includes('nearby') && parseInt(r.avg) > 600)) alerts.push('🔴 nearby بطيء');
  if (results.find(r => r.scenario.includes('track/') && parseInt(r.avg) > 300)) alerts.push('🟠 track/[order_id] بطيء');
  if (results.find(r => r.scenario.includes('global-config') && parseInt(r.avg) > 200)) alerts.push('🟡 global-config بطيء');
  if (criticalFails.length > 0) alerts.push(`❌ ${criticalFails.length} سيناريو حرج فشل`);

  const verdict = criticalFails.length === 0 && slowCritical.length === 0 ? '✅ بينجح عالأرض' :
                  criticalFails.length === 0 ? '⚠️ بينجح بس بطيء - لازم تصلح قبل ما يزيدو السائقين' :
                  '❌ رح يفشل عالأرض - لازم تصلح فورا';

  return new Response(JSON.stringify({
    meta: { timestamp: new Date().toISOString(), testId, scenario: `أسوأ سيناريو: ${DRIVERS} سائق + ${CUSTOMERS} زبون`, writesPerMin, readsPerMin, totalReqPerMin, totalAvg: totalAvg + 'ms', totalP95: totalP95 + 'ms', totalRequests: allDurations.length },
    verdict,
    summary: { totalScenarios: results.length, passed: results.filter(r => r.health.includes('✅')).length, slow: results.filter(r => r.health.includes('⚠️')).length, failed: results.filter(r => r.health.includes('❌')).length, criticalFails: criticalFails.length },
    results, alerts
  }, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
}
