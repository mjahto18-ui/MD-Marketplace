export const dynamic = "force-dynamic";
import { createClient } from "@supabase/supabase-js";
function getSupabase(){ const url=process.env.NEXT_PUBLIC_SUPABASE_URL; const key=process.env.SUPABASE_SERVICE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; return createClient(url,key); }

function haversine(lat1, lon1, lat2, lon2){
  const R = 6371; const dLat = (lat2-lat1)*Math.PI/180; const dLon = (lon2-lon1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export async function GET(req){
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get('lat'));
  const lng = Number(searchParams.get('lng'));
  const vehicle_type = searchParams.get('vehicle_type') || 'car';
  if(!lat ||!lng) return new Response(JSON.stringify({drivers:[]}), {status:400});
  const supabase = getSupabase();
  const { data } = await supabase.from('taxi_drivers').select('"Taxi_ID", full_name, phone, car_type, plate_number, vehicle_type, "Current Latitude", "Current Longitude", is_online').eq('status','active').eq('is_online', true).eq('vehicle_type', vehicle_type);
  const nearby = (data||[]).map(d=>{
    const dLat = Number(d["Current Latitude"]); const dLng = Number(d["Current Longitude"]);
    if(!dLat ||!dLng) return null;
    const dist = haversine(lat,lng,dLat,dLng);
    return {...d, distance_km: dist};
  }).filter(Boolean).filter(d=>d.distance_km <= 3).sort((a,b)=>a.distance_km-b.distance_km).slice(0,10);
  return new Response(JSON.stringify({drivers: nearby}), {headers:{'Cache-Control':'no-store'}});
}
