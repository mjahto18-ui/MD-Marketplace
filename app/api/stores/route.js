import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_ID, serviceAccountAuth);

export async function GET() {
  try {
    await doc.loadInfo();
    const storesSheet = doc.sheetsByTitle['Stores'];
    const storeRows = await storesSheet.getRows();

    const stores = storeRows.map(store => ({
      storeID: store.get('Store ID'),
      storeName: store.get('Store Name'),
      image: store.get('Image') || '',
      address: store.get('Address') || '',
      phone: store.get('Phone') || '',
      category: store.get('Category') || ''
    }));

    return Response.json({ success: true, stores });

  } catch (error) {
    console.error('Stores GET Error:', error);
    return Response.json({ success: false, message: 'خطأ بجلب المتاجر' }, { status: 500 });
  }
}
