import { getgooglesheets } from './googlesheets';

export async function getGlobalConfig() {
  try {
    const sheets = await getgooglesheets();
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'MD_Global_Control!A2:C20',
    });
    const rows = res.data.values || [];
    let cfg = {};
    rows.forEach(r => {
      const k = (r[0]||'').trim().toUpperCase();
      const vRaw = (r[1]||'').toString().trim();
      const v = vRaw.toUpperCase(); // للفحص بس
      const m = r[2]||''; // الرسالة بتنترك متل ما هي عربي
      if(k) cfg[k] = { raw: vRaw, value: v, message: m };
    });

    const target = new Date(cfg['COUNTDOWN_DATE']?.raw || '2026-08-20');
    const diff = Math.ceil((target - new Date()) / (1000*60*60*24));

    return {
      rawConfig: cfg, // مشان اذا بدك
      daysLeft: diff > 0? diff : 0,
      isCartClosed: cfg['CART_ENABLED']?.value === 'FALSE',
      isComingSoon: cfg['PLATFORM_STATUS']?.value === 'COMING_SOON',
      isLocked: cfg['EMERGENCY_LOCK']?.value === 'TRUE',
      // هون الرسالة الديناميك للسلة - بتكتبها انت من الشيت
      cart_closed_message: cfg['CART_CLOSED_MESSAGE']?.message || cfg['CART_CLOSED_MESSAGE']?.raw || "السلة مغلقة حالياً",
      emergency_lock: cfg['EMERGENCY_LOCK'],
      cart_enabled: cfg['CART_ENABLED'],
      platform_status: cfg['PLATFORM_STATUS'],
    };
  } catch (e) {
    console.log(e.message);
    return {
      isCartClosed: false,
      isComingSoon: false,
      isLocked: false,
      daysLeft: 0,
      cart_closed_message: "السلة مغلقة حالياً"
    };
  }
}
