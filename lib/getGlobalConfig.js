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
      const v = vRaw.toUpperCase();
      const m = (r[2]||'').toString().trim(); // المسج يلي انت بتكتبو - عربي متل ما هو
      if(k) cfg[k] = { raw: vRaw, value: v, message: m };
    });

    const target = new Date(cfg['COUNTDOWN_DATE']?.raw || '2026-08-20');
    const diff = Math.ceil((target - new Date()) / (1000*60*60*24));

    // 1- اذا CART_ENABLED = FALSE -> خد المسج من نفس السطر
    const cartMsg = cfg['CART_ENABLED']?.message || cfg['CART_CLOSED_MESSAGE']?.message || "السلة مغلقة حالياً";

    // 2- اذا PLATFORM_STATUS = COMING_SOON -> خد المسج من نفس السطر - عرض فقط
    const comingMsg = cfg['PLATFORM_STATUS']?.message || "";

    return {
      rawConfig: cfg,
      daysLeft: diff > 0? diff : 0,
      isCartClosed: cfg['CART_ENABLED']?.value === 'FALSE',
      isComingSoon: cfg['PLATFORM_STATUS']?.value === 'COMING_SOON',
      isLocked: cfg['EMERGENCY_LOCK']?.value === 'TRUE',

      // هون اهم شي - الرسائل من الجدول مباشرة
      cart_closed_message: cartMsg,
      coming_soon_message: comingMsg,

      // مشان الكارت القديم يضل شغال
      coming_soon: { message: comingMsg },
      platform_status_message: comingMsg,

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
      cart_closed_message: "السلة مغلقة حالياً",
      coming_soon_message: "",
      coming_soon: { message: "" },
      platform_status_message: ""
    };
  }
}
