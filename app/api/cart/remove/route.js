import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_ID, serviceAccountAuth);

export async function DELETE(request) {
  try {
    await doc.loadInfo();
    const { searchParams } = new URL(request.url);
    const cartID = searchParams.get('cartID');

    const cartSheet = doc.sheetsByTitle['Cart'];
    const cartRows = await cartSheet.getRows();
    const cartItem = cartRows.find(row => row.get('Cart ID') === cartID);
    
    if (!cartItem) {
      return Response.json({ success: false, message: 'المنتج مش بالسلة' }, { status: 404 });
    }

    await cartItem.delete();
    return Response.json({ success: true, message: 'تم الحذف' });

  } catch (error) {
    console.error('Cart DELETE Error:', error);
    return Response.json({ success: false, message: 'خطأ بالحذف' }, { status: 500 });
  }
}
