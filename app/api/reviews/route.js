import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Reviews!A2:H', // عدّل حسب ترتيب الأعمدة عندك
    });

    const rows = response.data.values || [];

    const reviews = rows.map(row => ({
      reviewId: row[0],
      customerId: row[1],
      storeId: row[2],
      requestId: row[3],
      rating: Number(row[4]),
      comment: row[5],
      status: row[6],
      createdAt: row[7],
    }));

    return NextResponse.json({ success: true, reviews });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
