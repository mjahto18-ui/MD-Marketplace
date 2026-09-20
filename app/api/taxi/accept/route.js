export const dynamic = "force-dynamic";
import { createClient } from "@supabase/supabase-js";
import { getPricingConfig, calculateFare } from "@/lib/taxi/pricingEngine";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

function getDriverEngineCode(driver, bundle) {
  const raw = driver?.Taxi_Engine || driver?.engine_cc || driver?.taxi_engine_cc || driver?.engine_code || driver?.Taxi_Engine_CC;
  if (!raw) return null;
  const code = String(raw).trim();
  if (bundle?.engines?.[code]) return code;
  const num = code.replace(/[^0-9]/g, '');
  if (bundle?.engines?.[num]) return num;
  const engines = bundle? Object.values(bundle.engines) : [];
  const byType = engines.find(e => e.vehicle_type === driver.vehicle_type);
  if (byType) return byType.code;
  return code;
}

export async function POST(req) {
  try {
    const supabase = getSupabase();
    const { order_id, taxi_id, userId } = await req.json();

    if (!order_id ||!taxi_id) return Response.json({ error: 'order_id & taxi_id required' }, { status: 400 });

    // ✅ التعديل هون - مناخد taxi_id منجيب يوزر ايدي من جدول users
    let realUserId = userId || null;

    if (!realUserId) {
      const { data: userRow } = await supabase
       .from('users')
       .select('id, Taxi_ID, taxi_id')
       .or(`Taxi_ID.eq.${taxi_id},taxi_id.eq.${taxi_id}`)
       .maybeSingle();

      if (userRow) {
        realUserId = userRow.id;
      } else {
        realUserId = taxi_id;
      }
    }

    // ✅ منحسب المحفظة دغري من wallet_transactions بدون fetch
    const { data: transData, error: transError } = await supabase
     .from('wallet_transactions')
     .select('*')
     .eq('"Owner User ID"', realUserId)
     .order('"Created At"', { ascending: false });

    if (transError) throw transError;

    let walletBalance = 0;
    (transData || []).forEach(r => {
      const amt = Number(r.Amount || 0);
      const type = String(r.Type || "").toUpperCase();
      if (type === 'DEDUCT' || type === 'CASH_OUT') {
        walletBalance -= amt;
      } else {
        walletBalance += amt;
      }
    });

    if (walletBalance < 50000) {
      return Response.json({ error: `رصيد المحفظة غير كافي - عندك ${walletBalance.toLocaleString()} ل.ل ولازم 50,000` }, { status: 402 });
    }

    const { data: order } = await supabase.from('taxi_orders').select('*').eq('id', order_id).single();
    if (!order || order.status!== 'pending') return Response.json({ error: 'الطلب لم يعد متاح' }, { status: 409 });
    if (!order.secret_code) return Response.json({ error: 'الطلب بدون كود - خلل' }, { status: 500 });

    const { data: driver } = await supabase
   .from('taxi_drivers')
   .select('Taxi_ID, full_name, phone, plate_number, car_type, vehicle_type, Taxi_Engine, engine_cc')
   .eq('Taxi_ID', taxi_id)
   .single();

    if (!driver) return Response.json({ error: 'السائق غير موجود' }, { status: 404 });

    let finalTotal = order.total_amount;
    let realEngine = null;
    let finalPricing = null;

    try {
      const bundle = await getPricingConfig();
      realEngine = getDriverEngineCode(driver, bundle) || '1500';

      let area = 'default';
      let cityKm = 0;
      let highwayKm = 0;
      let totalKm = Number(order.distance_traveled) || 0;

      try {
        const notes = order.customer_notes || '';
        const areaMatch = notes.match(/area:([^|]+)/);
        if (areaMatch) area = areaMatch[1].trim();
        const breakdownMatch = notes.match(/pricing:\s*(\{.*\})/);
        if (breakdownMatch) {
          const br = JSON.parse(breakdownMatch[1]);
          if (br.cityKm) cityKm = Number(br.cityKm);
          if (br.highwayKm) highwayKm = Number(br.highwayKm);
        }
      } catch {}

      if (!cityKm &&!highwayKm && totalKm) {
        cityKm = totalKm;
        highwayKm = 0;
      }

      finalPricing = calculateFare({
        cityKm,
        highwayKm,
        totalKm,
        engineCode: realEngine,
        area,
        vehicle_type: driver.vehicle_type || order.taxi_vehicle_type,
        routeKey: 'default',
        pricingBundle: bundle,
        isDriverAcceptance: true
      });

      finalTotal = finalPricing.customer_pays_lbp;

      if (order.taxi_vehicle_type === 'car' && finalTotal > order.total_amount) {
        finalTotal = order.total_amount;
      }

    } catch (e) {
      console.log('recalc fare failed, keep old total', e.message);
    }

    if (!realEngine) {
      const bundle2 = await getPricingConfig();
      realEngine = getDriverEngineCode(driver, bundle2) || order.taxi_engine_cc || '1500';
    }

    const { data: updated, error } = await supabase.from('taxi_orders').update({
      taxi_id,
      taxi_name: driver?.full_name,
      taxi_phone: driver?.phone,
      taxi_plate_number: driver?.plate_number,
      taxi_car_type: driver?.car_type,
      taxi_vehicle_type: driver?.vehicle_type || order.taxi_vehicle_type,
      taxi_engine_cc: realEngine,
      total_amount: finalTotal,
      status: 'accepted',
      taxi_status: 'on_the_way',
      customer_notes: `${order.customer_notes || ''} | accepted_with_engine:${realEngine} | final_fare:${finalTotal} | old_high:${order.total_amount}`,
      updated_at: new Date().toISOString()
    }).eq('id', order_id).select().single();

    if (error) throw error;

    await supabase.from('push_queue').insert({
      'Customer ID': updated.customer_id,
      Title: 'تم قبول طلبك',
      Message: `السائق ${driver?.full_name} في الطريق اليك - السعر النهائي ${finalTotal.toLocaleString()} ل.ل - كود الرحلة ${order.secret_code}`,
      Status: 'Pending',
      Code: 'TAXI_ACCEPTED'
    }).then(()=>{},()=>{});

    return Response.json({
      success: true,
      order: updated,
      secret_code: order.secret_code,
      old_total: order.total_amount,
      new_total: finalTotal,
      price_dropped: finalTotal < order.total_amount,
      driver_engine: realEngine
    });
  } catch (e) {
    console.error('accept error', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
