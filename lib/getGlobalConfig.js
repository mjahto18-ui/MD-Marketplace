// lib/getGlobalConfig.js
import { google } from 'googleapis';

export async function getGlobalConfig() {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    range: 'MD_Global_Control!A2:D10',
  });

  const rows = res.data.values || [];
  let config = {};
  rows.forEach(r => {
    config[r[0]] = { value: r[1], message: r[2] || '', active_from: r[3] || '' }
  });

  // حساب العد التنازلي
  if (config.countdown_date) {
    const target = new Date(config.countdown_date.value);
    const now = new Date();
    const diffDays = Math.ceil((target - now) / (1000*60*60*24));
    config.daysLeft = diffDays > 0? diffDays : 0;
  }

  return config;
}
