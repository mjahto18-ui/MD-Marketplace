export const dynamic = "force-dynamic";
import { createClient } from "@supabase/supabase-js";
import { getNearbyDrivers } from "@/lib/taxi/nearby";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_KEY;
  return createClient(url, service || key);
}

export async function POST(req) {
  try {
    const supabase = getSupabase();
    const { draft_id, origin_lat, origin_lng, vehicle_type } = await req.json();

    if (!draft_id) return Response.json({ error: 'draft_id required' }, { status: 400 });

    // حول draft -> pending
    const { data: order, error: orderErr } = await supabase.from('taxi_orders').update({ status: 'pending', updated_at: new Date().toISOString() }).eq('id', draft_id).select().single();
    if (orderErr) throw orderErr;

    // فلتر 5 كيلو + محفظة + اونلاين مثل الدلفري
    let nearby = await getNearbyDrivers(supabase, { origin_lat: order.origin_lat || origin_lat, origin_lng: order.origin_lng || origin_lng, vehicle_type: order.taxi_vehicle_type || vehicle_type, radiusKm: 5 });
    
    // اذا ما لقينا ب 5 كم منوسع ل 10 بعد شوي (نرجع للزبونة انو عم ندور)
    let radius = 5;
    if (nearby.length === 0) {
      nearby = await getNearbyDrivers(supabase, { origin_lat: order.origin_lat, origin_lng: order.origin_lng, vehicle_type: order.taxi_vehicle_type, radiusKm: 10 });
      radius = 10;
    }

    // ابعت Push للسواقين (نفس فكرة push_queue يلي عندك بالدلفري)
    if (nearby.length > 0) {
      const pushRows = nearby.map(d => ({
        'Driver ID': d.Taxi_ID,
        'Title': 'طلب تاكسي جديد قريب منك',
        'Message': `${order.origin_name} -> ${order.dest_name} - ${vehicle_type} - ${order.total_amount} ل.ل - على بعد ${d.distance_km.toFixed(1)} كم`,
        'Status': 'Pending',
        'Code': 'TAXI_NEW_REQUEST',
        'Order ID': order.id
      }));
      // اذا عندك push_queue استخدمه
      await supabase.from('push_queue').insert(pushRows.map(r => ({
        'Customer ID': r['Driver ID'], // مؤقت اذا الجدول نفسه
        Title: r.Title,
        Message: r.Message,
        Status: r.Status,
        Code: r.Code
      }))).then(()=>{},()=>{});
    }

    return Response.json({ success: true, order, nearby_count: nearby.length, radius_used_km: radius, drivers: nearby.map(d => ({ id: d.Taxi_ID, name: d.full_name, distance_km: d.distance_km.toFixed(2) })) });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
