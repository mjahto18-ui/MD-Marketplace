// lib/taxi/pricingEngine.js - معزول 100% - حساب السعر فقط
// الخريطة بتبعتو {totalKm, cityKm, highwayKm} وهو بيرجع السعر مفصل

// الإعدادات - غير الأرقام من هون بس، ما بتلمس الكود
export const PRICING_CONFIG = {
  base_fare: 1.00, // فتحة عداد
  city_per_km: 1.20, // بلد
  highway_per_km: 0.60, // أوتوستراد
  prebooking_extra: 2.00, // زيادة الحجز المسبق
  night_extra: 1.00, // زيادة ليلي (اختياري)
  min_fare: 3.00, // أقل أجرة
  // سقف فرد سحبة - مصفوفة 8 مدن
  city_caps: {
    'beirut-tripoli': 35,
    'beirut-saida': 25,
    // ضيف باقي المدن هون
    default: 50
  },
  // عامل قوة المحرك
  engine_factors: {
    '1200': 1.0, // اقتصادية
    '1500': 1.1,
    '2000': 1.2, // كبيرة
    '2500': 1.4
  },
  // حق المنصة المقطوع من رصيد السائق
  platform_fee: 0.50
};

export function calculateFare({ cityKm, highwayKm, totalKm, isPrebooking = false, isNight = false, engineCC = '1200', routeKey = 'default' }) {
  const cfg = PRICING_CONFIG;

  // 1. أجرة الطريق
  let fare = cfg.base_fare + (cityKm * cfg.city_per_km) + (highwayKm * cfg.highway_per_km);

  // 2. عامل المحرك
  const factor = cfg.engine_factors[engineCC] || 1.0;
  fare = fare * factor;

  // 3. إضافات
  if (isPrebooking) fare += cfg.prebooking_extra;
  if (isNight) fare += cfg.night_extra;

  // 4. أقل أجرة
  if (fare < cfg.min_fare) fare = cfg.min_fare;

  // 5. سقف فرد سحبة (اذا المسافة طويلة بين المدن)
  const cap = cfg.city_caps[routeKey] || cfg.city_caps.default;
  let isCapped = false;
  if (fare > cap) {
    fare = cap;
    isCapped = true;
  }

  // 6. حق المنصة (ما بينخصم من الزبون، بينخصم من رصيد السائق)
  const platformFee = cfg.platform_fee;

  return {
    // يلي بيدفعو الزبون كاش للسائق
    customer_pays: Number(fare.toFixed(2)),
    // تفصيل للزبون
    breakdown: {
      base: cfg.base_fare,
      city: Number((cityKm * cfg.city_per_km * factor).toFixed(2)),
      highway: Number((highwayKm * cfg.highway_per_km * factor).toFixed(2)),
      engine_factor: factor,
      prebooking: isPrebooking ? cfg.prebooking_extra : 0,
      night: isNight ? cfg.night_extra : 0,
    },
    cityKm, highwayKm, totalKm,
    isCapped,
    capApplied: isCapped ? cap : null,
    // يلي بينخصم من رصيد السائق
    platform_fee: platformFee,
    // صافي ربح السائق كاش = customer_pays (هو بيقبضو) - platform_fee (دفعو سلف)
    driver_net_cash: Number(fare.toFixed(2)), // هو بيقبض هالمبلغ كاش
    driver_balance_deduct: platformFee
  };
}

// مثال:
// const distanceFromMap = { totalKm: 15.2, cityKm: 7, highwayKm: 8.2 }
// calculateFare({ ...distanceFromMap, isPrebooking: true, engineCC: '1200' })
