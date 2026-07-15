export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(req) {
  try {
    const customerID = req.nextUrl.searchParams.get("customerID");
    if (!customerID) return NextResponse.json({ success: false }, { status: 400 });

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    const [cartRes, productsRes, storesRes, ratesRes, customersRes] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId, range: "Cart!A:Z" }),
      sheets.spreadsheets.values.get({ spreadsheetId, range: "Products!A:L" }),
      sheets.spreadsheets.values.get({ spreadsheetId, range: "Stores!A:O" }),
      sheets.spreadsheets.values.get({ spreadsheetId, range: "Delivery Rates!A:F" }),
      sheets.spreadsheets.values.get({ spreadsheetId, range: "Customers!A:Z" }),
    ]);

    const cartRows = cartRes.data.values?.slice(1) || [];
    const productsRows = productsRes.data.values?.slice(1) || [];
    const storesRows = storesRes.data.values?.slice(1) || [];
    const ratesRows = ratesRes.data.values?.slice(1) || [];
    const customersRows = customersRes.data.values?.slice(1) || [];

    const customerCart = cartRows.filter((r) => r[1] === customerID && r[6] === "FALSE");

    const cartItems = customerCart.map((row) => {
      const product = productsRows.find((p) => p[0] === row[2]);
      const store = storesRows.find((s) => s[0] === row[4]);
      const qty = Number(row[3]);
      const lineTotal = Number(row[5]);
      return {
        cartID: row[0],
        productID: row[2],
        name: product? product[2] : "منتج محذوف",
        image: product? product[6] : "",
        unitPrice: qty? lineTotal / qty : 0,
        qty,
        lineTotal,
        linePoints: Number(row[9]),
      };
    });

    const totalWeight = cartItems.reduce((s, i) => s + i.qty * i.linePoints, 0);
    const subtotal = cartItems.reduce((s, i) => s + i.lineTotal, 0);

    // من الصورة: العمود I هو Free Delivery Remaining
    const customerRow = customersRows.find((r) => r[0] === customerID);
    const freeDeliveryRemaining = customerRow? Number(customerRow[8] || 0) : 0; // I = 8

    // التسعيرة من جدول Delivery Rates حسب النقاط بس
    let baseDeliveryFee = 0;
    const rateRow = ratesRows.find((r) => {
      const min = Number(r[2]); // C
      const max = Number(r[3]); // D
      return totalWeight >= min && totalWeight <= max;
    });
    if (rateRow) baseDeliveryFee = Number(rateRow[4]); // E

    // منطقك الحالي بدون تاريخ
    let finalDeliveryFee;
    if (freeDeliveryRemaining === 0) {
      finalDeliveryFee = baseDeliveryFee;
    } else {
      finalDeliveryFee = totalWeight <= 10? 0 : baseDeliveryFee;
    }

    return NextResponse.json({
      success: true,
      cart: cartItems,
      totalWeight,
      subtotal,
      baseDeliveryFee,
      deliveryFee: finalDeliveryFee,
      freeDeliveryRemaining,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
