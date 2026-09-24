// lib/taxi/nearby.js - فلتر 5 كيلو دائري مثل الدلفري - بدون فلتر محفظة (المحفظة بتنفحص بـ accept من wallet_transactions)
export function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export async function getNearbyDrivers(supabase, { origin_lat, origin_lng, vehicle_type, radiusKm = 5 }) {
  const fiveMinAgo = new Date(Date.now() - 5*60*1000).toISOString();
  
  const { data: drivers, error } = await supabase
    .from('taxi_drivers')
    .select('Taxi_ID, full_name, phone, vehicle_type, engine_cc, lat, lng, "Current Latitude", "Current Longitude", area, is_online, "Last Location Update"')
    .eq('status', 'active')
    .eq('is_online', true)
    .eq('vehicle_type', vehicle_type)
    .gte('"Last Location Update"', fiveMinAgo);

  if (error) {
    console.log('nearby error', error.message);
    throw error;
  }

  if (!drivers || drivers.length === 0) return [];

  // فلتر 5 كيلو - استعمل Current Latitude اول شي، اذا فاضي استعمل lat
  const withDistance = drivers.map(d => {
    const dLat = d["Current Latitude"] ?? d.lat;
    const dLng = d["Current Longitude"] ?? d.lng;
    if (dLat == null || dLng == null) return null;
    
    return {
      ...d,
      distance_km: haversine(origin_lat, origin_lng, parseFloat(dLat), parseFloat(dLng))
    };
  }).filter(Boolean)
    .filter(d => d.distance_km <= radiusKm)
    .sort((a,b) => a.distance_km - b.distance_km);

  return withDistance;
}
