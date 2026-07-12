import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);

export async function GET(request, { params }) {
  try {
    await doc.loadInfo();
    const productID = params.id;

    const productsSheet = doc.sheetsByTitle['Products'];
    const storesSheet = doc.sheetsByTitle['Stores'];

    const [productRows, storeRows] = await Promise.all([
      productsSheet.getRows(),
      storesSheet.getRows()
    ]);

    const product = productRows.find(p => p.get('Product ID') === productID);

    if (!product) {
      return Response.json({ success: false, message: 'المنتج غير موجود' }, { status: 404 });
    }

    const store = storeRows.find(s => s.get('Store ID') === product.get('Store ID'));

    const productData = {
      productID: product.get('Product ID'),
      name: product.get('Name'),
      price: Number(product.get('Price')),
      image: product.get('Image'),
      weightPoint: Number(product.get('Weight Point')),
      storeID: product.get('Store ID'),
      storeName: store?.get('Store Name') || 'متجر محذوف',
      description: product.get('Description') || '',
      category: product.get('Category') || '',
      stock: Number(product.get('Stock')) || 0
    };

    return Response.json({ success: true, product: productData });

  } catch (error) {
    console.error('Product GET Error:', error);
    return Response.json({ success: false, message: 'خطأ بجلب المنتج' }, { status: 500 });
  }
}
