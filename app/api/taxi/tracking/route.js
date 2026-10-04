export const dynamic = "force-dynamic";
import { getSupabase as getSupabaseLib } from "@/lib/supabase";

export async function POST(req) {
  try {
    const supabase = getSupabaseLib();
    const { order_id, taxi_id, lat, lng, speed, heading } = await req.json();
    if (!order_id || !lat || !lng) return Response.json({ error: 'order_id, lat, lng required' }, { status: 400 });

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(order_id)) return Response.json({ success: true, test: true });

    const now = new Date().toISOString();

    // ✅ أهم شي - بس 2 updates - بلا ما تستنى الـ insert
    const [orderRes, driverRes] = await Promise.all([
      supabase.from('taxi_orders').update({
        taxi_lat_live: Number(lat),
        taxi_lng_live: Number(lng),
        updated_at: now
      }).eq('id', order_id),
      
      taxi_id ? supabase.from('taxi_drivers').update({
        lat: Number(lat),
        lng: Number(lng),
        "Last Location Update": now
      }).eq('Taxi_ID', taxi_id) : Promise.resolve({ error: null })
    ]);

    // ✅ fire-and-forget - لا تستناه
    if (taxi_id) {
      supabase.from('taxi_live_tracking').insert({
        order_id,
        taxi_id,
        lat: Number(lat),
        lng: Number(lng),
        speed: Number(speed) || 0,
        heading: Number(heading) || 0
      }).then(() => {}, () => {});
    }

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
