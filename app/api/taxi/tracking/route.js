export const dynamic = "force-dynamic";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

export async function POST(req) {
  try {
    const supabase = getSupabase();
    const { order_id, taxi_id, lat, lng } = await req.json();

    if (!order_id || !lat || !lng) return Response.json({ error: 'order_id, lat, lng required' }, { status: 400 });

    // حدث موقع التاكسي الحي بالطلب
    await supabase.from('taxi_orders').update({
      taxi_lat_live: lat,
      taxi_lng_live: lng,
      updated_at: new Date().toISOString()
    }).eq('id', order_id);

    // وحدث موقع السايق نفسه - نفس منطق الدلفري
    if (taxi_id) {
      await supabase.from('taxi_drivers').update({
        lat,
        lng,
        "Last Location Update": new Date().toISOString()
      }).eq('Taxi_ID', taxi_id);
    }

    // اذا عندك جدول تتبع منفصل مثل الدلفري driver_live_tracking
    await supabase.from('taxi_live_tracking').upsert({
      order_id,
      taxi_id,
      lat,
      lng,
      updated_at: new Date().toISOString()
    }, { onConflict: 'order_id' }).then(()=>{},()=>{});

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
