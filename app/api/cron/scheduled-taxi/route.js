export const dynamic = "force-dynamic";
import { createClient } from "@supabase/supabase-js";
import { getNearbyDrivers } from "@/lib/taxi/nearby";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  return createClient(url, key);
}

export async function GET(req) {
  // 1. حماية CRON_SECRET - لازم يكون نفسو بـ pg_cron
  const auth = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return Response.json({ error: 'CRON_SECRET not set in .env' }, { status: 500 });
  }

  if (auth !== `Bearer ${secret}`) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = getSupabase();
  const now = new Date();
  const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

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
    const scheduledTime = new Date(draft.requested_start_at);
    const diffMinutes = (scheduledTime - now) / 1000 / 60;
    if (diffMinutes > 70 || diffMinutes < 0) continue;

    const { data: order, error: updErr } = await supabase
      .from('taxi_orders')
      .update({ status: 'pending', updated_at: new Date().toISOString() })
      .eq('id', draft.id)
      .select()
      .single();

    if (updErr) { results.push({ id: draft.id, error: updErr.message }); continue; }

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
          Message: `🕒 حجز مسبق - الموعد ${new Date(order.requested_start_at).toLocaleString('ar-LB')} - ${order.origin_name} -> ${order.dest_name} - ${order.total_amount?.toLocaleString()} ل.ل - كود ${order.secret_code} - ${d.distance_km.toFixed(1)} كم - لا تروح هلأ، الانطلاق على ${new Date(order.requested_start_at).toLocaleTimeString('ar-LB')}`,
          Status: 'Pending',
          Code: 'TAXI_SCHEDULED_DUE',
          'Order ID': order.id,
          'Customer ID': d.Taxi_ID
        }))
      );
    }

    results.push({ id: order.id, scheduled_at: order.requested_start_at, nearby: nearby.length, radius });
  }

  const { data: expired } = await supabase
    .from('taxi_orders')
    .select('id')
    .eq('status', 'draft')
    .not('requested_start_at', 'is', null)
    .lt('requested_start_at', new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString());

  if (expired?.length) {
    await supabase.from('taxi_orders').update({ status: 'cancelled', admin_notes: 'expired scheduled - not accepted' }).in('id', expired.map(e => e.id));
  }

  return Response.json({ checked: drafts.length, activated: results.length, results, expired: expired?.length || 0 });
}
