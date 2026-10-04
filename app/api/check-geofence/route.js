import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// حساب المسافة Haversine بالـ km
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function POST(req) {
  try {
    const { lat, lng, service } = await req.json();
    // service: 'cart' | 'taxi' | 'bot'

    if (!lat ||!lng ||!service) {
      return Response.json({ error: 'lat, lng, service required' }, { status: 400 });
    }

    if (!['cart', 'taxi', 'bot'].includes(service)) {
      return Response.json({ error: 'invalid service' }, { status: 400 });
    }

    // جيب كل السنترات النشطة يلي الخدمة مفتوحة فيها
    const { data: centers, error } = await supabase
     .from('geofence_centers')
     .select('*')
     .eq('is_active', true)
     .eq(`${service}_enabled`, true);

    if (error) throw error;

    // شيك اذا الزبون جوا أي دائرة
    for (let center of centers) {
      const radius = center[`radius_${service}`];
      const dist = getDistance(lat, lng, center.center_lat, center.center_lng);

      if (dist <= radius) {
        return Response.json({
          allowed: true,
          center: center.name,
          center_id: center.id,
          distance_km: Math.round(dist * 10) / 10,
          radius_km: radius
        });
      }
    }

    // برا كل الدوائر
    return Response.json({
      allowed: false,
      message: 'خارج نطاق التغطية حالياً',
      nearest_center: centers.length > 0? centers[0].name : null
    });

  } catch (e) {
    console.error(e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
