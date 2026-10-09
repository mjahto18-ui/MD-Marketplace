import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export async function POST(req){
  try{
    const { lat, lng } = await req.json();

    const { data: centers } = await supabase
     .from('geofence_centers')
     .select('id, name, center_lat, center_lng, radius_cart, radius_taxi')
     .eq('is_active', true);

    let nearest = null;
    let minDist = Infinity;

    for(let c of centers || []){
      const radius = Math.max(c.radius_cart || 5, c.radius_taxi || 5);
      const d = getDistance(lat, lng, c.center_lat, c.center_lng);
      if(d <= radius && d < minDist){
        minDist = d;
        nearest = c;
      }
    }

    if(!nearest){
      return Response.json({ found: false });
    }

    // 1- جرب يجيب مدير cart اول
    let { data: m } = await supabase
     .from('geofence_center_managers')
     .select('manager_name, manager_user_id')
     .eq('geofence_center_id', nearest.id)
     .eq('is_active', true)
     .eq('assigned_service', 'cart')
     .order('assigned_at', {ascending: false})
     .limit(1)
     .maybeSingle();

    // 2- اذا ما لقى cart، جيب اي مدير نشط لنفس البرج
    if(!m){
      const fallback = await supabase
        .from('geofence_center_managers')
        .select('manager_name, manager_user_id')
        .eq('geofence_center_id', nearest.id)
        .eq('is_active', true)
        .order('assigned_at', {ascending: false})
        .limit(1)
        .maybeSingle();
      m = fallback.data;
    }

    if(!m){
      return Response.json({ found: true, center: nearest.name, manager_phone: null });
    }

    const { data: u } = await supabase
     .from('users')
     .select('Mobile')
     .eq('"User ID"', m.manager_user_id)
     .maybeSingle();

    return Response.json({
      found: true,
      center: nearest.name,
      manager_name: m.manager_name,
      manager_phone: u?.Mobile || null
    });

  }catch(e){
    return Response.json({ error: e.message }, {status: 500});
  }
}
