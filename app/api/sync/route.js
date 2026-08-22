// app/api/sync/route.js - كود فحص
import { google } from 'googleapis';

export async function GET() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    
    const meta = await sheets.spreadsheets.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
    });

    const sheetNames = meta.data.sheets.map(s => s.properties.title);

    return Response.json({ 
      ok: true, 
      sheets: sheetNames,
      env: Object.keys(process.env).filter(k => k.includes('SUPA') || k.includes('GOOGLE') || k.includes('SHEET'))
    });

  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
