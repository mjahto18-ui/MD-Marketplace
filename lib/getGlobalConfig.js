export const dynamic = "force-dynamic";
import { getSupabase as getSupabaseLib } from "@/lib/supabase";

// ===== كاش واحد - 15 ثانية - بمحل واحد بس =====
let cacheData = null;
let cacheTime = 0;
const CACHE_TTL = 15 * 1000; // 15 ثانية

export async function getGlobalConfig() {
  try {
    // 1. إذا في كاش وأقل من 15 ثانية - رجعو فوراً (5ms)
    if (cacheData && Date.now() - cacheTime < CACHE_TTL) {
      return cacheData;
    }

    const supabase = getSupabaseLib();

    const { data: rows, error } = await supabase
    .from('md_global_control')
    .select('"Key", "Value", "Message_ar"')
    .limit(100);

    if (error) throw error;

    const cfg = {};
    for (const r of rows || []) {
      const key = (r.Key || '').trim().toLowerCase();
      if (!key) continue;
      cfg[key] = {
        value: (r.Value || '').trim(),
        message: (r.Message_ar || '').trim(),
      };
    }

    const getVal = (k) => (cfg[k]?.value || '').toUpperCase();
    const getMsg = (k) => cfg[k]?.message || '';

    // 2. الوقت ببيروت - ضروري لأن السلة بتوقيت لبنان
    const beirutNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Beirut" }));
    const now = beirutNow.getHours() * 60 + beirutNow.getMinutes();

    const toMin = (t) => {
      if (!t) return null;
      const [h, m] = t.split(':').map(Number);
      if (isNaN(h) || isNaN(m)) return null;
      return h * 60 + m;
    };

    const cartOpen = toMin(cfg['cart_open_time']?.value);
    const cartClose = toMin(cfg['cart_close_time']?.value);
    const waOpen = toMin(cfg['whatsapp_cart_open']?.value);
    const waClose = toMin(cfg['whatsapp_cart_close']?.value);

    const result = {
      isCartClosed: getVal('cart_enabled') === 'FALSE',
      isComingSoon: getVal('platform_status') === 'COMING_SOON',
      isLocked: getVal('emergency_lock') === 'TRUE',

      coming_soon_message: getMsg('platform_status'),
      cart_closed_message: getMsg('cart_enabled'),
      emergency_lock_message: getMsg('emergency_lock'),
      whatsapp_disabled_message: getMsg('whatsapp_enabled') || "نعتذر الخدمة غير متاحة اليوم، نعود غداً ❤",
      whatsapp_cart_closed_message: getMsg('whatsapp_cart_enabled') || "سلة الواتساب مغلقة مؤقتاً",

      cart_open_time: cfg['cart_open_time']?.value || '08:00',
      cart_close_time: cfg['cart_close_time']?.value || '22:00',
      whatsapp_open_time: cfg['whatsapp_cart_open']?.value || '08:00',
      whatsapp_close_time: cfg['whatsapp_cart_close']?.value || '22:00',

      isCartInHours: cartOpen!== null && cartClose!== null? (now >= cartOpen && now <= cartClose) : true,
      isWhatsappCartInHours: waOpen!== null && waClose!== null? (now >= waOpen && now <= waClose) : true,

      isBannerEnabled: getVal('banner_enabled') === 'TRUE',
      banner_enabled: getVal('banner_enabled') === 'TRUE',
      isWhatsappEnabled: getVal('whatsapp_enabled')!== 'FALSE',
      isWhatsappCartClosed: getVal('whatsapp_cart_enabled') === 'FALSE',

      _ts: Date.now()
    };

    // 3. خزن بالكاش
    cacheData = result;
    cacheTime = Date.now();
    return result;

  } catch (e) {
    console.log("GlobalConfig Error:", e.message);
    // إذا فشل - رجع آخر كاش عندك
    if (cacheData) return cacheData;
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
