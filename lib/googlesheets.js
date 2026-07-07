import { google } from 'googleapis';

export async function getGoogleSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}

export async function ensureSheetHeaders(sheets, spreadsheetId, sheetName, headers) {
  try {
    // جيب اول صف
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!1:1`,
    });

    const firstRow = response.data.values?.[0] || [];

    // اذا فاضي او الهيدرز ناقصين، حطهم
    if (firstRow.length === 0 ||!headers.every(h => firstRow.includes(h))) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!1:1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [headers],
        },
      });
    }
  } catch (error) {
    // اذا الشيت مش موجود، تجاهل الخطأ - جوجل رح ينشئه تلقائياً
    console.log('Sheet headers check:', error.message);
  }
}
