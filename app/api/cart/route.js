export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { cookies } from "next/headers";

async function getCustomerIDFromSession(sheets, spreadsheetId) {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) return null;
  let phone;
  try {
    const session = JSON.parse(sessionCookie);
    phone = session.phone || session.Mobile || session.user?.phone || sessionCookie;
  } catch { phone = sessionCookie; }
  if (!phone) return null;

  const customersRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Customers!A:Z" });
  const customers = customersRes.data.values || [];
  const header = customers[0] || [];
  const mobileIdx = header.findIndex(h => h.toLowerCase().includes('mobile') || h.toLowerCase().includes('phone'));
  const customerIdIdx = header.findIndex(h => h.toLowerCase().includes('customer') && h.toLowerCase().includes('id'));
  for (let i = 1; i < customers.length; i++) {
    if (customers[i][mobileIdx] === phone || customers[i][1] === phone || customers[i][2] === phone) {
      return customers[i][customerIdIdx >=0 ? customerIdIdx : 0] || customers[i][0];
    }
  }
  const usersRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Users!A:Z" });
  const users = usersRes.data.values?.slice(1) || [];
  const user = users.find(row => row.includes(phone));
  return user ? user[0] : null;
}

export async function GET(req) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    const customerID = await getCustomerIDFromSession(sheets, spreadsheetId);
    if (!customerID) {
      // زائر - رجع سلة فاضية بدل ما ترجع 400
      return NextResponse.json({ success: true, cart: [], totalWeight: 0, subtotal: 0, baseDeliveryFee: 0, deliveryFee: 0, freeDeliveryRemaining: 0 });
    }

    const [cartRes, productsRes, storesRes, ratesRes, customersRes] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId, range: "Cart!A:Z" }),
      sheets.spreadsheets.values.get({ spreadsheetId, range: "Products!A:L" }),
      sheets.spreadsheets.values.get({ spreadsheetId, range: "Stores!A:O" }),
      sheets.spreadsheets.values.get({ spreadsheetId, range: "Delivery Rates!A:F" }),
      sheets.spreadsheets.values.get({ spreadsheetId, range: "Customers!A:Z" }),
    ]);

    const cartRows = cartRes.data.values?.slice(1) || [];
    const productsRows = productsRes.data.values?.slice(1) || [];
    const customersRows = customersRes.data.values?.slice(1) || [];
    const ratesRows = ratesRes.data.values?.slice(1) || [];

    const customerCart = cartRows.filter((r) => r[1] === customerID && r[6] === "FALSE");

    const cartItems = customerCart.map((row) => {
      const product = productsRows.find((p) => p[0] === row[2]);
      const qty = Number(row[3]);
      const lineTotal = Number(row[5]);
      return {
        cartID: row[0],
        productID: row[2],
        name: product ? product[2] : "منتج محذوف",
        image: product ? product[6] : "",
        unitPrice: qty ? lineTotal / qty : 0,
        qty,
        lineTotal,
        linePoints: Number(row[9]),
      };
    });

    const totalWeight = cartItems.reduce((s, i) => s + i.qty * i.linePoints, 0);
    const subtotal = cartItems.reduce((s, i) => s + i.lineTotal, 0);

    const customerRow = customersRows.find((r) => r[0] === customerID);
    const freeDeliveryRemaining = customerRow ? Number(customerRow[8] || 0) : 0;

    let baseDeliveryFee = 0;
    const rateRow = ratesRows.find((r) => {
      const min = Number(r[2]);
      const max = Number(r[3]);
      return totalWeight >= min && totalWeight <= max;
    });
    if (rateRow) baseDeliveryFee = Number(rateRow[4]);

    let finalDeliveryFee;
    if (freeDeliveryRemaining === 0) {
      finalDeliveryFee = baseDeliveryFee;
    } else {
      finalDeliveryFee = totalWeight <= 10 ? 0 : baseDeliveryFee;
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
