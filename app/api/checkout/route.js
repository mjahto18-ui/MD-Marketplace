import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req) {
  try {
    const body = await req.json();
    const { customerID, areaID, deliveryAddress, note } = body;

    if (!customerID || !areaID || !deliveryAddress) {
      return NextResponse.json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Google Auth
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    // ============================
    // 1) جلب الجداول
    // ============================
    const [
      cartRes,
      customersRes,
      productsRes,
      deliveryRatesRes,
    ] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId, range: "Cart!A:Z" }),
      sheets.spreadsheets.values.get({ spreadsheetId, range: "Customers!A:Z" }),
      sheets.spreadsheets.values.get({ spreadsheetId, range: "Products!A:L" }),
      sheets.spreadsheets.values.get({ spreadsheetId, range: "Delivery Rates!A:Z" }),
    ]);

    const cartRows = cartRes.data.values?.slice(1) || [];
    const customerRows = customersRes.data.values?.slice(1) || [];
    const deliveryRatesRows = deliveryRatesRes.data.values?.slice(1) || [];

    // ============================
    // 2) سلة الزبون
    // ============================
    const customerCart = cartRows.filter(
      (row) => row[1] === customerID && row[6] === "FALSE"
    );

    if (customerCart.length === 0) {
      return NextResponse.json(
        { success: false, message: "السلة فاضية" },
        { status: 400 }
      );
    }

    // ============================
    // 3) حساب الوزن
    // ============================
    let totalWeight = 0;
    const cartWithProducts = [];

    for (const row of customerCart) {
      const productID = row[2];
      const qty = Number(row[3]);
      const linePoints = Number(row[9]); // Line Points
      const lineTotal = Number(row[5]);
      const unitPrice = lineTotal / qty;

      totalWeight += qty * linePoints;

      cartWithProducts.push({
        cartRow: row,
        productID,
        qty,
        linePoints,
        unitPrice,
        lineTotal,
        storeID: row[4],
      });
    }

    // ============================
    // 4) بيانات الزبون
    // ============================
    const customer = customerRows.find((row) => row[0] === customerID);

    const freeDeliveryRemaining = Number(customer[7]);
    const lastFreeDeliveryDate = customer[8];
    const today = new Date().toLocaleDateString("en-GB");

    // ============================
    // 5) حساب Delivery Fee
    // ============================
    const rateRow = deliveryRatesRows.find((row) => {
      const min = Number(row[1]);
      const max = Number(row[2]);
      return totalWeight >= min && totalWeight <= max;
    });

    const baseDeliveryFee = rateRow ? Number(rateRow[3]) : 0;

    const isFreeDelivery =
      freeDeliveryRemaining > 0 &&
      totalWeight <= 10 &&
      lastFreeDeliveryDate !== today;

    const deliveryFee = isFreeDelivery ? 0 : baseDeliveryFee;

    // ============================
    // 6) IDs + Dates
    // ============================
    const requestID = crypto.randomUUID().replace(/-/g, "").substring(0, 8);

    const now = new Date();
    const requestDate = now
      .toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
      .replace(",", "");

    const createdDate = now.toLocaleDateString("en-GB");

    // ============================
    // 7) إضافة سطر لـ Order Requuest
    // ============================
    const newOrderRequestRow = [
      requestID,
      customerID,
      areaID,
      createdDate,
      note,
      deliveryAddress,
      deliveryFee,
      "",
      "",
      "Pending",
      "",
      requestDate,
      "",
      "FALSE",
      "Pending",
      "",
      "",
      "",
      "",
      "",
      "Pending",
      "FALSE",
      0,
      "",
      "",
      customer[3], // Mobile
      "",
      "",
      requestDate,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Order Requuest!A:AC",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [newOrderRequestRow] },
    });

    // ============================
    // 8) إضافة سطور لـ Order Details
    // ============================
    for (const item of cartWithProducts) {
      const detailID = crypto.randomUUID().replace(/-/g, "").substring(0, 8);
      const commissionAmount = item.lineTotal * 0.1;

      const newDetailRow = [
        detailID,
        "",
        item.productID,
        item.qty,
        item.unitPrice,
        item.lineTotal,
        item.storeID,
        customerID,
        requestID,
        areaID,
        customerID,
        commissionAmount,
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Order Details!A:Z",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [newDetailRow] },
      });
    }

    // ============================
    // 9) تحديث السلة → Checked Out = TRUE
    // ============================
    const fullCartRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Cart!A:Z",
    });

    const fullCartRows = fullCartRes.data.values || [];
    const header = fullCartRows[0];
    const dataRows = fullCartRows.slice(1);

    const updatedDataRows = dataRows.map((row) => {
      if (row[1] === customerID && row[6] === "FALSE") {
        row[6] = "TRUE";
        row[8] = requestID;
      }
      return row;
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Cart!A:Z",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [header, ...updatedDataRows] },
    });

    return NextResponse.json({
      success: true,
      request_id: requestID,
      delivery_fee: deliveryFee,
      message: "تم ارسال طلبك للمراجعة",
    });
  } catch (err) {
    console.error("Checkout Error:", err);
    return NextResponse.json(
      { success: false, message: "صار خطأ، جرب مرة تانية" },
      { status: 500 }
    );
  }
}
