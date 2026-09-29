export const dynamic = "force-dynamic";
import { getSupabase as getSupabaseLib } from "@/lib/supabase";

export async function POST(req) {
  try {
    const supabase = getSupabaseLib(); // ✅ singleton
    const { order_id, taxi_id, lat, lng, speed, heading } = await req.json();

    if (!order_id || !lat || !lng) {
      return Response.json({ error: 'order_id, lat, lng required' }, { status: 400 });
    }

    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      return Response.json({ error: 'lat/lng must be numbers' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // ✅ Parallel بدل Sequential - 500ms بدل 1500ms
    const [orderRes, driverRes] = await Promise.all([
      supabase.from('taxi_orders').update({
        taxi_lat_live: latNum,
        taxi_lng_live: lngNum,
        updated_at: now
      }).eq('id', order_id),
      
      taxi_id ? supabase.from('taxi_drivers').update({
        lat: latNum,
        lng: lngNum,
        "Last Location Update": now
      }).eq('Taxi_ID', taxi_id) : Promise.resolve({ error: null })
    ]);

    if (orderRes.error) throw orderRes.error;
    if (driverRes.error) console.warn('driver update failed:', driverRes.error);

    // ✅ insert بس إذا في taxi_id + لا تعمل insert إذا نفس الموقع (اختياري)
    if (taxi_id) {
      await supabase.from('taxi_live_tracking').insert({
        order_id,
        taxi_id,
        lat: latNum,
        lng: lngNum,
        speed: Number(speed) || 0,
        heading: Number(heading) || 0
      });
    }

    return Response.json({ success: true });
  } catch (e) {
    console.error('tracking error:', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
