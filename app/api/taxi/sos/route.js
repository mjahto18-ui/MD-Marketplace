export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key, {
    auth: { persistSession: false },
    db: { schema: 'public' },
  });
}

export async function POST(req){
  try {
    const { order_id, comment } = await req.json();
    if(!order_id) return new Response(JSON.stringify({error:'order_id required'}), {status:400});

    const supabase = getSupabase();

    const { data: order, error: oErr } = await supabase.from('taxi_orders').select('*').eq('id', order_id).single();
    if(oErr || !order) return new Response(JSON.stringify({error:'order not found'}), {status:404});

    // اهم نقطة: ناخد احداثيات حية
    const liveLat = order.taxi_lat_live || order.customer_lat || order.origin_lat;
    const liveLng = order.taxi_lng_live || order.customer_lng || order.origin_lng;

    const { data, error } = await supabase.from('taxi_sos').insert({
      order_id: order.id,
      order_code: order.order_code,
      customer_id: order.customer_id,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      driver_id: order.taxi_id,
      driver_name: order.taxi_name,
      driver_phone: order.taxi_phone,
      vehicle_type: order.taxi_vehicle_type,
      car_type: order.taxi_car_type,
      plate_number: order.taxi_plate_number,
      car_color: order.taxi_car_color,
      engine_cc: order.taxi_engine_cc,
      seats: order.taxi_seats,
      origin_name: order.origin_name,
      dest_name: order.dest_name,
      
      // 👇 هدول هنن اللي كانو ناقصين وكرمالهم الخريطة ما كانت تفتح
      lat: liveLat,
      lng: liveLng,
      
      origin_lat: order.origin_lat,
      origin_lng: order.origin_lng,
      dest_lat: order.dest_lat,
      dest_lng: order.dest_lng,
      customer_lat: order.customer_lat,
      customer_lng: order.customer_lng,
      driver_lat: order.taxi_lat_live,
      driver_lng: order.taxi_lng_live,
      taxi_lat_live: order.taxi_lat_live,
      taxi_lng_live: order.taxi_lng_live,
      
      total_amount: order.total_amount,
      comment: comment || ''
    }).select().single();

    if(error) return new Response(JSON.stringify({error: error.message}), {status:500});
    return new Response(JSON.stringify({success:true, sos: data}), {headers:{'Content-Type':'application/json'}});
  } catch(e){
    return new Response(JSON.stringify({error: e.message}), {status:500});
  }
}
