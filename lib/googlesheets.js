import { google } from 'googleapis';

let cachedAuth = null as any;
let cachedSheets = null as any;
let cacheTime = 0;
const CACHE_TTL = 15 * 1000; // 15 ثانية كاش للتوكن

export async function getgooglesheets() {
  const now = Date.now();

  // اذا في كاش ولسا جديد رجعو
  if (cachedSheets && (now - cacheTime) < CACHE_TTL) {
    return cachedSheets;
  }

  if (!cachedAuth) {
    cachedAuth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  }

  cachedSheets = google.sheets({ version: 'v4', auth: cachedAuth });
  cacheTime = now;
  return cachedSheets;
}

export async function ensuresheetheaders(sheets, spreadsheetId, sheetName, headers) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!1:1`,
    });
    const firstRow = response.data.values?.[0] || [];
    if (firstRow.length === 0 ||!headers.every(h => firstRow.includes(h))) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!1:1`,
        valueInputOption: 'RAW',
        requestBody: { values: [headers] },
      });
    }
  } catch (error) {
    console.log('Sheet headers check:', error.message);
  }
}
