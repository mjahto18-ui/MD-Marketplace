import { NextResponse } from "next/server";
import { google } from "googleapis";

async function getSheetIdByName(sheets, spreadsheetId, sheetName) {
  const res = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = res.data.sheets.find(s => s.properties.title === sheetName);
  if (!sheet) throw new Error(`Sheet ${sheetName} not found`);
  return sheet.properties.sheetId;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { customerID, areaID, deliveryAddress, note, addressType, lat, lng } = body;

    if (!customerID || !addressType) {
      return NextResponse.json({
        success: false,
        message: "نوع العنوان غير محدد",
      }, { status: 400 });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    // 1) جلب البيانات
    const [
      cartRes,
      customersRes,
      deliveryRatesRes,
      areasRes,
    ] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId, range: "Cart!A:Z" }),
      sheets.spreadsheets.values.get({ spreadsheetId, range: "Customers!A:AE" }),
      sheets.spreadsheets.values.get({ spreadsheetId, range: "Delivery Rates!A:Z" }),
      sheets.spreadsheets.values.get({ spreadsheetId, range: "Areas!A:Z" }),
    ]);

    const cartRows = cartRes.data.values?.slice(1) || [];
    const customerRows = customersRes.data.values?.slice(1) || [];
    const deliveryRatesRows = deliveryRatesRes.data.values?.slice(1) || [];
    const areasRows = areasRes.data.values?.slice(1) || [];

    // 2) سلة الزبون
    const customerCart = cartRows.filter(
      (row) => String(row[1]).trim() === String(customerID).trim() && String(row[6]).trim() === "FALSE"
    );

    if (customerCart.length === 0) {
      return NextResponse.json(
        { success: false, message: "السلة فاضية" },
        { status: 400 }
      );
    }

    // 3) الوزن
    let totalWeight = 0;
    const cartWithProducts = customerCart.map(row => {
      const qty = Number(row[3]);
      const linePoints = Number(row[9]);
      const lineTotal = Number(row[5]);
      const unitPrice = qty > 0 ? lineTotal / qty : 0;

      totalWeight += qty * linePoints;

      return {
        productID: row[2],
        qty,
        linePoints,
        unitPrice,
        lineTotal,
        storeID: row[4],
      };
    });

    // 4) بيانات الزبون + Delivery Fee
    const customer = customerRows.find((row) => String(row[0]).trim() === String(customerID).trim());
    if (!customer) {
      return NextResponse.json({ success: false, message: "الزبون غير موجود" }, { status: 400 });
    }

    const freeDeliveryRemaining = Number(customer[8]) || 0;
    const lastFreeDeliveryDate = customer[13] || "";
    const today = new Date().toLocaleDateString("en-GB");

    const rateRow = deliveryRatesRows.find((row) => {
      const min = Number(row[1]);
      const max = Number(row[2]);
      return totalWeight >= min && totalWeight <= max;
    });

    const baseDeliveryFee = rateRow ? Number(rateRow[3]) : 0;
    const isFreeDelivery = freeDeliveryRemaining > 0 && totalWeight <= 10 && lastFreeDeliveryDate !== today;
    const deliveryFee = isFreeDelivery ? 0 : baseDeliveryFee;

    // 5) تجهيز ID وتواريخ
    const requestID = crypto.randomUUID().replace(/-/g, "").substring(0, 8);
    const now = new Date();
    const requestDate = now.toLocaleString("en-GB", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).replace(",", "");
    const createdDate = now.toLocaleDateString("en-GB");

    // 6) تحديد المنطقة والعنوان واللوكيشن حسب نوع العنوان
    let finalAreaID = String(areaID || "").trim();
    let finalAddress = deliveryAddress || "";
    let finalNote = note || "";
    let finalLat = lat || "";
    let finalLng = lng || "";

    if (addressType === "fixed") {
      const customerArea = (customer[3] || "").trim();
      const customerAddress = customer[4] || "";
      const customerLat = customer[11] || "";
      const customerLng = customer[12] || "";

      // شرطين: كود مع كود + اسم مع اسم
      const areaExistsByID = areasRows.some(row =>
        String(row[0]).trim() === String(customerArea).trim()
      );

      const areaExistsByName = areasRows.some(row =>
        String(row[1]).trim() === String(customerArea).trim()
      );

      const areaExists = areaExistsByID || areaExistsByName;

      if (!areaExists) {
        return NextResponse.json({
          success: false,
          message: "عذراً، منطقتك الحالية غير مدعومة للتوصيل",
        }, { status: 400 });
      }

      finalAreaID = customerArea;
      finalAddress = customerAddress;
      finalNote = "";
      finalLat = customerLat;
      finalLng = customerLng;
    } else if (addressType === "new") {
      if (!finalAreaID || !finalAddress) {
        return NextResponse.json({
          success: false,
          message: "تأكد من تعبئة المنطقة والعنوان",
        }, { status: 400 });
      }
      if (!finalLat || !finalLng) {
        return NextResponse.json({
          success: false,
          message: "ما قدرنا نحدد موقعك، جرّب مرة تانية",
        }, { status: 400 });
      }
    } else {
      return NextResponse.json({
        success: false,
        message: "نوع العنوان غير معروف",
      }, { status: 400 });
    }

    // 7) نسخ الطلب على Order requuest (مع Customer Latitude/Longitude)
    const newOrderRequestRow = [
      requestID,                      // A
      customerID,                     // B
      String(finalAreaID),            // C
      createdDate,                    // D
      finalNote,                      // E
      String(finalAddress),           // F
      deliveryFee,                    // G
      "", "", "Pending", "", requestDate, "", "FALSE", "Pending",
      "", "", "", "", "", "Pending", "FALSE", 0, "", "", customer[2] || "",
      "", "", "",                     // AC
      finalLat,                       // AD
      finalLng,                       // AE
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Order requuest!A:AE",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [newOrderRequestRow] },
    });

    // 8) نسخ تفاصيل الطلب على Order Details
    const detailRows = cartWithProducts.map(item => {
      const detailID = crypto.randomUUID().replace(/-/g, "").substring(0, 8);
      const commissionAmount = item.lineTotal * 0.1;
      return [
        detailID, "", item.productID, item.qty, item.unitPrice, item.lineTotal,
        item.storeID, customerID, requestID, finalAreaID, customerID, commissionAmount,
      ];
    });

    if (detailRows.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Order Details!A:Z",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: detailRows },
      });
    }

    // 9) مسح سلة الزبون
    const fullCartRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Cart!A:Z",
    });

    const fullCartRows = fullCartRes.data.values || [];
    const dataRows = fullCartRows.slice(1);

    const rowsToDelete = [];
    dataRows.forEach((row, index) => {
      const rowCustomerID = String(row[1]).trim();
      const isCheckedOut = String(row[6]).trim();
      if (rowCustomerID === String(customerID).trim() && isCheckedOut === "FALSE") {
        rowsToDelete.push(index + 2);
      }
    });

    if (rowsToDelete.length > 0) {
      const cartSheetId = await getSheetIdByName(sheets, spreadsheetId, "Cart");
      rowsToDelete.sort((a, b) => b - a);

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: rowsToDelete.map(rowNumber => ({
            deleteDimension: {
              range: {
                sheetId: cartSheetId,
                dimension: "ROWS",
                startIndex: rowNumber - 1,
                endIndex: rowNumber
              }
            }
          }))
        }
      });
    }

    return NextResponse.json({
      success: true,
      request_id: requestID,
      delivery_fee: deliveryFee,
      message: "تم ارسال طلبك للمراجعة",
    });

  } catch (err) {
    console.error("Checkout Error:", err);
    return NextResponse.json(
      { success: false, message: "صار خطأ، جرب مرة تانية", error: err.message },
      { status: 500 }
    );
  }
}
