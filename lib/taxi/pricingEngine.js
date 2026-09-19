// lib/taxi/pricingEngine.js - نظام جديد 3 جداول - بنزين + محركات + تسعيرة
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url ||!key) throw new Error('ناقص NEXT_PUBLIC_SUPABASE_URL / ANON_KEY');
  return createClient(url, key);
}

let cache = { data: null, time: 0 };

// بيجيب الـ 3 جداول مرة وحدة
export async function getPricingConfig() {
  if (cache.data && Date.now() - cache.time < 5 * 60 * 1000) return cache.data;

  const supabase = getSupabase();

  const [pricingRes, fuelRes, enginesRes] = await Promise.all([
    supabase.from('taxi_pricing_config').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1).single(),
    supabase.from('taxi_fuel_config').select('*').eq('is_active', true).order('effective_date', { ascending: false }).limit(1).single(),
    supabase.from('taxi_engines').select('*').eq('is_active', true)
  ]);

  if (pricingRes.error) throw new Error('pricing: ' + pricingRes.error.message);
  if (fuelRes.error) throw new Error('fuel: ' + fuelRes.error.message);

  const bundle = {
    pricing: pricingRes.data,
    fuel: fuelRes.data,
    engines: Object.fromEntries(enginesRes.data.map(e => [e.code, e]))
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

export function calculateFare({ cityKm, highwayKm, totalKm, engineCode = '1200', routeKey = 'default', pricingBundle }) {
  if (!pricingBundle) throw new Error('لازم تبعت pricingBundle من getPricingConfig()');

  const { pricing, fuel, engines } = pricingBundle;
  const engine = engines[engineCode] || engines['1200'];
  if (!engine) throw new Error('ما لقيت محرك: ' + engineCode);

  const isNight = isNightNow(pricing);
  const cityProfit = isNight? pricing.city_per_km_night_lbp : pricing.city_per_km_day_lbp;
  const highwayProfit = pricing.highway_per_km_lbp;

  const fuelPerLiter = fuel.tank_price_lbp / Number(fuel.tank_liters); // 2790000/20 = 139500
  const fuelPerKm = Number(engine.consumption_l_per_km) * fuelPerLiter;

  // فتحة العداد حسب النوع
  let base = engine.base_fare_lbp;
  if (!base) {
    if (engine.vehicle_type === 'tuktuk') base = pricing.base_fare_tuktuk_lbp;
    else if (engine.vehicle_type === 'moto') base = pricing.base_fare_moto_lbp;
    else base = pricing.base_fare_car_lbp;
  }

  // الأجرة = فتحة + (ربح*عامل + بنزين) * كم
  let fare = base +
    cityKm * (cityProfit * Number(engine.factor) + fuelPerKm) +
    highwayKm * (highwayProfit * Number(engine.factor) + fuelPerKm);

  if (fare < pricing.min_fare_lbp) fare = pricing.min_fare_lbp;

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
      vehicle_type: engine.vehicle_type,
      engineCode,
      fuel_per_liter: Math.round(fuelPerLiter),
      fuel_per_km: Math.round(fuelPerKm),
      profit_per_km: Math.round(cityProfit * Number(engine.factor)),
      tank_price: fuel.tank_price_lbp,
      effective_date: fuel.effective_date,
      price_usd: fuel.price_usd
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
