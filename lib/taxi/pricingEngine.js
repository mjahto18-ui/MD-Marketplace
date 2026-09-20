// lib/taxi/pricingEngine.js - نهائي 4 جداول - مصلح toktok/tuktuk و van + أعلى CC للدرافت
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url ||!key) throw new Error('ناقص NEXT_PUBLIC_SUPABASE_URL / ANON_KEY');
  return createClient(url, key);
}

let cache = { data: null, time: 0 };

export async function getPricingConfig() {
  if (cache.data && Date.now() - cache.time < 5 * 60 * 1000) return cache.data;
  const supabase = getSupabase();
  const [pricingRes, fuelRes, enginesRes, baseFaresRes] = await Promise.all([
    supabase.from('taxi_pricing_config').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1).single(),
    supabase.from('taxi_fuel_config').select('*').eq('is_active', true).order('effective_date', { ascending: false }).limit(1).single(),
    supabase.from('taxi_engines').select('*').eq('is_active', true),
    supabase.from('taxi_base_fares').select('*').eq('is_active', true)
  ]);
  if (pricingRes.error) throw new Error('pricing: ' + pricingRes.error.message);
  if (fuelRes.error) throw new Error('fuel: ' + fuelRes.error.message);
  const bundle = {
    pricing: pricingRes.data,
    fuel: fuelRes.data,
    engines: Object.fromEntries(enginesRes.data.map(e => [e.code, e])),
    enginesList: enginesRes.data, // مهم للبحث عن الأعلى
    baseFares: baseFaresRes.data || []
  };
  cache = { data: bundle, time: Date.now() };
  return bundle;
}

function isNightNow(cfg) {
  const now = new Date().toTimeString().slice(0, 8);
  if (cfg.night_start_time > cfg.night_end_time) {
    return now >= cfg.night_start_time || now <= cfg.night_end_time;
  }
  return now >= cfg.night_start_time && now <= cfg.night_end_time;
}

function normalizeVehicleType(t) {
  if (!t) return 'car';
  const v = String(t).toLowerCase();
  if (v === 'tuktuk') return 'toktok';
  if (v === 'touristic_van' || v === 'touristic_van_11') return 'van';
  if (v === 'moto' || v === 'motor' || v === 'motorcycle') return 'moto';
  return v;
}

function getHighestEngineCode(bundle, requestedType) {
  const vt = normalizeVehicleType(requestedType);
  // فلتر المحركات حسب نوع المركبة
  let candidates = bundle.enginesList.filter(e => normalizeVehicleType(e.vehicle_type) === vt);
  // إذا ما لقى للـ van/toktok، خد كل محركات car كـ fallback للـ car
  if (candidates.length === 0 && vt === 'car') {
    candidates = bundle.enginesList.filter(e => normalizeVehicleType(e.vehicle_type) === 'car');
  }
  if (candidates.length === 0) candidates = bundle.enginesList;
  // رتب من الأعلى للأوطى (factor + consumption)
  candidates.sort((a,b) => {
    if (Number(b.factor)!== Number(a.factor)) return Number(b.factor) - Number(a.factor);
    return Number(b.consumption_l_per_km) - Number(a.consumption_l_per_km);
  });
  return candidates[0]?.code || '2500'; // fallback نهائي
}

function getBaseFare(bundle, area, vehicle_type) {
  const vt = normalizeVehicleType(vehicle_type);
  let row = bundle.baseFares.find(r => r.area === area && normalizeVehicleType(r.vehicle_type) === vt);
  if (row) return row.base_fare_lbp;
  row = bundle.baseFares.find(r => r.area === 'default' && normalizeVehicleType(r.vehicle_type) === vt);
  if (row) return row.base_fare_lbp;
  if (vt === 'toktok') return 90000;
  if (vt === 'van') return 250000;
  if (vt === 'moto') return 80000;
  return 150000;
}

export function calculateFare({ cityKm, highwayKm, totalKm, engineCode, area = 'default', vehicle_type, routeKey = 'default', pricingBundle, isDriverAcceptance = false }) {
  if (!pricingBundle) throw new Error('لازم تبعت pricingBundle');
  const { pricing, fuel, engines } = pricingBundle;

  const requestedType = normalizeVehicleType(vehicle_type || 'car');

  // ✅ المنطق الجديد:
  // - درافت (isDriverAcceptance = false) -> دايما أعلى CC
  // - قبول شوفير (isDriverAcceptance = true) -> استعمل محرك الشوفير الصح
  let finalEngineCode;
  if (isDriverAcceptance && engineCode && engines[engineCode]) {
    finalEngineCode = engineCode; // محرك الشوفير يلي وافق
  } else {
    finalEngineCode = getHighestEngineCode(pricingBundle, requestedType); // أعلى CC
  }

  const engine = engines[finalEngineCode];
  if (!engine) throw new Error('ما لقيت محرك: ' + finalEngineCode);

  const isNight = isNightNow(pricing);
  const cityProfit = isNight? pricing.city_per_km_night_lbp : pricing.city_per_km_day_lbp;
  const highwayProfit = pricing.highway_per_km_lbp;
  const fuelPerLiter = fuel.tank_price_lbp / Number(fuel.tank_liters);
  const fuelPerKm = Number(engine.consumption_l_per_km) * fuelPerLiter;
  const base = getBaseFare(pricingBundle, area, requestedType);

  let fare = base +
    cityKm * (cityProfit * Number(engine.factor) + fuelPerKm) +
    highwayKm * (highwayProfit * Number(engine.factor) + fuelPerKm);

  const baseFareRow = pricingBundle.baseFares.find(
    r => r.area === area && normalizeVehicleType(r.vehicle_type) === requestedType
  ) || pricingBundle.baseFares.find(
    r => r.area === 'default' && normalizeVehicleType(r.vehicle_type) === requestedType
  );
  const finalMinFare = baseFareRow?.min_fare_lbp || pricing.min_fare_lbp;
  if (fare < finalMinFare) fare = finalMinFare;

  const caps = pricing.city_caps_lbp || {};
  const cap = caps[routeKey] || caps['default'];
  let isCapped = false;
  if (cap && fare > cap) { fare = cap; isCapped = true; }

  const commission = Math.round(fare * (pricing.default_commission_percent / 100));

  return {
    customer_pays_lbp: Math.round(fare),
    isNight,
    breakdown: {
      base,
      area,
      vehicle_type: requestedType,
      engineCode: finalEngineCode, // الكود الفعلي المستعمل
      engine_vehicle_type: engine.vehicle_type,
      fuel_per_km: Math.round(fuelPerKm),
      tank_price: fuel.tank_price_lbp,
      pricing_mode: isDriverAcceptance? 'driver_engine' : 'highest_cc_draft'
    },
    cityKm, highwayKm, totalKm,
    isCapped,
    capApplied: isCapped? cap : null,
    commission_lbp: commission,
    driver_gets_cash_lbp: Math.round(fare),
    config_id: pricing.id,
    fuel_id: fuel.id
  };
}
