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
    const body = await req.json();
    const { draft_id, origin_lat, origin_lng, vehicle_type, area, engine_code } = body;

    if (!draft_id) return Response.json({ error: 'draft_id required' }, { status: 400 });

    const { data: draft, error: draftErr } = await supabase.from('taxi_orders').select('*').eq('id', draft_id).single();
    if (draftErr) throw draftErr;
    if (!draft) return Response.json({ error: 'draft not found' }, { status: 404 });

    const secret_code = draft.secret_code || Math.floor(1000 + Math.random() * 9000).toString();

    // هل هو حجز مسبق بالمستقبل؟
    const isScheduledFuture = draft.requested_start_at && new Date(draft.requested_start_at) > new Date();

    // ✅ ما منرجع نحسب السعر هون - منخلي السعر التقديري العالي يلي انحسب بـ create-draft
    // للسيارة = 2500 (عالي) و للموتو/توكتوك = من الجدول
    const finalVehicleType = draft.taxi_vehicle_type || vehicle_type || 'car';
    const finalArea = draft.customer_notes?.includes('area:')
     ? draft.customer_notes.match(/area:([^|]+)/)?.[1]?.trim() || area || 'default'
      : area || 'default';

    if (isScheduledFuture) {
      const { data: order, error: orderErr } = await supabase
       .from('taxi_orders')
       .update({
          secret_code: secret_code,
          is_code_verified: false,
          origin_lat: draft.origin_lat || origin_lat,
          origin_lng: draft.origin_lng || origin_lng,
          taxi_vehicle_type: finalVehicleType,
          status: 'draft',
          updated_at: new Date().toISOString()
        })
       .eq('id', draft_id)
       .select()
       .single();
      if (orderErr) throw orderErr;

      return Response.json({
        success: true,
        order: {...order, secret_code },
        isScheduled: true,
        nearby_count: 0,
        radius_used_km: 0,
        message: 'تم حجز الطلب المسبق - سيتم البحث عن سائق قبل الموعد بساعة'
      });
    }

    // فوري: حول لـ pending + دور على سواقين - السعر بيضل عالي لحد ما السايق يقبل
    const { data: order, error: orderErr } = await supabase
     .from('taxi_orders')
     .update({
        status: 'pending',
        secret_code: secret_code,
        is_code_verified: false,
        origin_lat: draft.origin_lat || origin_lat,
        origin_lng: draft.origin_lng || origin_lng,
        taxi_vehicle_type: finalVehicleType,
        updated_at: new Date().toISOString()
      })
     .eq('id', draft_id)
     .select()
     .single();

    if (orderErr) throw orderErr;

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
      const pushRows = nearby.map(d => ({
        Title: 'طلب تاكسي جديد قريب منك',
        Message: `${order.origin_name || 'موقع'} -> ${order.dest_name || 'وجهة'} - ${order.taxi_vehicle_type} - ${order.total_amount?.toLocaleString() || ''} ل.ل - على بعد ${d.distance_km.toFixed(1)} كم - كود: ${secret_code}`,
        Status: 'Pending',
        Code: 'TAXI_NEW_REQUEST',
        'Order ID': order.id,
        'Customer ID': d.Taxi_ID
      }));
      await supabase.from('push_queue').insert(pushRows).then(()=>{},(e)=>{ console.log('push_queue error', e.message) });
    }

    return Response.json({
      success: true,
      order: {...order, secret_code },
      isScheduled: false,
      nearby_count: nearby.length,
      radius_used_km: radius,
      drivers: nearby.map(d => ({ id: d.Taxi_ID, name: d.full_name, distance_km: d.distance_km.toFixed(2) }))
    });

  } catch (e) {
    console.error('confirm error', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
