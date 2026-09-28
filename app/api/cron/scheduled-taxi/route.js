export const dynamic = "force-dynamic";
import { createClient } from "@supabase/supabase-js";
import { getNearbyDrivers } from "@/lib/taxi/nearby";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  return createClient(url, key);
}

export async function GET(req) {
  const auth = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: 'CRON_SECRET not set in .env' }, { status: 500 });
  
  // للديباغ - شيلو بعد ما يشتغل
  console.log('Auth check:', { got: auth, expected: `Bearer ${secret}`.substring(0,20)+'...' });
  
  if (auth !== `Bearer ${secret}`) return Response.json({ error: 'unauthorized', got_auth: auth }, { status: 401 });

  const supabase = getSupabase();
  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);

  const { data: drafts, error } = await supabase
    .from('taxi_orders')
    .select('*')
    .eq('status', 'draft')
    .not('requested_start_at', 'is', null)
    .gte('requested_start_at', now.toISOString())
    .lte('requested_start_at', inOneHour.toISOString());

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const results = [];
  for (const draft of drafts) {
    const scheduledTime = new Date(draft.requested_start_at);
    const diffMinutes = (scheduledTime - now) / 1000 / 60;
    if (diffMinutes > 20 || diffMinutes < 0) continue;

    const { data: order, error: updErr } = await supabase
      .from('taxi_orders')
      .update({ status: 'pending', updated_at: new Date().toISOString() })
      .eq('id', draft.id).select().single();

    if (updErr) { results.push({ id: draft.id, error: updErr.message }); continue; }

    let nearby = await getNearbyDrivers(supabase, {
      origin_lat: order.origin_lat, origin_lng: order.origin_lng,
      vehicle_type: order.taxi_vehicle_type, radiusKm: 5
    });
    let radius = 5;
    if (nearby.length === 0) {
      nearby = await getNearbyDrivers(supabase, {
        origin_lat: order.origin_lat, origin_lng: order.origin_lng,
        vehicle_type: order.taxi_vehicle_type, radiusKm: 10
      });
      radius = 10;
    }

    if (nearby.length > 0) {
      // ✅ الصح - بلا secret_code للسائق + Data كامل
      await supabase.from('push_queue').insert(
        nearby.map(d => {
          // شيل secret_code من الـ order قبل ما تبعتو للسائق
          const { secret_code, ...orderWithoutCode } = order;
          
          return {
            "Queue ID": crypto.randomUUID(),
            "User ID": d["User ID"] || d.User_ID || d.user_id,
            "Customer ID": order.customer_id,
            "Code": "TAXI_SCHEDULED_DUE",
            "Order ID": order.id.toString(),
            "Data": {
              // السطر كامل بلا كود - هيك فيك تنقي بالقالب شو بدك
              ...orderWithoutCode,
              order_code: order.order_code,
              origin: order.origin_name,
              dest: order.dest_name,
              amount: order.total_amount, // خلي الرقم خام بلا toLocaleString مشان القالب
              amount_formatted: Number(order.total_amount||0).toLocaleString(),
              scheduled_time: new Date(order.requested_start_at).toLocaleTimeString('ar-LB',{hour:'2-digit',minute:'2-digit'}),
              distance: d.distance_km?.toFixed(1),
              is_scheduled: true
              // secret_code محذوف عمداً - ممنوع للسائق
            },
            "Status": "Pending"
          };
        })
      );
    }
    results.push({ id: order.id, scheduled_at: order.requested_start_at, nearby: nearby.length, radius });
  }

  // منتهية + يتيم
  const { data: expired } = await supabase.from('taxi_orders').select('id').eq('status','draft').not('requested_start_at','is',null).lt('requested_start_at', new Date(now.getTime() - 2*60*60*1000).toISOString());
  if (expired?.length) await supabase.from('taxi_orders').update({ status: 'cancelled', admin_notes: 'expired scheduled' }).in('id', expired.map(e=>e.id));

  const { data: orphan } = await supabase.from('taxi_orders').select('id').eq('status','draft').is('requested_start_at',null).is('secret_code',null).lt('created_at', new Date(now.getTime() - 15*60*1000).toISOString());
  if (orphan?.length) await supabase.from('taxi_orders').update({ status: 'cancelled', admin_notes: 'auto-cancelled orphan draft' }).in('id', orphan.map(o=>o.id));

  return Response.json({ checked: drafts.length, activated: results.length, results, expired: expired?.length||0, orphan_cleaned: orphan?.length||0 });
}
