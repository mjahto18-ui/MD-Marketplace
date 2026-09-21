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

    // ⛔ منع طلب تاني
    const { data: active } = await supabase.from('taxi_orders').select('id, order_code').eq('taxi_id', taxi_id).in('status',['accepted','on_the_way','arrived','code_verified','in_progress']).limit(1).maybeSingle();
    if(active) return Response.json({ error: `عندك طلب شغال #${active.order_code||''} - خلصو اول` }, { status: 409 });

    // ✅ 1- taxi_id جاي uuid من taxi_drivers
    // منجيب اليوزر الي مربوط فيه من جدول users."Taxi_ID"
    let ownerUserId = userId || null;

    if (!ownerUserId) {
      const { data: userRow, error: userErr } = await supabase
    .from('users')
    .select('"User ID", "Taxi_ID"')
    .eq('"Taxi_ID"', taxi_id)
    .maybeSingle();

      if (userErr) throw userErr;

      if (userRow) {
        ownerUserId = userRow["User ID"];
      }
    }

    if (!ownerUserId) {
      return Response.json({ error: `ما لقيت يوزر مربوط بهالتاكسي ${taxi_id} بجدول users` }, { status: 404 });
    }

    // ✅ 2- منحسب المحفظة من wallet_transactions."Owner User ID" = users."User ID" - بس تشييك بدون خصم
    const { data: transData, error: transError } = await supabase
  .from('wallet_transactions')
  .select('"Amount", "Type"')
  .eq('"Owner User ID"', ownerUserId)
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

    if (walletBalance < 300000) {
      return Response.json({ error: `رصيد المحفظة غير كافي - عندك ${walletBalance.toLocaleString()} ل.ل الحد الادنى 300,000` }, { status: 402 });
    }

    const { data: order } = await supabase.from('taxi_orders').select('*').eq('id', order_id).single();
    if (!order || order.status!== 'pending') return Response.json({ error: 'الطلب لم يعد متاح' }, { status: 409 });
    if (!order.secret_code) return Response.json({ error: 'الطلب بدون كود - خلل' }, { status: 500 });

    const { data: driver } = await supabase
.from('taxi_drivers')
.select('"Taxi_ID", full_name, phone, plate_number, car_type, vehicle_type, engine_cc, seats, car_color')
.eq('"Taxi_ID"', taxi_id)
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
      taxi_seats: driver?.seats || 4, // ✅ هيك بيجي 4 مش null
      taxi_car_color: driver?.car_color || null, // ✅ هلق بيجي اللون اذا ضفت العمود
      total_amount: finalTotal,
      status: 'accepted',
      taxi_status: 'on_the_way',
      customer_notes: `${order.customer_notes || ''} | accepted_with_engine:${realEngine} | final_fare:${finalTotal} | old_high:${order.total_amount}`,
      updated_at: new Date().toISOString()
    }).eq('id', order_id).select().single();

       if (error) throw error;

    // --- هون الفيكس تبعك ---
    // 1- منجيب User ID تبع الزبون من Customer ID
    let customerUserId = null;
    try {
      // جرب من جدول users
      const { data: custUser } = await supabase.from('users').select('"User ID"').eq('"Customer ID"', updated.customer_id).maybeSingle();
      if (custUser) customerUserId = custUser["User ID"];
      if (!customerUserId) {
        // جرب من جدول customers اذا فيه عمود User ID
        const { data: custRow } = await supabase.from('customers').select('"User ID"').eq('"Customer ID"', updated.customer_id).maybeSingle();
        if (custRow) customerUserId = custRow["User ID"];
      }
      // اذا بعده فاضي، جرب مباشرة User ID = Customer ID (مثل ما عندك بالداتا 5555 مربوط ب b530c8aa لازم يلاقيه فوق)
      if (!customerUserId) {
        const { data: directUser } = await supabase.from('users').select('"User ID"').eq('"User ID"', updated.customer_id).maybeSingle();
        if (directUser) customerUserId = directUser["User ID"];
      }
    } catch(e){ console.log('get customer user id failed', e.message) }

    const fullMsg = `السائق ${driver?.full_name} في الطريق اليك - السعر النهائي ${finalTotal.toLocaleString()} ل.ل - كود الرحلة ${order.secret_code}`;

    // 2- push_queue = بس الكود + مع User ID مشان توصل
    await supabase.from('push_queue').insert({
      'Customer ID': updated.customer_id,
      'User ID': customerUserId, // هون صار ينسخ User ID
      'Title': 'تم قبول طلبك',
      'Message': order.secret_code, // هون بس الكود
      'Status': 'Pending',
      'Code': 'TAXI_ACCEPTED'
    }).then(()=>{},(e)=>{ console.log('push_queue insert err', e.message) });

    // 3- webhook = المسج الكامل + بس Customer ID
    await supabase.from('webhook').insert({
      'Customer ID': updated.customer_id,
      'Title': 'تم قبول طلبك',
      'Message': fullMsg,
      'Date': new Date().toISOString()
    }).then(()=>{},(e)=>{ console.log('webhook insert err', e.message) });

    

    return Response.json({
      success: true,
      order: updated,
      secret_code: order.secret_code,
      old_total: order.total_amount,
      new_total: finalTotal,
      price_dropped: finalTotal < order.total_amount,
      driver_engine: realEngine,
      wallet: walletBalance
    });
  } catch (e) {
    console.error('accept error', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
