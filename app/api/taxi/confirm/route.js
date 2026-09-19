export const dynamic = "force-dynamic";
import { createClient } from "@supabase/supabase-js";
import { getNearbyDrivers } from "@/lib/taxi/nearby";

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
    const { draft_id, origin_lat, origin_lng, vehicle_type } = body;

    if (!draft_id) return Response.json({ error: 'draft_id required' }, { status: 400 });

    // جيب الدرافت قبل ما تحدث
    const { data: draft, error: draftErr } = await supabase.from('taxi_orders').select('*').eq('id', draft_id).single();
    if (draftErr) throw draftErr;
    if (!draft) return Response.json({ error: 'draft not found' }, { status: 404 });

    // خلق سكرت كود مع الطلب - مش لما يوافق السايق
    const secret_code = draft.secret_code || Math.floor(1000 + Math.random() * 9000).toString();

    // حول draft -> pending + سكرت كود
    const { data: order, error: orderErr } = await supabase
      .from('taxi_orders')
      .update({ 
        status: 'pending',
        secret_code: secret_code,
        is_code_verified: false,
        // تأكد الاحداثيات موجودة
        origin_lat: draft.origin_lat || origin_lat,
        origin_lng: draft.origin_lng || origin_lng,
        taxi_vehicle_type: draft.taxi_vehicle_type || vehicle_type || 'car',
        updated_at: new Date().toISOString()
      })
      .eq('id', draft_id)
      .select()
      .single();
    
    if (orderErr) throw orderErr;

    // فلتر 5 كيلو + محفظة + اونلاين مثل الدلفري
    let nearby = await getNearbyDrivers(supabase, { 
      origin_lat: order.origin_lat, 
      origin_lng: order.origin_lng, 
      vehicle_type: order.taxi_vehicle_type, 
      radiusKm: 5 
    });
    
    // اذا ما لقينا ب 5 كم منوسع ل 10
    let radius = 5;
    if (nearby.length === 0) {
      nearby = await getNearbyDrivers(supabase, { 
        origin_lat: order.origin_lat, 
        origin_lng: order.origin_lng, 
        vehicle_type: order.taxi_vehicle_type, 
        radiusKm: 10 
      });
      radius = 10;
    }

    // ابعت Push للسواقين
    if (nearby.length > 0) {
      const pushRows = nearby.map(d => ({
        Title: 'طلب تاكسي جديد قريب منك',
        Message: `${order.origin_name || 'موقع'} -> ${order.dest_name || 'وجهة'} - ${order.taxi_vehicle_type} - ${order.total_amount?.toLocaleString() || ''} ل.ل - على بعد ${d.distance_km.toFixed(1)} كم - كود: ${secret_code}`,
        Status: 'Pending',
        Code: 'TAXI_NEW_REQUEST',
        'Order ID': order.id,
        'Customer ID': d.Taxi_ID
      }));
      
      // حاول push_queue - اذا فشل ما منوقف الطلب
      await supabase.from('push_queue').insert(pushRows).then(()=>{},(e)=>{ console.log('push_queue error', e.message) });
    }

    return Response.json({ 
      success: true, 
      order: { ...order, secret_code }, // رجع الكود للزبون دغري
      nearby_count: nearby.length, 
      radius_used_km: radius, 
      drivers: nearby.map(d => ({ id: d.Taxi_ID, name: d.full_name, distance_km: d.distance_km.toFixed(2) })) 
    });

  } catch (e) {
    console.error('confirm error', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
