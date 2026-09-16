import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req) {
  const url = new URL(req.url);
  const secretParam = url.searchParams.get("secret");
  const authHeader = req.headers.get("authorization");

  // نفس الحماية تبع كورن الواتساب
  if (authHeader!== `Bearer ${CRON_SECRET}` && secretParam!== CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // 1. Delivered - من Assigned Driver
    const { data: deliveredData } = await supabase
     .from('order_requuest')
     .select('"Assigned Driver"')
     .eq('"Delivery Status"', 'Delivered')
     .not('"Assigned Driver"', 'is', null);

    const deliveredMap = {};
    deliveredData?.forEach(o => {
      const id = o['Assigned Driver'];
      deliveredMap[id] = (deliveredMap[id] || 0) + 1;
    });

    // 2. Reviews - بس Approved + Skipped FALSE
    const { data: reviewsData } = await supabase
     .from('reviews')
     .select('"Driver ID", "Rating"')
     .eq('"Status"', 'Approved')
     .eq('"Skipped"', 'FALSE')
     .not('"Driver ID"', 'is', null);

    const ratingsMap = {};
    reviewsData?.forEach(r => {
      const id = r['Driver ID'];
      const val = parseFloat(String(r['Rating'] || '').trim());
      if (isNaN(val)) return;
      if (!ratingsMap[id]) ratingsMap[id] = { count: 0, sum: 0 };
      ratingsMap[id].count += 1;
      ratingsMap[id].sum += val;
    });

    const allDriverIds = new Set([
     ...Object.keys(deliveredMap),
     ...Object.keys(ratingsMap)
    ]);

    console.log(`Delivered drivers: ${Object.keys(deliveredMap).length}, Rated drivers: ${Object.keys(ratingsMap).length}`);

    let updated = 0;
    for (const driverId of allDriverIds) {
      const totalDelivered = deliveredMap[driverId] || 0;
      const ratingCount = ratingsMap[driverId]?.count || 0;
      const avgRating = ratingCount > 0? ratingsMap[driverId].sum / ratingCount : 0;

      const { error } = await supabase
       .from('drivers')
       .update({
          "Total Delivered": totalDelivered,
          "Rating Count": ratingCount,
          "Avg Rating": parseFloat(avgRating.toFixed(2)),
          "Last Stats Update": new Date().toISOString()
        })
       .eq('"Driver ID"', driverId);

      if (!error) updated++;
    }

    return new Response(JSON.stringify({ ok: true, updated, totalDrivers: allDriverIds.size }), { status: 200 });

  } catch (e) {
    console.error("Driver stats error:", e);
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 });
  }
}
