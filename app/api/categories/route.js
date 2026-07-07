import { NextResponse } from 'next/server';
import { getgooglesheets, ensuresheetheaders } from '@/lib/googlesheets';

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const CATEGORIES_SHEET = 'Categories';
const CATEGORY_HEADERS = ['Category ID', 'Category Name', 'Icon'];

export async function GET() {
  try {
    const sheets = await getgooglesheets();
    await ensuresheetheaders(sheets, SPREADSHEET_ID, CATEGORIES_SHEET, CATEGORY_HEADERS);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${CATEGORIES_SHEET}!A:C`,
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) {
      return NextResponse.json({ categories: [] });
    }

    const headers = rows[0];
    const categories = rows.slice(1).map(row => {
      const category = {};
      headers.forEach((header, index) => {
        category[header] = row[index] || '';
      });
      return {
        id: category['Category ID'],
        name: category['Category Name'],
        icon: category['Icon']
      };
    }).filter(cat => cat.id);

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
