// lib/taxi/pricingEngine.js - بيقرا من جدول taxi_pricing_config
import { supabase } from '@/lib/supabaseClient';

let cachedConfig = null;
let cacheTime = 0;

// 1. جيب التسعيرة من الداتا بيز
export async function getPricingConfig() {
  // كاش 5 دقايق مشان ما نضرب الداتا بيز كل سحبة
  if (cachedConfig && Date.now() - cacheTime < 5 * 60 * 1000) return cachedConfig;

  const { data, error } = await supabase
   .from('taxi_pricing_config')
   .select('*')
   .eq('is_active', true)
   .order('created_at', { ascending: false })
   .limit(1)
   .single();

  if (error ||!data) throw new Error('ما لقيت تسعيرة فعالة');

  cachedConfig = data;
  cacheTime = Date.now();
  return data;
}

// 2. هل هلأ نهار ولا ليل؟
function isNightNow(cfg) {
  const now = new Date();
  const timeStr = now.toTimeString().slice(0,8); // HH:MM:SS

  // اذا الليل بيقطع نص الليل: 22:00 -> 05:59
  if (cfg.night_start_time > cfg.night_end_time) {
    return timeStr >= cfg.night_start_time || timeStr <= cfg.night_end_time;
  }
  return timeStr >= cfg.night_start_time && timeStr <= cfg.night_end_time;
}

// 3. حساب السعر - هلأ بياخد config من الجدول
export function calculateFare({ cityKm, highwayKm, totalKm, isPrebooking = false, engineCC = '1200', routeKey = 'default', pricingConfig }) {
  const cfg = pricingConfig;
  if (!cfg) throw new Error('لازم تبعت pricingConfig');

  const isNight = isNightNow(cfg);
  const cityRate = isNight? cfg.city_per_km_night_lbp : cfg.city_per_km_day_lbp;

  // 1. أجرة الطريق
  let fare = cfg.base_fare_lbp + (cityKm * cityRate) + (highwayKm * cfg.highway_per_km_lbp);

  // 2. عامل المحرك من الـ jsonb
  const factors = cfg.engine_factors || {"1200":1};
  const factor = factors[engineCC] || factors['1200'] || 1.0;
  fare = fare * factor;

  // 3. أقل أجرة + سقف أقل أجرة (اذا المسافة اقل من 5كم)
  if (totalKm <= cfg.min_fare_max_km && fare < cfg.min_fare_lbp) {
    fare = cfg.min_fare_lbp;
  }
  if (fare < cfg.min_fare_lbp) fare = cfg.min_fare_lbp;

  // 4. سقف فرد سحبة
  const caps = cfg.city_caps_lbp || {default: cfg.min_fare_lbp * 15};
  const cap = caps[routeKey] || caps['default'];
  let isCapped = false;
  if (cap && fare > cap) {
    fare = cap;
    isCapped = true;
  }

  // 5. عمولة المنصة - هلأ نسبة مش مقطوعة
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
    commission_lbp: commission, // بينخصم من رصيد السايق
    driver_gets_cash_lbp: Math.round(fare), // بيقبضو كاش
    config_id: cfg.id
  };
}
