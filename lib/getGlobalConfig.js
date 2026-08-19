import { getgooglesheets } from './googlesheets';

let cache = { data: null, time: 0 };
const TTL = 10 * 1000;

export async function getGlobalConfig() {
  const now = Date.now();
  if (cache.data && (now - cache.time) < TTL) {
    return cache.data;
  }

  try {
    const sheets = await getgooglesheets();
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    let rows = [];
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'MD_Global_Control!A2:E20',
      });
      rows = res.data.values || [];
    } catch {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'A2:E20',
      });
      rows = res.data.values || [];
    }

    let cfg = {};
    rows.forEach(r => {
      const kRaw = (r[0]||'').trim();
      if(!kRaw) return;
      const k = kRaw.toUpperCase();
      const vRaw = (r[1]||'').toString().trim();
      const v = vRaw.toUpperCase();
      let m = (r[2]||'').toString().trim();
      if(m.toUpperCase() === 'TRUE' || m.toUpperCase() === 'FALSE') m = "";
      const d = (r[3]||'').toString().trim();
      cfg[k] = { raw: vRaw, value: v, message: m, extra: d };
    });

    // دوام
    const parseTime = (t) => {
      if(!t) return null;
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

    const cartOpen = parseTime(cfg['CART_OPEN_TIME']?.raw);
    const cartClose = parseTime(cfg['CART_CLOSE_TIME']?.raw);
    const whatsappCartOpen = parseTime(cfg['WHATSAPP_CART_OPEN']?.raw);
    const whatsappCartClose = parseTime(cfg['WHATSAPP_CART_CLOSE']?.raw);

    const isCartInHours = cartOpen!== null && cartClose!== null? (nowMinutes >= cartOpen && nowMinutes <= cartClose) : true;
    const isWhatsappCartInHours = whatsappCartOpen!== null && whatsappCartClose!== null? (nowMinutes >= whatsappCartOpen && nowMinutes <= whatsappCartClose) : true;

    const result = {
      rawConfig: cfg,
      // القديم
      isCartClosed: cfg['CART_ENABLED']?.value === 'FALSE',
      isComingSoon: cfg['PLATFORM_STATUS']?.value === 'COMING_SOON',
      isLocked: cfg['EMERGENCY_LOCK']?.value === 'TRUE',
      // الجديد - موقع
      cart_open_time: cfg['CART_OPEN_TIME']?.raw || '08:00',
      cart_close_time: cfg['CART_CLOSE_TIME']?.raw || '22:00',
      isCartInHours,
      // الجديد - واتساب
      isWhatsappEnabled: cfg['WHATSAPP_ENABLED']?.value!== 'FALSE', // زر الطوارئ
      isWhatsappCartClosed: cfg['WHATSAPP_CART_ENABLED']?.value === 'FALSE',
      whatsapp_open_time: cfg['WHATSAPP_CART_OPEN']?.raw || '08:00',
      whatsapp_close_time: cfg['WHATSAPP_CART_CLOSE']?.raw || '22:00',
      isWhatsappCartInHours,
      // رسائل
      cart_closed_message: cfg['CART_ENABLED']?.message || "",
      emergency_lock_message: cfg['EMERGENCY_LOCK']?.message || "",
      whatsapp_disabled_message: cfg['WHATSAPP_ENABLED']?.message || "نعتذر الخدمة غير متاحة اليوم، نعود غداً ❤️",
      whatsapp_cart_closed_message: cfg['WHATSAPP_CART_ENABLED']?.message || "سلة الواتساب مغلقة مؤقتاً",

      // كامل
      cart_enabled: cfg['CART_ENABLED'],
      whatsapp_enabled: cfg['WHATSAPP_ENABLED'],
      whatsapp_cart_enabled: cfg['WHATSAPP_CART_ENABLED'],
    };

    cache = { data: result, time: now };
    return result;

  } catch (e) {
    console.log("GlobalConfig Error:", e.message);
    if (cache.data) return cache.data;
    return {
      isCartClosed: false,
      isLocked: false,
      isWhatsappEnabled: true,
      isWhatsappCartClosed: false,
      isCartInHours: true,
      isWhatsappCartInHours: true,
    };
  }
}
