import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('ENV CHECK:', {
      hasEmail:!!process.env.GOOGLE_CLIENT_EMAIL,
      hasKey:!!process.env.GOOGLE_PRIVATE_KEY,
      hasSheetId:!!process.env.GOOGLE_SHEETS_ID,
    });

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'Products!A2:E',
    });

    const rows = response.data.values || [];
    
    const products = rows.map((row, index) => ({
      id: row[0] || index + 1,
      name: row[1] || 'بدون اسم',
      price: row[2] || '0',
      image: row[3] || 'https://via.placeholder.com/300',
      category: row[4] || 'عام',
    }));

    return Response.json(products);
    
  } catch (error) {
    console.error('Google Sheets API Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
}
