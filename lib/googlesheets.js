import { google } from 'googleapis';

let cachedAuth = null;
let cachedSheets = null;
let cacheTime = 0;

// --- الكاش الجديد للبيانات ---
let cachedProductsData = null;
let cachedStoresData = null;
let dataCacheTime = 0;
const DATA_CACHE_TTL = 60 * 1000; // 60 ثانية - اهم شي

const CACHE_TTL = 15 * 1000;

export async function getgooglesheets() {
  const now = Date.now();
  if (cachedSheets && (now - cacheTime) < CACHE_TTL) {
    return cachedSheets;
  }
  if (!cachedAuth) {
    cachedAuth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'], // readonly اسرع
    });
  }
  cachedSheets = google.sheets({ version: 'v4', auth: cachedAuth });
  cacheTime = now;
  return cachedSheets;
}

// --- الدالة الجديدة اللي بتحل المشكلة ---
export async function getCachedProductsAndStores() {
  const now = Date.now();
  
  // اذا البيانات موجودة ولسا جديدة رجعها فورا بدون ما تضرب Google
  if (cachedProductsData && cachedStoresData && (now - dataCacheTime) < DATA_CACHE_TTL) {
    return {
      productsValues: cachedProductsData,
      storesValues: cachedStoresData,
      fromCache: true
    };
  }

  const sheets = await getgooglesheets();
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

  // ضربة وحدة لـ Google بتجيب كلشي
  const [productsRes, storesRes] = await Promise.all([
    sheets.spreadsheets.values.get({ spreadsheetId, range: "Products!A:L" }),
    sheets.spreadsheets.values.get({ spreadsheetId, range: "Stores!A:O" }),
  ]);

  cachedProductsData = productsRes.data.values || [];
  cachedStoresData = storesRes.data.values || [];
  dataCacheTime = now;

  return {
    productsValues: cachedProductsData,
    storesValues: cachedStoresData,
    fromCache: false
  };
}

export async function ensuresheetheaders(sheets, spreadsheetId, sheetName, headers) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!1:1`,
    });
    const firstRow = response.data.values?.[0] || [];
    if (firstRow.length === 0 || !headers.every(h => firstRow.includes(h))) {
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
    console.log('Sheet headers check:', error.message);
  }
}
