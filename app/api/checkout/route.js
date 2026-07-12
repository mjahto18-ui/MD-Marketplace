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
    const body = await request.json();
    const { customerID, areaID, deliveryAddress, note } = body;

    // 1. جيب جداول الشيت
    const cartSheet = doc.sheetsByTitle['Cart'];
    const customersSheet = doc.sheetsByTitle['Customers'];
    const productsSheet = doc.sheetsByTitle['Products'];
    const deliveryRatesSheet = doc.sheetsByTitle['Delivery Rates'];
    const orderRequestSheet = doc.sheetsByTitle['Order Requuest'];
    const orderDetailsSheet = doc.sheetsByTitle['Order Details'];

    // 2. جيب سلة الزبون اللي Checked Out = FALSE
    const cartRows = await cartSheet.getRows();
    const customerCart = cartRows.filter(
      row => row.get('Customer ID') === customerID && row.get('Checked Out') === 'FALSE'
    );

    if (customerCart.length === 0) {
      return Response.json({ success: false, message: 'السلة فاضية' }, { status: 400 });
    }

    // 3. احسب Total Weight = SUM(Qty * Line Points)
    let totalWeight = 0;
    const cartWithProducts = [];
    
    for (const item of customerCart) {
      const productID = item.get('Product ID');
      const qty = Number(item.get('Qty'));
      const linePoints = Number(item.get('Line Points')); // عمود Line Points بالـ Cart
      totalWeight += qty * linePoints;
      
      cartWithProducts.push({
        cartRow: item,
        productID,
        qty,
        linePoints,
        unitPrice: Number(item.get('Line Total')) / qty, // Unit Price = Line Total / Qty
        lineTotal: Number(item.get('Line Total')),
        storeID: item.get('Store ID')
      });
    }

    // 4. جيب بيانات الزبون من Customers
    const customerRows = await customersSheet.getRows();
    const customer = customerRows.find(row => row.get('ID') === customerID);
    
    const freeDeliveryRemaining = Number(customer.get('Free Delivery Remaining'));
    const lastFreeDeliveryDate = customer.get('Last Free Delivery Date'); // تاريخ
    const today = new Date().toLocaleDateString('en-GB'); // 12/07/2026

    // 5. احسب Delivery Fee بنفس معادلتك بالزبط
    let deliveryFee = 0;
    
    // 5.1 جيب السعر من Delivery Rates حسب Weight
    const deliveryRows = await deliveryRatesSheet.getRows();
    const rateRow = deliveryRows.find(row => {
      const minPoints = Number(row.get('Min Points'));
      const maxPoints = Number(row.get('Max Points'));
      return totalWeight >= minPoints && totalWeight <= maxPoints;
    });
    
    const baseDeliveryFee = rateRow ? Number(rateRow.get('Delivery Fee')) : 0;

    // 5.2 طبق شرط المجاني: Free Remaining > 0 + Weight <= 10 + ما استعمل اليوم
    const isFreeDelivery = 
      freeDeliveryRemaining > 0 && 
      totalWeight <= 10 && 
      lastFreeDeliveryDate !== today;

    deliveryFee = isFreeDelivery ? 0 : baseDeliveryFee;

    // 6. اعمل Request ID جديد
    const requestID = crypto.randomUUID().replace(/-/g, '').substring(0, 8); // 9dff1cac
    const now = new Date();
    const requestDate = now.toLocaleString('en-GB', { 
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).replace(',', ''); // 7/12/2026 21:27:45
    const createdDate = now.toLocaleDateString('en-GB'); // 7/12/2026

    // 7. Add Row لـ Order Requuest - نفس الاعمدة بالزبط
    await orderRequestSheet.addRow({
      'Request ID': requestID,
      'customer ID': customerID,
      'Area': areaID, // fad82d73
      'Cerated Date': createdDate,
      'Note': note,
      'Delivery Adress': deliveryAddress,
      'Delivery Fee': deliveryFee, // 0 او من الجدول
      'Order Area': '', // فاضي
      'Assigned Driver': '', // فاضي
      'Approval Status': 'Pending',
      'Admin Note': '', // فاضي
      'Request Date': requestDate,
      'Approved By': '', // فاضي
      'Multi Area': 'FALSE',
      'Delivery Status': 'Pending',
      'Items Cost': '', // فاضي VC
      'Total Amount': '', // فاضي VC
      'Payment Method': '', // فاضي
      'Collected Amount': '', // فاضي
      'Cash Status': 'Pending',
      'Collected By Driver': 'FALSE',
      'Commission Total': 0,
      'Final Payment Method': '', // فاضي
      'Driver Note': '', // فاضي
      'Free Delivery Used': 'FALSE', // البوت بيغيرو
      'Mobile': customer.get('Mobile'),
      'Current Location': '', // فاضي
      'Last Location Update': '', // فاضي
      'Archived Date': requestDate
    });

    // 8. Add Rows لـ Order Details - سطر لكل منتج
    for (const item of cartWithProducts) {
      const detailID = crypto.randomUUID().replace(/-/g, '').substring(0, 8);
      const commissionAmount = item.lineTotal * 0.10; // 10%
      
      await orderDetailsSheet.addRow({
        'Detail ID': detailID,
        'Order ID': '', // فاضي ما بتستعملو
        'Product ID': item.productID,
        'Qty': item.qty,
        'Unit Price': item.unitPrice,
        'Line Total': item.lineTotal,
        'Store ID': item.storeID,
        'Customer ID': customerID,
        'Request ID': requestID, // الربط
        'Area': areaID,
        'Created From Customer': customerID,
        'Commission Amount': commissionAmount
      });
    }

    // 9. Update Cart → Checked Out = TRUE + Request ID
    for (const item of customerCart) {
      item.set('Checked Out', 'TRUE');
      item.set('Request ID', requestID);
      await item.save();
    }

    // 10. ما منلمس Customers ولا Free Delivery Used - البوت تبعك بيتكفل

    return Response.json({ 
      success: true, 
      request_id: requestID,
      delivery_fee: deliveryFee,
      message: 'تم ارسال طلبك للمراجعة' 
    });

  } catch (error) {
    console.error('Checkout Error:', error);
    return Response.json({ 
      success: false, 
      message: 'صار خطأ، جرب مرة تانية' 
    }, { status: 500 });
  }
}
