export const dynamic = "force-dynamic";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getPricingConfig, calculateFare } from "@/lib/taxi/pricingEngine";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_KEY;
  return createClient(url, service || key);
}

function normalizePhone(p) {
  return String(p || "").replace(/\D/g, "").trim();
}

function getEstimateEngineCode(vehicle_type, bundle) {
  const engines = bundle?.engines? Object.values(bundle.engines) : [];
  const vt = vehicle_type;
  if (vt === 'car') {
    const carEngines = engines.filter(e => e.vehicle_type === 'car');
    if (carEngines.length > 0) {
      carEngines.sort((a,b) => Number(b.factor) - Number(a.factor) || Number(b.consumption_l_per_km) - Number(a.consumption_l_per_km));
      return carEngines[0].code;
    }
    return '2500';
  }
  if (vt === 'van') {
    const vanEngines = engines.filter(e => e.vehicle_type === 'van');
    if (vanEngines.length > 0) {
      vanEngines.sort((a,b) => Number(b.factor) - Number(a.factor));
      return vanEngines[0].code;
    }
    return '2500';
  }
  if (vt === 'moto') {
    const motoEngines = engines.filter(e => e.vehicle_type === 'moto' || e.code === '150' || e.code === 'moto');
    if (motoEngines.length > 0) {
      motoEngines.sort((a,b) => Number(b.factor) - Number(a.factor));
      return motoEngines[0].code;
    }
    return '150';
  }
  if (vt === 'toktok') {
    const ttEngines = engines.filter(e => e.vehicle_type === 'toktok' || e.code === '200' || e.code === 'toktok');
    if (ttEngines.length > 0) {
      ttEngines.sort((a,b) => Number(b.factor) - Number(a.factor));
      return ttEngines[0].code;
    }
    return '200';
  }
  return '2500';
}

export async function POST(req) {
  try {
    const supabase = getSupabase();

    // ✅ حماية متل add-to-cart - منجيب الزبون من الكوكي مش من البادي
    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) {
      return Response.json({ success: false, message: "لازم تسجل دخول" }, { status: 401 });
    }
    let phone;
    try {
      const s = JSON.parse(sessionCookie);
      phone = s.phone || s.Mobile || s.user?.phone || sessionCookie;
    } catch { phone = sessionCookie; }

    const phoneNorm = normalizePhone(phone);
    const { data: customers } = await supabase.from('customers').select('*');
    let customerRow = null;
    for (const c of customers || []) {
      const mobile = normalizePhone(c["Mobile"] || "");
      const rawPhone = String(c["Mobile"] || "").trim();
      if (mobile === phoneNorm || rawPhone === phone || String(c["Customer ID"] || "") === phone) { customerRow = c; break; }
    }
    if (!customerRow) {
      const found = (customers || []).find(c => String(c["Mobile"] || "").trim() === String(phone).trim());
      if (found) customerRow = found;
    }
    if (!customerRow) return Response.json({ success: false, message: "حسابك مش موجود بجدول customers" }, { status: 401 });

    // ✅ هون عم ننسخ اسمك ورقمك و ID تلقائي
    const customer_id = customerRow["Customer ID"]?.toString();
    const customer_name = customerRow["Name"] || customerRow["Customer Name"] || "";
    const customer_phone = customerRow["Mobile"] || phone;

    const body = await req.json();
    const {
      origin_name, origin_display_name, origin_lat, origin_lng,
      dest_name, dest_display_name, dest_lat, dest_lng,
      vehicle_type = 'car',
      area = 'default',
      cityKm = 0, highwayKm = 0, totalKm = 0,
      scheduled_at, trip_type
    } = body;

    if (!origin_lat ||!origin_lng ||!dest_lat ||!dest_lng) {
      return Response.json({ error: 'origin/dest required' }, { status: 400 });
    }

    const bundle = await getPricingConfig();
    const finalEngineCode = getEstimateEngineCode(vehicle_type, bundle);
    const finalArea = body.area || area || 'default';

    const fare = calculateFare({
      cityKm: Number(cityKm) || 0,
      highwayKm: Number(highwayKm) || 0,
      totalKm: Number(totalKm) || 0,
      engineCode: finalEngineCode,
      area: finalArea,
      vehicle_type: vehicle_type,
      routeKey: 'default',
      pricingBundle: bundle,
      isDriverAcceptance: false
    });

    const finalOriginName = origin_name || origin_display_name || `${Number(origin_lat).toFixed(5)}, ${Number(origin_lng).toFixed(5)}`;
    const finalDestName = dest_name || dest_display_name || `${Number(dest_lat).toFixed(5)}, ${Number(dest_lng).toFixed(5)}`;

    const isScheduled = trip_type === 'scheduled' && scheduled_at;
    const requested_start_at = isScheduled? new Date(scheduled_at).toISOString() : null;

    const { data, error } = await supabase.from('taxi_orders').insert({
      customer_id: customer_id,
      customer_name: customer_name,
      customer_phone: customer_phone,
      origin_name: finalOriginName,
      origin_lat: Number(origin_lat),
      origin_lng: Number(origin_lng),
      dest_name: finalDestName,
      dest_lat: Number(dest_lat),
      dest_lng: Number(dest_lng),
      taxi_vehicle_type: vehicle_type,
      taxi_engine_cc: null,
      status: 'draft',
      total_amount: fare.customer_pays_lbp,
      distance_traveled: Number(totalKm) || 0,
      customer_notes: `pricing: ${JSON.stringify(fare.breakdown)} | trip_type:${trip_type || 'now'} | engine:${fare.breakdown.engineCode} | area:${finalArea}`,
      customer_lat: Number(origin_lat),
      customer_lng: Number(origin_lng),
      requested_start_at: requested_start_at,
      requested_end_at: requested_start_at,
    }).select().single();

    if (error) throw error;
    return Response.json({
      success: true,
      draft: data,
      pricing: fare,
      isScheduled,
      engine_used: fare.breakdown.engineCode,
      area_used: finalArea
    });
  } catch (e) {
    console.error('create-draft error', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
