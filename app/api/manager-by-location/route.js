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
    const { lat, lng, service = 'cart' } = await req.json(); // cart او taxi

    if(!lat || !lng) return Response.json({ found: false, reason: 'no lat lng' });

    const { data: centers } = await supabase
     .from('geofence_centers')
     .select('id, name, center_lat, center_lng, radius_cart, radius_taxi, cart_enabled, taxi_enabled')
     .eq('is_active', true);

    let nearest = null;
    let minDist = Infinity;

    for(let c of centers || []){
      // اذا طالب cart و cart مسكر تخطاه
      if(service === 'cart' && c.cart_enabled === false) continue;
      if(service === 'taxi' && c.taxi_enabled === false) continue;
      
      const radius = service === 'taxi' ? (c.radius_taxi || 3) : (c.radius_cart || 1);
      const d = getDistance(lat, lng, c.center_lat, c.center_lng);
      if(d <= radius && d < minDist){
        minDist = d;
        nearest = c;
      }
    }

    if(!nearest){
      return Response.json({ found: false, reason: 'out of all geofences' });
    }

    // 1- جرب يجيب مدير حسب الخدمة المطلوبة
    let { data: m } = await supabase
     .from('geofence_center_managers')
     .select('manager_name, manager_user_id, assigned_service')
     .eq('geofence_center_id', nearest.id)
     .eq('is_active', true)
     .eq('assigned_service', service)
     .order('assigned_at', {ascending: false})
     .limit(1)
     .maybeSingle();

    // 2- اذا ما لقى، جيب اي مدير نشط لنفس البرج (شخصين بنفس البرج)
    if(!m){
      const { data: fb } = await supabase
        .from('geofence_center_managers')
        .select('manager_name, manager_user_id, assigned_service')
        .eq('geofence_center_id', nearest.id)
        .eq('is_active', true)
        .order('assigned_at', {ascending: false})
        .limit(1)
        .maybeSingle();
      m = fb;
    }

    if(!m){
      return Response.json({ found: true, center: nearest.name, center_id: nearest.id, manager_phone: null, reason: 'no manager' });
    }

    // هون التصليح الاساسي - بدون كوتس مضاعفة
    const { data: u } = await supabase
     .from('users')
     .select('Mobile, "WhatsApp Number", Name')
     .eq('User ID', m.manager_user_id) // هيك الصح
     .maybeSingle();

    // اذا ما لقى بالـ User ID جرب بالـ supa_id او بالاسم
    let phone = u?.Mobile || u?.["【entity-WhatsApp¦canonical_name=WhatsApp】 Number"] || null;
    
    if(!phone && m.manager_user_id){
       // fallback - اذا manager_user_id محفوظ غلط كـ supa_id
       const { data: u2 } = await supabase.from('users').select('Mobile, "WhatsApp Number"').eq('supa_id', m.manager_user_id).maybeSingle();
       phone = u2?.Mobile || u2?.["WhatsApp Number"] || null;
    }

    return Response.json({
      found: true,
      center: nearest.name,
      center_id: nearest.id,
      distance_km: Number(minDist.toFixed(3)),
      manager_name: m.manager_name || u?.Name || 'مسؤول البرج',
      manager_phone: phone,
      assigned_service: m.assigned_service
    });

  }catch(e){
    console.error('manager-by-location error', e);
    return Response.json({ error: e.message, found: false }, {status: 500});
  }
}
