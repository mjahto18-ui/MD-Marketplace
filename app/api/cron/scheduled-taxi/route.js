export const dynamic = "force-dynamic";
import { createClient } from "@supabase/supabase-js";
import { getNearbyDrivers } from "@/lib/taxi/nearby";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  return createClient(url, key);
}

export async function GET(req) {
  // حماية الكرون - حط CRON_SECRET بـ .env
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    // اذا عم تجرب من المتصفح خليك تفتحو بس لا تنسى تحميه بعدين
    // return Response.json({error:'unauthorized'},{status:401});
  }

  const supabase = getSupabase();
  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000); // بعد ساعة
  const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  // جيب كل الطلبات المسبقة يلي موعدها بين هلأ وبعد ساعتين ولسا draft
  const { data: drafts, error } = await supabase
    .from('taxi_orders')
    .select('*')
    .eq('status', 'draft')
    .not('requested_start_at', 'is', null)
    .gte('requested_start_at', now.toISOString())
    .lte('requested_start_at', inTwoHours.toISOString());

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const results = [];

  for (const draft of drafts) {
    // بس يلي صار وقتها قبل بساعة
    const scheduledTime = new Date(draft.requested_start_at);
    const diffMinutes = (scheduledTime - now) / 1000 / 60;
    if (diffMinutes > 70 || diffMinutes < 0) continue; // لسا بكير او راح وقتو

    // حول لـ pending
    const { data: order, error: updErr } = await supabase
      .from('taxi_orders')
      .update({ status: 'pending', updated_at: new Date().toISOString() })
      .eq('id', draft.id)
      .select()
      .single();

    if (updErr) { results.push({ id: draft.id, error: updErr.message }); continue; }

    // دور على سواقين 5 كم ثم 10 كم
    let nearby = await getNearbyDrivers(supabase, {
      origin_lat: order.origin_lat,
      origin_lng: order.origin_lng,
      vehicle_type: order.taxi_vehicle_type,
      radiusKm: 5
    });
    let radius = 5;
    if (nearby.length === 0) {
      nearby = await getNearbyDrivers(supabase, {
        origin_lat: order.origin_lat,
        origin_lng: order.origin_lng,
        vehicle_type: order.taxi_vehicle_type,
        radiusKm: 10
      });
      radius = 10;
    }

    if (nearby.length > 0) {
      await supabase.from('push_queue').insert(
        nearby.map(d => ({
          Title: 'حجز مسبق - صار وقتو',
          Message: `حجز مسبق ${order.origin_name} -> ${order.dest_name} - موعد ${new Date(order.requested_start_at).toLocaleString('ar-LB')} - كود ${order.secret_code} - ${d.distance_km.toFixed(1)} كم`,
          Status: 'Pending',
          Code: 'TAXI_SCHEDULED_DUE',
          'Order ID': order.id,
          'Customer ID': d.Taxi_ID
        }))
      );
    }

    results.push({ id: order.id, scheduled_at: order.requested_start_at, nearby: nearby.length, radius });
  }

  // كمان الغي الطلبات المسبقة يلي راح وقتها وما انقبلت
  const { data: expired } = await supabase
    .from('taxi_orders')
    .select('id')
    .eq('status', 'draft')
    .not('requested_start_at', 'is', null)
    .lt('requested_start_at', new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()); // صرلو ساعتين رايح

  if (expired?.length) {
    await supabase.from('taxi_orders').update({ status: 'cancelled', admin_notes: 'expired scheduled - not accepted' }).in('id', expired.map(e => e.id));
  }

  return Response.json({ checked: drafts.length, activated: results.length, results, expired: expired?.length || 0 });
}
