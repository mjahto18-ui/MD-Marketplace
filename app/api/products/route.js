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
    const storeID = searchParams.get('storeID'); // فلتر اختياري

    const productsSheet = doc.sheetsByTitle['Products'];
    const storesSheet = doc.sheetsByTitle['Stores'];

    const [productRows, storeRows] = await Promise.all([
      productsSheet.getRows(),
      storesSheet.getRows()
    ]);

    let filteredProducts = productRows;

    // اذا بعت storeID فلتر عليه
    if (storeID) {
      filteredProducts = productRows.filter(p => p.get('Store ID') === storeID);
    }

    // اربط مع Stores عشان نجيب اسم المحل
    const products = filteredProducts.map(product => {
      const store = storeRows.find(s => s.get('Store ID') === product.get('Store ID'));

      return {
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
    });

    return Response.json({ success: true, products });

  } catch (error) {
    console.error('Products GET Error:', error);
    return Response.json({ success: false, message: 'خطأ بجلب المنتجات' }, { status: 500 });
  }
}
