// lib/taxi/nearby.js - فلتر 5 كيلو دائري مثل الدلفري
export function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export async function getNearbyDrivers(supabase, { origin_lat, origin_lng, vehicle_type, radiusKm = 5, minWallet = 50000 }) {
  // جيب السواقين الأونلاين و Active مثل كود الدلفري
  const fiveMinAgo = new Date(Date.now() - 5*60*1000).toISOString();
  
  const { data: drivers, error } = await supabase
    .from('taxi_drivers')
    .select('Taxi_ID, full_name, phone, vehicle_type, lat, lng, area, is_online, "Last Location Update"')
    .eq('status', 'active')
    .eq('is_online', true)
    .eq('vehicle_type', vehicle_type)
    .gte('"Last Location Update"', fiveMinAgo)
    .not('lat', 'is', null);

  if (error) throw error;

  // فلتر 5 كيلو
  const withDistance = drivers.map(d => ({
    ...d,
    distance_km: haversine(origin_lat, origin_lng, parseFloat(d.lat), parseFloat(d.lng))
  })).filter(d => d.distance_km <= radiusKm).sort((a,b) => a.distance_km - b.distance_km);

  // فلتر المحفظة - شيك على جدول wallets المنفصل
  const driverIds = withDistance.map(d => d.Taxi_ID);
  if (driverIds.length === 0) return [];

  const { data: wallets } = await supabase
    .from('wallets')
    .select('taxi_id, balance')
    .in('taxi_id', driverIds)
    .gte('balance', minWallet);

  const allowedIds = new Set(wallets?.map(w => w.taxi_id) || []);
  return withDistance.filter(d => allowedIds.has(d.Taxi_ID));
}
