// lib/taxi/pricingEngine.js - نهائي 4 جداول بعد ما شلنا الفتحة من القديم
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

function getBaseFare(bundle, area, vehicle_type) {
  // 1. دور على المنطقة بالظبط
  let row = bundle.baseFares.find(r => r.area === area && r.vehicle_type === vehicle_type);
  if (row) return row.base_fare_lbp;

  // 2. دور على default
  row = bundle.baseFares.find(r => r.area === 'default' && r.vehicle_type === vehicle_type);
  if (row) return row.base_fare_lbp;

  // 3. اذا ما قرى الجدول منعطيه ديفولت - ما بيوقع
  if (vehicle_type === 'toktok') return 90000;
  if (vehicle_type === 'van' || vehicle_type === 'touristic_van' || vehicle_type === 'touristic_van_11') return 250000;
  if (vehicle_type === 'moto') return 80000;
  return 150000; // car
}

export function calculateFare({ cityKm, highwayKm, totalKm, engineCode = '1500', area = 'default', routeKey = 'default', pricingBundle }) {
  if (!pricingBundle) throw new Error('لازم تبعت pricingBundle');

  const { pricing, fuel, engines } = pricingBundle;
  const engine = engines[engineCode] || engines['1500'];
  if (!engine) throw new Error('ما لقيت محرك: ' + engineCode);

  const isNight = isNightNow(pricing);
  const cityProfit = isNight? pricing.city_per_km_night_lbp : pricing.city_per_km_day_lbp;
  const highwayProfit = pricing.highway_per_km_lbp;

  const fuelPerLiter = fuel.tank_price_lbp / Number(fuel.tank_liters);
  const fuelPerKm = Number(engine.consumption_l_per_km) * fuelPerLiter;

  const base = getBaseFare(pricingBundle, area, engine.vehicle_type);

  let fare = base +
    cityKm * (cityProfit * Number(engine.factor) + fuelPerKm) +
    highwayKm * (highwayProfit * Number(engine.factor) + fuelPerKm);

  // ❌ القديم - كان يخنق الموتو والتكتك
  // if (fare < pricing.min_fare_lbp) fare = pricing.min_fare_lbp;

  // ✅ الجديد - الحماية العادلة لكل فئة
  const baseFareRow = pricingBundle.baseFares.find(
    r => r.area === area && r.vehicle_type === engine.vehicle_type
  ) || pricingBundle.baseFares.find(
    r => r.area === 'default' && r.vehicle_type === engine.vehicle_type
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
      vehicle_type: engine.vehicle_type,
      engineCode,
      fuel_per_km: Math.round(fuelPerKm),
      tank_price: fuel.tank_price_lbp
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
