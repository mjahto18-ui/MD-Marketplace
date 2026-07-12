import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_ID, serviceAccountAuth);

export async function PUT(request) {
  try {
    await doc.loadInfo();
    const { cartID, qty } = await request.json();

    if (qty < 1) {
      return Response.json({ success: false, message: 'الكمية لازم 1 او اكتر' }, { status: 400 });
    }

    const cartSheet = doc.sheetsByTitle['Cart'];
    const productsSheet = doc.sheetsByTitle['Products'];
    
    const [cartRows, productRows] = await Promise.all([
      cartSheet.getRows(),
      productsSheet.getRows()
    ]);

    const cartItem = cartRows.find(row => row.get('Cart ID') === cartID);
    if (!cartItem) {
      return Response.json({ success: false, message: 'المنتج مش بالسلة' }, { status: 404 });
    }

    const product = productRows.find(p => p.get('Product ID') === cartItem.get('Product ID'));
    const unitPrice = Number(product.get('Price'));

    // المعادلة: Line Total = Qty * Unit Price
    cartItem.set('Qty', qty);
    cartItem.set('Line Total', qty * unitPrice);
    await cartItem.save();

    return Response.json({ success: true, message: 'تم التعديل' });

  } catch (error) {
    console.error('Cart UPDATE Error:', error);
    return Response.json({ success: false, message: 'خطأ بالتعديل' }, { status: 500 });
  }
}
