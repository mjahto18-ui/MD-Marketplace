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

export async function PUT(req) {
  try {
    const { cartID, qty } = await req.json();
    if (!cartID || !qty) return NextResponse.json({ success: false, message: "cartID و qty مطلوبين" }, { status: 400 });
    if (qty < 1) return NextResponse.json({ success: false, message: "الكمية لازم تكون 1 أو أكثر" }, { status: 400 });

    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: process.env.GOOGLE_CLIENT_EMAIL, private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n") },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    const customerID = await getCustomerIDFromSession(sheets, spreadsheetId);
    if (!customerID) return NextResponse.json({ success: false, message: "لازم تسجل دخول" }, { status: 401 });

    const cartRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Cart!A:Z" });
    const cartRows = cartRes.data.values?.slice(1) || [];

    const index = cartRows.findIndex((row) => row[0] === cartID);
    if (index === -1) return NextResponse.json({ success: false, message: "المنتج مش بالسلة" }, { status: 404 });

    const cartItem = cartRows[index];
    // تأكد انو هالسلة لنفس الزبون
    if (String(cartItem[1]).trim() !== String(customerID).trim()) {
      return NextResponse.json({ success: false, message: "ما عندك صلاحية تعدل هالمنتج" }, { status: 403 });
    }

    const productID = cartItem[2];

    const productsRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Products!A:L" });
    const productsRows = productsRes.data.values?.slice(1) || [];
    const product = productsRows.find((row) => row[0] === productID);
    if (!product) return NextResponse.json({ success: false, message: "المنتج غير موجود" }, { status: 404 });

    const unitPrice = Number(product[5]);

    cartItem[3] = qty;
    cartItem[5] = qty * unitPrice;

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Cart!A${index + 2}:Z${index + 2}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [cartItem] },
    });

    return NextResponse.json({ success: true, message: "تم تعديل الكمية" });
  } catch (err) {
    console.error("Cart UPDATE Error:", err);
    return NextResponse.json({ success: false, message: "خطأ بالتعديل" }, { status: 500 });
  }
}
