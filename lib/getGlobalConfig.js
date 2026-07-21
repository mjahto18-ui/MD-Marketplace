import { getgooglesheets } from './googlesheets';

export async function getGlobalConfig() {
  try {
    const sheets = await getgooglesheets();
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'MD_Global_Control!A2:D20', // غيرتا لـ D لان عندك Active_From
    });
    const rows = res.data.values || [];
    let cfg = {};
    rows.forEach(r => {
      const k = (r[0]||'').trim().toUpperCase();
      const vRaw = (r[1]||'').toString().trim();
      const v = vRaw.toUpperCase();
      const m = (r[2]||'').toString().trim(); // المسج من نفس السطر - C
      const d = (r[3]||'').toString().trim(); // D
      if(k) cfg[k] = { raw: vRaw, value: v, message: m, extra: d };
    });

    const target = new Date(cfg['COUNTDOWN_DATE']?.raw || '2026-08-20');
    const diff = Math.ceil((target - new Date()) / (1000*60*60*24));

    // كل رسالة من سطرا هي - ما في fallback بين بعض
    const cartMsg = cfg['CART_ENABLED']?.message || "";
    const comingMsg = cfg['PLATFORM_STATUS']?.message || "";
    const lockMsg = cfg['EMERGENCY_LOCK']?.message || ""; // هيدا كان ناقص عندك

    return {
      rawConfig: cfg,
      daysLeft: diff > 0? diff : 0,
      isCartClosed: cfg['CART_ENABLED']?.value === 'FALSE',
      isComingSoon: cfg['PLATFORM_STATUS']?.value === 'COMING_SOON',
      isLocked: cfg['EMERGENCY_LOCK']?.value === 'TRUE',

      // رسائل مباشرة من الجدول - سطر بسطر
      cart_closed_message: cartMsg, // من سطر CART_ENABLED
      coming_soon_message: comingMsg, // من سطر PLATFORM_STATUS
      emergency_lock_message: lockMsg, // من سطر EMERGENCY_LOCK

      // مشان الكود القديم يضل شغال
      coming_soon: { message: comingMsg },
      platform_status_message: comingMsg,
      cart_closed: { message: cartMsg },

      emergency_lock: {
        value: cfg['EMERGENCY_LOCK']?.value || 'FALSE',
        raw: cfg['EMERGENCY_LOCK']?.raw || 'FALSE',
        message: lockMsg, // هون الحل - اذا فاضي بيرجع فاضي و ClosedPage بيعرض الحداد
        extra: cfg['EMERGENCY_LOCK']?.extra || ""
      },
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
      cart_closed_message: "السلة مغلقة حالياً",
      coming_soon_message: "",
      emergency_lock_message: "",
      coming_soon: { message: "" },
      platform_status_message: "",
      emergency_lock: { message: "", value: "FALSE" }
    };
  }
}
