import { getgooglesheets } from './googlesheets'; // غير الاسم حسب ملفك

export async function getGlobalConfig() {
  try {
    const sheets = await getgooglesheets();
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'MD_Global_Control!A2:C10',
    });

    const rows = res.data.values || [];
    console.log("ROWS FROM SHEET:", rows); // شوف الـ Logs بـ Vercel

    let config = {};
    rows.forEach(r => {
      const key = (r[0]||'').trim();
      const val = (r[1]||'').toString().trim().toUpperCase();
      const msg = r[2] || '';
      if(key) config[key] = { value: val, message: msg };
    });

    // حساب
    const countdownVal = config['countdown_date']?.value || '2026-08-20';
    const target = new Date(countdownVal);
    const diff = Math.ceil((target - new Date()) / (1000*60*60*24));

    return {
     ...config,
      daysLeft: diff > 0? diff : 0,
      isCartClosed: config['cart_enabled']?.value === 'FALSE' || config['platform_status']?.value === 'COMING_SOON',
      isComingSoon: config['platform_status']?.value === 'COMING_SOON',
      isLocked: config['emergency_lock']?.value === 'TRUE'
    };
  } catch (e) {
    console.log("CONFIG ERROR:", e.message);
    return { isCartClosed: false, isComingSoon: false, isLocked: false, daysLeft: 0 };
  }
}
