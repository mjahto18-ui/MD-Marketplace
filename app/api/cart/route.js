import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_ID, serviceAccountAuth);

export async function GET(request) {
  try {
    await doc.loadInfo();
    const { searchParams } = new URL(request.url);
    const customerID = searchParams.get('customerID');

    if (!customerID) {
      return Response.json({ success: false, message: 'customerID مطلوب' }, { status: 400 });
    }

    // جداول الشيت
    const cartSheet = doc.sheetsByTitle['Cart'];
    const productsSheet = doc.sheetsByTitle['Products'];
    const storesSheet = doc.sheetsByTitle['Stores'];

    // جيب كل الصفوف
    const [cartRows, productRows, storeRows] = await Promise.all([
      cartSheet.getRows(),
      productsSheet.getRows(),
      storesSheet.getRows()
    ]);

    // فلتر سلة الزبون اللي Checked Out = FALSE
    const customerCart = cartRows.filter(
      row => row.get('Customer ID') === customerID && row.get('Checked Out') === 'FALSE'
    );

    // اربط مع Products + Stores
    const cartItems = customerCart.map(cartRow => {
      const product = productRows.find(p => p.get('Product ID') === cartRow.get('Product ID'));
      const store = storeRows.find(s => s.get('Store ID') === product?.get('Store ID'));

      return {
        cartID: cartRow.get('Cart ID'),
        productID: cartRow.get('Product ID'),
        name: product?.get('Name') || 'منتج محذوف',
        image: product?.get('Image') || '',
        unitPrice: Number(cartRow.get('Line Total')) / Number(cartRow.get('Qty')),
        qty: Number(cartRow.get('Qty')),
        lineTotal: Number(cartRow.get('Line Total')),
        linePoints: Number(cartRow.get('Line Points')),
        storeName: store?.get('Store Name') || 'متجر محذوف'
      };
    });

    // المعادلات تبعك
    const totalWeight = cartItems.reduce((sum, item) => sum + (item.qty * item.linePoints), 0);
    const subtotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);

    return Response.json({ 
      success: true, 
      cart: cartItems,
      totalWeight,
      subtotal
    });

  } catch (error) {
    console.error('Cart GET Error:', error);
    return Response.json({ success: false, message: 'خطأ بجلب السلة' }, { status: 500 });
  }
}
