export const dynamic = "force-dynamic";
import { createClient } from "@supabase/supabase-js";
import { getPricingConfig, calculateFare } from "@/lib/taxi/pricingEngine";

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
    const { 
      customer_id, customer_name, customer_phone, 
      origin_name, origin_display_name, origin_lat, origin_lng, 
      dest_name, dest_display_name, dest_lat, dest_lng, 
      vehicle_type = 'car', cityKm = 0, highwayKm = 0, totalKm = 0,
      scheduled_at, trip_type
    } = body;

    if (!origin_lat || !origin_lng || !dest_lat || !dest_lng) {
      return Response.json({ error: 'origin/dest required' }, { status: 400 });
    }

    const bundle = await getPricingConfig();
    const fare = calculateFare({ cityKm, highwayKm, totalKm, engineCode: '1500', area: 'default', routeKey: 'default', pricingBundle: bundle });

    const finalOriginName = origin_name || origin_display_name || `${Number(origin_lat).toFixed(5)}, ${Number(origin_lng).toFixed(5)}`;
    const finalDestName = dest_name || dest_display_name || `${Number(dest_lat).toFixed(5)}, ${Number(dest_lng).toFixed(5)}`;

    // حفظ وقت الحجز المسبق
    const isScheduled = trip_type === 'scheduled' && scheduled_at;
    const requested_start_at = isScheduled ? new Date(scheduled_at).toISOString() : null;

    const { data, error } = await supabase.from('taxi_orders').insert({
      customer_id: customer_id?.toString() || null,
      customer_name, 
      customer_phone,
      origin_name: finalOriginName, 
      origin_lat: origin_lat.toString(), 
      origin_lng: origin_lng.toString(),
      dest_name: finalDestName, 
      dest_lat: dest_lat.toString(), 
      dest_lng: dest_lng.toString(),
      taxi_vehicle_type: vehicle_type,
      status: 'draft', // بيضل draft و confirm بيحولو
      total_amount: fare.customer_pays_lbp,
      distance_traveled: totalKm?.toString(),
      customer_notes: `pricing: ${JSON.stringify(fare.breakdown)} | trip_type:${trip_type || 'now'}`,
      customer_lat: origin_lat.toString(),
      customer_lng: origin_lng.toString(),
      requested_start_at: requested_start_at,
      requested_end_at: requested_start_at,
    }).select().single();

    if (error) throw error;
    return Response.json({ success: true, draft: data, pricing: fare, isScheduled });
  } catch (e) {
    console.error('create-draft error', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
