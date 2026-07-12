import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);

export async function POST(request) {
  try {
    await doc.loadInfo();
    const { customerID, productID, qty = 1 } = await request.json();

    const cartSheet = doc.sheetsByTitle['Cart'];
    const productsSheet = doc.sheetsByTitle['Products'];
    
    const [cartRows, productRows] = await Promise.all([
      cartSheet.getRows(),
      productsSheet.getRows()
    ]);

    // شوف اذا المنتج موجود بالسلة
    const existingItem = cartRows.find(
      row => row.get('Customer ID') === customerID && 
             row.get('Product ID') === productID && 
             row.get('Checked Out') === 'FALSE'
    );

    const product = productRows.find(p => p.get('Product ID') === productID);
    if (!product) {
      return Response.json({ success: false, message: 'المنتج غير موجود' }, { status: 404 });
    }

    const unitPrice = Number(product.get('Price'));
    const linePoints = Number(product.get('Weight Point'));
    const storeID = product.get('Store ID');

    if (existingItem) {
      // اذا موجود زيد الكمية
      const newQty = Number(existingItem.get('Qty')) + qty;
      existingItem.set('Qty', newQty);
      existingItem.set('Line Total', newQty * unitPrice);
      await existingItem.save();
    } else {
      // اذا مش موجود ضيف سطر جديد
      const cartID = crypto.randomUUID().replace(/-/g, '').substring(0, 8);
      await cartSheet.addRow({
        'Cart ID': cartID,
        'Customer ID': customerID,
        'Product ID': productID,
        'Qty': qty,
        'Store ID': storeID,
        'Line Total': qty * unitPrice,
        'Checked Out': 'FALSE',
        'Check Out Flagge': 'FALSE',
        'Request ID': '',
        'Line Points': linePoints
      });
    }

    return Response.json({ success: true, message: 'تمت الاضافة للسلة' });

  } catch (error) {
    console.error('Cart ADD Error:', error);
    return Response.json({ success: false, message: 'خطأ بالاضافة' }, { status: 500 });
  }
}
