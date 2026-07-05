import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'Users!A2:Z',
    });

    const rows = response.data.values || [];

    const users = rows.map((row, index) => ({
      id: row[0] || index + 1,
      name: row[1] || '',
      phone: row[2] || '',
      area: row[3] || '',
      address: row[4] || '',
      status: row[5] || 'Pending',
      pin: row[6] || '',
    }));

    return Response.json(users);

  } catch (error) {
    console.error('Google Sheets API Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
