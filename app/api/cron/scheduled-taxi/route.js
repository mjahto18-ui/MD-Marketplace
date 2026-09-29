export const dynamic = "force-dynamic";
import { createClient } from "@supabase/supabase-js";
import { getNearbyDrivers } from "@/lib/taxi/nearby";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url ||!key) throw new Error("Missing Supabase env");
  return createClient(url, key);
}

function nowBeirut() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Beirut' }));
}

function parseBeirutTimestamp(ts) {
  if (!ts) return null;
  const s = String(ts).replace('T', ' ').split('+')[0].split('Z')[0].trim();
  return new Date(s.replace(' ', 'T'));
}

export async function GET(req) {
  const url = new URL(req.url);
  const auth = req.headers.get('authorization')?.trim();
  const secretParam = url.searchParams.get('secret')?.trim();
  const secret = process.env.CRON_SECRET?.trim();

  if (!secret) return Response.json({ error: 'CRON_SECRET not set in.env' }, { status: 500 });
  if (auth!== `Bearer ${secret}` && secretParam!== secret) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = getSupabase();
  const now = nowBeirut();
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);

  const { data: allDrafts, error } = await supabase
   .from('taxi_orders')
   .select('*')
   .eq('status', 'draft')
   .not('requested_start_at', 'is', null);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const drafts = (allDrafts || []).filter(d => {
    const sched = parseBeirutTimestamp(d.requested_start_at);
    if (!sched) return false;
    return sched >= now && sched <= inOneHour;
  });

  const results = [];
  for (const draft of drafts) {
    const scheduledTime = parseBeirutTimestamp(draft.requested_start_at);
    if (!scheduledTime) continue;
    const diffMinutes = (scheduledTime - now) / 1000 / 60;
    if (diffMinutes > 20 || diffMinutes < -5) continue;

    const { data: order, error: updErr } = await supabase
     .from('taxi_orders')
     .update({ status: 'pending', updated_at: new Date().toISOString() })
     .eq('id', draft.id).select().single();

    if (updErr) { results.push({ id: draft.id, error: updErr.message, diffMinutes: diffMinutes.toFixed(1) }); continue; }

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
      await supabase.from('push_queue').insert(
        nearby.map(d => {
          const { secret_code,...orderWithoutCode } = order;
          return {
            "Queue ID": crypto.randomUUID(),
            "User ID": d["User ID"] || d.User_ID || d.user_id,
            "Customer ID": order.customer_id,
            "Code": "TAXI_SCHEDULED_DUE",
            "Order ID": order.id.toString(),
            "Data": {
             ...orderWithoutCode,
              order_code: order.order_code,
              origin: order.origin_name,
              dest: order.dest_name,
              amount: order.total_amount,
              amount_formatted: Number(order.total_amount||0).toLocaleString(),
              scheduled_time: scheduledTime.toLocaleTimeString('ar-LB',{hour:'2-digit',minute:'2-digit'}),
              scheduled_time_beirut: String(order.requested_start_at).substring(0,16),
              distance: d.distance_km?.toFixed(1),
              is_scheduled: true
            },
            "Status": "Pending"
          };
        })
      );
    }
    results.push({ id: order.id, scheduled_at: order.requested_start_at, diffMinutes: diffMinutes.toFixed(1), nearby: nearby.length, radius, now_beirut: now.toLocaleString('en-US',{timeZone:'Asia/Beirut'}) });
  }

  const twoHoursAgoBeirut = new Date(now.getTime() - 2*60*60*1000);
  const twoHoursAgoStr = `${twoHoursAgoBeirut.getFullYear()}-${String(twoHoursAgoBeirut.getMonth()+1).padStart(2,'0')}-${String(twoHoursAgoBeirut.getDate()).padStart(2,'0')} ${String(twoHoursAgoBeirut.getHours()).padStart(2,'0')}:${String(twoHoursAgoBeirut.getMinutes()).padStart(2,'0')}:${String(twoHoursAgoBeirut.getSeconds()).padStart(2,'0')}`;
  const { data: expired } = await supabase.from('taxi_orders').select('id, requested_start_at').eq('status','draft').not('requested_start_at','is',null).lt('requested_start_at', twoHoursAgoStr);
  if (expired?.length) await supabase.from('taxi_orders').update({ status: 'cancelled', admin_notes: 'expired scheduled - Beirut ' + twoHoursAgoStr }).in('id', expired.map(e=>e.id));

  const { data: orphan } = await supabase.from('taxi_orders').select('id').eq('status','draft').is('requested_start_at',null).is('secret_code',null).lt('created_at', new Date(Date.now()-15*60*1000).toISOString());
  if (orphan?.length) await supabase.from('taxi_orders').update({ status: 'cancelled', admin_notes: 'auto-cancelled orphan draft' }).in('id', orphan.map(o=>o.id));

  return Response.json({
    now_beirut: now.toLocaleString('en-US',{timeZone:'Asia/Beirut', timeZoneName:'short'}),
    now_beirut_raw: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`,
    checked: drafts.length, total_drafts: allDrafts?.length||0, activated: results.length, results, expired: expired?.length||0, orphan_cleaned: orphan?.length||0
  });
}
