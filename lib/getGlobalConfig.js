export const dynamic = "force-dynamic";
import { createClient } from '@supabase/supabase-js';

let cache = { data: null, time: 0 };
const TTL = 10 * 1000;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

export async function getGlobalConfig() {
  const now = Date.now();
  if (cache.data && (now - cache.time) < TTL) {
    return cache.data;
  }

  try {
    const supabase = getSupabase();

    // MD_Global_Control!A2:E20 -> جدول global_config
    const { data: rows, error } = await supabase.from('global_config').select('*').limit(20);

    if (error) throw error;

    let cfg = {};
    (rows||[]).forEach(r => {
      // صغيرة + كبيرة fallback
      const kRaw = (r['key'] || r['Key'] || r[0] || '').toString().trim();
      if(!kRaw) return;
      const k = kRaw.toUpperCase();
      const vRaw = (r['value'] || r['Value'] || r['raw_value'] || r[1] || '').toString().trim();
      const v = vRaw.toUpperCase();
      let m = (r['message'] || r['Message'] || r['message_ar'] || r[2] || '').toString().trim();
      if(m.toUpperCase() === 'TRUE' || m.toUpperCase() === 'FALSE') m = "";
      const d = (r['extra'] || r['Extra'] || r[3] || '').toString().trim();
      cfg[k] = { raw: vRaw, value: v, message: m, extra: d };
    });

    const parseTime = (t) => {
      if(!t) return null;
      const [h, m] = t.split(':').map(Number);
      if(isNaN(h) || isNaN(m)) return null;
      return h * 60 + m;
    };

    const beirutNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Beirut" }));
    const nowMinutes = beirutNow.getHours() * 60 + beirutNow.getMinutes();

    const cartOpen = parseTime(cfg['CART_OPEN_TIME']?.raw);
    const cartClose = parseTime(cfg['CART_CLOSE_TIME']?.raw);
    const whatsappCartOpen = parseTime(cfg['WHATSAPP_CART_OPEN']?.raw);
    const whatsappCartClose = parseTime(cfg['WHATSAPP_CART_CLOSE']?.raw);

    const isCartInHours = cartOpen!== null && cartClose!== null? (nowMinutes >= cartOpen && nowMinutes <= cartClose) : true;
    const isWhatsappCartInHours = whatsappCartOpen!== null && whatsappCartClose!== null? (nowMinutes >= whatsappCartOpen && nowMinutes <= whatsappCartClose) : true;

    const result = {
      rawConfig: cfg,
      isCartClosed: cfg['CART_ENABLED']?.value === 'FALSE',
      isComingSoon: cfg['PLATFORM_STATUS']?.value === 'COMING_SOON',
      isLocked: cfg['EMERGENCY_LOCK']?.value === 'TRUE',

      coming_soon_message: cfg['PLATFORM_STATUS']?.message || "",
      coming_soon: cfg['PLATFORM_STATUS'],
      countdown_date: cfg['COUNTDOWN_DATE']?.raw || "",
      banner_enabled: cfg['BANNER_ENABLED']?.value === 'TRUE',
      isBannerEnabled: cfg['BANNER_ENABLED']?.value === 'TRUE',

      cart_open_time: cfg['CART_OPEN_TIME']?.raw || '08:00',
      cart_close_time: cfg['CART_CLOSE_TIME']?.raw || '22:00',
      isCartInHours,

      isWhatsappEnabled: cfg['WHATSAPP_ENABLED']?.value!== 'FALSE',
      isWhatsappCartClosed: cfg['WHATSAPP_CART_ENABLED']?.value === 'FALSE',
      whatsapp_open_time: cfg['WHATSAPP_CART_OPEN']?.raw || '08:00',
      whatsapp_close_time: cfg['WHATSAPP_CART_CLOSE']?.raw || '22:00',
      isWhatsappCartInHours,

      cart_closed_message: cfg['CART_ENABLED']?.message || "",
      emergency_lock: cfg['EMERGENCY_LOCK'],
      emergency_lock_message: cfg['EMERGENCY_LOCK']?.message || "",
      whatsapp_disabled_message: cfg['WHATSAPP_ENABLED']?.message || "نعتذر الخدمة غير متاحة اليوم، نعود غداً ❤",
      whatsapp_cart_closed_message: cfg['WHATSAPP_CART_ENABLED']?.message || "سلة الواتساب مغلقة مؤقتاً",

      cart_enabled: cfg['CART_ENABLED'],
      whatsapp_enabled: cfg['WHATSAPP_ENABLED'],
      whatsapp_cart_enabled: cfg['WHATSAPP_CART_ENABLED'],
      platform_status: cfg['PLATFORM_STATUS'],
    };

    cache = { data: result, time: now };
    return result;

  } catch (e) {
    console.log("GlobalConfig Error:", e.message);
    if (cache.data) return cache.data;
    return {
      isCartClosed: false,
      isLocked: false,
      isComingSoon: false,
      isWhatsappEnabled: true,
      isWhatsappCartClosed: false,
      isCartInHours: true,
      isWhatsappCartInHours: true,
      coming_soon_message: "",
      cart_closed_message: "",
    };
  }
}
