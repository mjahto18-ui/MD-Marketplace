import { getgooglesheets } from './googlesheets';

export async function getGlobalConfig() {
  try {
    const sheets = await getgooglesheets();
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'MD_Global_Control!A2:C10',
    });
    const rows = res.data.values || [];
    let cfg = {};
    rows.forEach(r => {
      const k = (r[0]||'').trim().toUpperCase(); // <-- هون كان الغلط
      const v = (r[1]||'').toString().trim().toUpperCase();
      const m = r[2]||'';
      if(k) cfg[k] = { value: v, message: m };
    });

    const target = new Date(cfg['COUNTDOWN_DATE']?.value || '2026-08-20');
    const diff = Math.ceil((target - new Date()) / (1000*60*60*24));

    return {
   ...cfg,
      daysLeft: diff > 0? diff : 0,
      isCartClosed: cfg['CART_ENABLED']?.value === 'FALSE',
      isComingSoon: cfg['PLATFORM_STATUS']?.value === 'COMING_SOON',
      isLocked: cfg['EMERGENCY_LOCK']?.value === 'TRUE'
    };
  } catch (e) {
    console.log(e.message);
    return { isCartClosed: false, isComingSoon: false, isLocked: false, daysLeft: 0 };
  }
}
