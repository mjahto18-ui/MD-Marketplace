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

    // شيك اذا الطلب لسا pending و جيب الكود القديم
    const { data: order } = await supabase.from('taxi_orders').select('status, secret_code, customer_id').eq('id', order_id).single();
    if (!order || order.status !== 'pending') return Response.json({ error: 'الطلب لم يعد متاح' }, { status: 409 });
    if (!order.secret_code) return Response.json({ error: 'الطلب بدون كود - خلل' }, { status: 500 });

    const { data: driver } = await supabase.from('taxi_drivers').select('full_name, phone, plate_number, car_type, vehicle_type').eq('Taxi_ID', taxi_id).single();

    const { data: updated, error } = await supabase.from('taxi_orders').update({
      taxi_id,
      taxi_name: driver?.full_name,
      taxi_phone: driver?.phone,
      taxi_plate_number: driver?.plate_number,
      taxi_car_type: driver?.car_type,
      taxi_vehicle_type: driver?.vehicle_type,
      // ما منغير secret_code - منترك الكود يلي انخلق مع الطلب
      status: 'accepted',
      taxi_status: 'on_the_way',
      updated_at: new Date().toISOString()
    }).eq('id', order_id).select().single();

    if (error) throw error;

    // ابعت للزبونة انو السايق قبل - بنبعت الكود القديم نفسو
    await supabase.from('push_queue').insert({
      'Customer ID': updated.customer_id,
      Title: 'تم قبول طلبك',
      Message: `السائق ${driver?.full_name} في الطريق اليك - كود الرحلة ${order.secret_code}`,
      Status: 'Pending',
      Code: 'TAXI_ACCEPTED'
    }).then(()=>{},()=>{});

    return Response.json({ success: true, order: updated, secret_code: order.secret_code });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
