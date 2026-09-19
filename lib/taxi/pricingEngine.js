// lib/taxi/pricingEngine.js - بيقرا من جدول taxi_pricing_config - لبناني
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url ||!key) throw new Error('ناقص NEXT_PUBLIC_SUPABASE_URL / ANON_KEY');
  return createClient(url, key);
}

let cachedConfig = null;
let cacheTime = 0;

export async function getPricingConfig() {
  if (cachedConfig && Date.now() - cacheTime < 5 * 60 * 1000) return cachedConfig;

  const supabase = getSupabase();
  const { data, error } = await supabase
   .from('taxi_pricing_config')
   .select('*')
   .eq('is_active', true)
   .order('created_at', { ascending: false })
   .limit(1)
   .single();

  if (error ||!data) throw new Error('ما لقيت تسعيرة فعالة: ' + error?.message);

  cachedConfig = data;
  cacheTime = Date.now();
  return data;
}

function isNightNow(cfg) {
  const now = new Date().toTimeString().slice(0, 8);
  // الليل بيقطع نص الليل 22:00 -> 05:59
  if (cfg.night_start_time > cfg.night_end_time) {
    return now >= cfg.night_start_time || now <= cfg.night_end_time;
  }
  return now >= cfg.night_start_time && now <= cfg.night_end_time;
}

export function calculateFare({ cityKm, highwayKm, totalKm, engineCC = '1200', routeKey = 'default', pricingConfig }) {
  const cfg = pricingConfig;
  if (!cfg) throw new Error('لازم تبعت pricingConfig');

  const isNight = isNightNow(cfg);
  const cityRate = isNight? cfg.city_per_km_night_lbp : cfg.city_per_km_day_lbp;

  let fare = cfg.base_fare_lbp + (cityKm * cityRate) + (highwayKm * cfg.highway_per_km_lbp);

  const factors = cfg.engine_factors || { "1200": 1 };
  const factor = factors[engineCC] || factors['1200'] || 1.0;
  fare = fare * factor;

  if (totalKm <= Number(cfg.min_fare_max_km) && fare < cfg.min_fare_lbp) fare = cfg.min_fare_lbp;
  if (fare < cfg.min_fare_lbp) fare = cfg.min_fare_lbp;

  const caps = cfg.city_caps_lbp || {};
  const cap = caps[routeKey] || caps['default'];
  let isCapped = false;
  if (cap && fare > cap) {
    fare = cap;
    isCapped = true;
  }

  const commission = Math.round(fare * (cfg.default_commission_percent / 100));

  return {
    customer_pays_lbp: Math.round(fare),
    isNight,
    breakdown: {
      base: cfg.base_fare_lbp,
      city: Math.round(cityKm * cityRate * factor),
      highway: Math.round(highwayKm * cfg.highway_per_km_lbp * factor),
      engine_factor: factor,
      engineCC,
      rate_used: cityRate,
    },
    cityKm, highwayKm, totalKm,
    isCapped,
    capApplied: isCapped? cap : null,
    commission_lbp: commission,
    driver_gets_cash_lbp: Math.round(fare),
    config_id: cfg.id
  };
}
