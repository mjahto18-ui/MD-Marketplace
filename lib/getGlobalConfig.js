import { getgooglesheets } from './googlesheets'; // نفس الملف يلي عندك

export async function getGlobalConfig() {
  const sheets = await googlesheets();
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID; // انتبه هون اسم المتغير عندك هو GOOGLE_SHEET_ID

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'MD_Global_Control!A2:D10',
  });

  const rows = res.data.values || [];
  let config = {
    platform_status: { value: 'open', message: '' },
    cart_enabled: { value: 'TRUE', message: '' },
    countdown_date: { value: '' },
    emergency_lock: { value: 'FALSE', message: '' },
    daysLeft: 0
  };

  rows.forEach(r => {
    if(!r[0]) return;
    config[r[0]] = { value: r[1] || '', message: r[2] || '', active_from: r[3] || '' };
  });

  // حساب العد التنازلي
  if (config.countdown_date?.value) {
    const target = new Date(config.countdown_date.value);
    const now = new Date();
    const diff = Math.ceil((target - now) / (1000*60*60*24));
    config.daysLeft = diff > 0? diff : 0;
  }

  // هل السلة مسكرة؟
  config.isCartClosed = config.cart_enabled?.value === 'FALSE' || config.platform_status?.value === 'coming_soon';
  config.isComingSoon = config.platform_status?.value === 'coming_soon';
  config.isLocked = config.emergency_lock?.value === 'TRUE';

  return config;
}
