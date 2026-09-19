export const dynamic = "force-dynamic";
import { createClient } from "@supabase/supabase-js";
import { getPricingConfig, calculateFare } from "@/lib/taxi/pricingEngine";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

export async function POST(req) {
  try {
    const supabase = getSupabase();
    const body = await req.json();
    const { customer_id, customer_name, customer_phone, origin_name, origin_lat, origin_lng, dest_name, dest_lat, dest_lng, vehicle_type = 'car', cityKm = 0, highwayKm = 0, totalKm = 0 } = body;

    if (!origin_lat || !origin_lng || !dest_lat || !dest_lng) {
      return Response.json({ error: 'origin/dest required' }, { status: 400 });
    }

    const bundle = await getPricingConfig();
    // احسب اعلى قيمة مثل ما قلت - 1500cc
    const fare = calculateFare({ cityKm, highwayKm, totalKm, engineCode: '1500', area: 'default', routeKey: 'default', pricingBundle: bundle });

    const { data, error } = await supabase.from('taxi_orders').insert({
      customer_id, customer_name, customer_phone,
      origin_name, origin_lat, origin_lng,
      dest_name, dest_lat, dest_lng,
      taxi_vehicle_type: vehicle_type,
      status: 'draft',
      total_amount: fare.customer_pays_lbp, // السعر التقريبي (اعلى قيمة)
      distance_traveled: totalKm,
      customer_notes: `pricing: ${JSON.stringify(fare.breakdown)}`
    }).select().single();

    if (error) throw error;

    return Response.json({ success: true, draft: data, pricing: fare });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
