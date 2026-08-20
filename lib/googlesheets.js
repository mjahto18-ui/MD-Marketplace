import { google } from 'googleapis';

let cachedAuth = null;
let cachedSheets = null;
let cacheTime = 0;

let cachedProductsData = null;
let cachedStoresData = null;
let dataCacheTime = 0;
let dataFetchPromise = null;
const DATA_CACHE_TTL = 60 * 1000;

const CACHE_TTL = 15 * 1000;

// هون ضفت الـ old مشان ما يطلع خطأ ابدا
let oldProductsData = null;
let oldStoresData = null;

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
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
  }
  cachedSheets = google.sheets({ version: 'v4', auth: cachedAuth });
  cacheTime = now;
  return cachedSheets;
}

export async function getCachedProductsAndStores() {
  const now = Date.now();

  if (cachedProductsData && cachedStoresData && (now - dataCacheTime) < DATA_CACHE_TTL) {
    return {
      productsValues: cachedProductsData,
      storesValues: cachedStoresData,
    };
  }

  if (dataFetchPromise) {
    return dataFetchPromise;
  }

  dataFetchPromise = (async () => {
    try {
      const sheets = await getgooglesheets();
      const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

      const [productsRes, storesRes] = await Promise.all([
        sheets.spreadsheets.values.get({ spreadsheetId, range: "Products!A:L" }),
        sheets.spreadsheets.values.get({ spreadsheetId, range: "Stores!A:O" }),
      ]);

      cachedProductsData = productsRes.data.values || [];
      cachedStoresData = storesRes.data.values || [];
      dataCacheTime = Date.now();

      // حفظ نسخة قديمة احتياط
      oldProductsData = cachedProductsData;
      oldStoresData = cachedStoresData;

      return {
        productsValues: cachedProductsData,
        storesValues: cachedStoresData,
      };
    } catch (error) {
      // اذا فشل Google، رجع القديم وما تخلي الزبون يشوف خطأ
      if (oldProductsData && oldStoresData) {
        console.log("Fallback to old cache:", error.message);
        return {
          productsValues: oldProductsData,
          storesValues: oldStoresData,
        };
      }
      throw error;
    } finally {
      dataFetchPromise = null;
    }
  })();

  return dataFetchPromise;
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
        requestBody: {
          values: [headers],
        },
      });
    }
  } catch (error) {
    console.log('Sheet headers check:', error.message);
  }
}
