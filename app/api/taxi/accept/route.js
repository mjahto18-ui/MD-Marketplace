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
    const { order_id, taxi_id } = await req.json();

    if (!order_id || !taxi_id) return Response.json({ error: 'order_id & taxi_id required' }, { status: 400 });

    // شيك رصيد قبل القبول
    const { data: wallet } = await supabase.from('wallets').select('balance').eq('taxi_id', taxi_id).single();
    if (!wallet || wallet.balance < 50000) {
      return Response.json({ error: 'رصيد المحفظة غير كافي - اشحن قبل قبول الطلب' }, { status: 402 });
    }

    // شيك اذا الطلب لسا pending
    const { data: order } = await supabase.from('taxi_orders').select('status').eq('id', order_id).single();
    if (!order || order.status !== 'pending') return Response.json({ error: 'الطلب لم يعد متاح' }, { status: 409 });

    const secret_code = Math.floor(1000 + Math.random() * 9000).toString(); // 4 ارقام

    const { data: driver } = await supabase.from('taxi_drivers').select('full_name, phone, plate_number, car_type, vehicle_type').eq('Taxi_ID', taxi_id).single();

    const { data: updated, error } = await supabase.from('taxi_orders').update({
      taxi_id,
      taxi_name: driver?.full_name,
      taxi_phone: driver?.phone,
      taxi_plate_number: driver?.plate_number,
      taxi_car_type: driver?.car_type,
      taxi_vehicle_type: driver?.vehicle_type,
      secret_code,
      status: 'accepted',
      taxi_status: 'on_the_way',
      updated_at: new Date().toISOString()
    }).eq('id', order_id).select().single();

    if (error) throw error;

    // ابعت للزبونة انو السايق قبل
    await supabase.from('push_queue').insert({
      'Customer ID': updated.customer_id,
      Title: 'تم قبول طلبك',
      Message: `السائق ${driver?.full_name} في الطريق اليك - كود الرحلة ${secret_code}`,
      Status: 'Pending',
      Code: 'TAXI_ACCEPTED'
    }).then(()=>{},()=>{});

    return Response.json({ success: true, order: updated, secret_code }); // secret_code نرجعو بس للتست - بالانتاج ما منرجعو للسايق الا بعد الوصول
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
