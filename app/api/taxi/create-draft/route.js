export const dynamic = "force-dynamic";
import { createClient } from "@supabase/supabase-js";
import { getPricingConfig, calculateFare } from "@/lib/taxi/pricingEngine";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_KEY;
  return createClient(url, service || key);
}

function getEstimateEngineCode(vehicle_type, bundle) {
  const engines = bundle?.engines? Object.values(bundle.engines) : [];

  if (vehicle_type === 'car') {
    // سيارة = أعلى محرك سيارة (2500) للسعر التقديري العالي
    const carEngines = engines.filter(e => e.vehicle_type === 'car');
    if (carEngines.length > 0) {
      carEngines.sort((a,b) => Number(b.factor) - Number(a.factor));
      return carEngines[0].code;
    }
    return '2500'; // fallback لو الجدول فاضي
  }

  if (vehicle_type === 'van') {
    if (bundle?.engines?.['2500']) return '2500';
    const van = engines.find(e => e.vehicle_type === 'van');
    return van? van.code : '2500';
  }

  if (vehicle_type === 'moto') {
    if (bundle?.engines?.['150']) return '150';
    if (bundle?.engines?.['moto']) return 'moto';
    const moto = engines.find(e => e.vehicle_type === 'moto');
    return moto? moto.code : '150';
  }

  if (vehicle_type === 'toktok') {
    if (bundle?.engines?.['200']) return '200';
    if (bundle?.engines?.['toktok']) return 'toktok';
    const tt = engines.find(e => e.vehicle_type === 'toktok');
    return tt? tt.code : '200';
  }

  return '1500';
}

export async function POST(req) {
  try {
    const supabase = getSupabase();
    const body = await req.json();
    const {
      customer_id, customer_name, customer_phone,
      origin_name, origin_display_name, origin_lat, origin_lng,
      dest_name, dest_display_name, dest_lat, dest_lng,
      vehicle_type = 'car',
      engine_code, // جاي من الفرونت
      area = 'default',
      cityKm = 0, highwayKm = 0, totalKm = 0,
      scheduled_at, trip_type
    } = body;

    if (!origin_lat ||!origin_lng ||!dest_lat ||!dest_lng) {
      return Response.json({ error: 'origin/dest required' }, { status: 400 });
    }

    const bundle = await getPricingConfig();

    // ✅ المنطق الجديد
    let finalEngineCode = engine_code;
    if (!finalEngineCode) {
      finalEngineCode = getEstimateEngineCode(vehicle_type, bundle);
    }

    const finalArea = body.area || area || 'default';

    const fare = calculateFare({
      cityKm: Number(cityKm) || 0,
      highwayKm: Number(highwayKm) || 0,
      totalKm: Number(totalKm) || 0,
      engineCode: finalEngineCode,
      area: finalArea,
      routeKey: 'default',
      pricingBundle: bundle
    });

    const finalOriginName = origin_name || origin_display_name || `${Number(origin_lat).toFixed(5)}, ${Number(origin_lng).toFixed(5)}`;
    const finalDestName = dest_name || dest_display_name || `${Number(dest_lat).toFixed(5)}, ${Number(dest_lng).toFixed(5)}`;

    const isScheduled = trip_type === 'scheduled' && scheduled_at;
    const requested_start_at = isScheduled? new Date(scheduled_at).toISOString() : null;

    const { data, error } = await supabase.from('taxi_orders').insert({
      customer_id: customer_id?.toString() || null,
      customer_name,
      customer_phone,
      origin_name: finalOriginName,
      origin_lat: Number(origin_lat),
      origin_lng: Number(origin_lng),
      dest_name: finalDestName,
      dest_lat: Number(dest_lat),
      dest_lng: Number(dest_lng),
      taxi_vehicle_type: vehicle_type,
      // منخزن الكود يلي انحسب عليه السعر التقديري
      taxi_engine_cc: finalEngineCode,
      status: 'draft',
      total_amount: fare.customer_pays_lbp,
      distance_traveled: Number(totalKm) || 0,
      customer_notes: `pricing: ${JSON.stringify(fare.breakdown)} | trip_type:${trip_type || 'now'} | engine:${finalEngineCode} | area:${finalArea}`,
      customer_lat: Number(origin_lat),
      customer_lng: Number(origin_lng),
      requested_start_at: requested_start_at,
      requested_end_at: requested_start_at,
    }).select().single();

    if (error) throw error;
    return Response.json({ success: true, draft: data, pricing: fare, isScheduled, engine_used: finalEngineCode, area_used: finalArea });
  } catch (e) {
    console.error('create-draft error', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
