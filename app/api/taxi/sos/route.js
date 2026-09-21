// app/api/taxi/sos/route.js
export async function POST(req){
  const { order_id, comment } = await req.json();
  const supabase = getSupabase();

  // جيب كل معلومات الطلب
  const { data: order } = await supabase.from('taxi_orders').select('*').eq('id', order_id).single();
  if(!order) return Response.json({error:'order not found'}, {status:404});

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
    comment
  }).select().single();

  if(error) return Response.json({error: error.message}, {status:500});
  return Response.json({success:true, sos: data});
}
