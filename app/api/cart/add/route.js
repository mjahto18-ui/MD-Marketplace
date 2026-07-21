import { NextResponse } from "next/server";
import { google } from "googleapis";
import { cookies } from "next/headers";
import { getGlobalConfig } from "@/lib/getGlobalConfig";

export async function POST(req) {
  try {
    // 1- فحص الريموت
    const config = await getGlobalConfig();

    // حداد - قفل كامل
    if (config.isLocked) {
      return NextResponse.json({
        success: false,
        message: config.emergency_lock?.message || "المنصة متوقفة حداداً"
      }, { status: 403 });
    }

    // سلة + افتتاح = نفس الشي = السلة متوقفة - رسالة ثابتة
    if (config.isCartClosed || config.isComingSoon) {
      return NextResponse.json({
        success: false,
        isClosed: true,
        message: "السلة متوقفة حالياً"
      }, { status: 403 });
    }

    const { productID, qty = 1 } = await req.json();
    if (!productID) return NextResponse.json({ success: false, message: "Missing product" }, { status: 400 });

    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) return NextResponse.json({ success: false, message: "لازم تسجل دخول" }, { status: 401 });

    let phone;
    try {
      const s = JSON.parse(sessionCookie);
      phone = s.phone || s.Mobile || s.user?.phone || sessionCookie;
    } catch { phone = sessionCookie; }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    const customersRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Customers!A:Z" });
    const customers = customersRes.data.values || [];
    const header = customers[0] || [];
    const mobileIdx = header.findIndex(h => h.toLowerCase().includes('mobile') || h.toLowerCase().includes('phone'));
    const custIdIdx = header.findIndex(h => h.toLowerCase().includes('customer') && h.toLowerCase().includes('id'));

    let customerID = null;
    for (let i = 1; i < customers.length; i++) {
      if (customers[i][mobileIdx] === phone || customers[i][1] === phone) {
        customerID = customers[i][custIdIdx >=0? custIdIdx : 0] || customers[i][0];
        break;
      }
    }
    if (!customerID) return NextResponse.json({ success: false, message: "حسابك مش موجود" }, { status: 401 });

    const productsRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Products!A:L" });
    const products = productsRes.data.values?.slice(1) || [];
    const product = products.find((row) => row[0] === productID);
    if (!product) return NextResponse.json({ success: false, message: "المنتج غير موجود" });

    const unitPrice = Number(product[5]);
    const storeID = product[1];
    const linePoints = Number(product[11]);

    const cartRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Cart!A:Z" });
    const cartRows = cartRes.data.values?.slice(1) || [];
    const existingIndex = cartRows.findIndex((row) => row[1] === customerID && row[2] === productID && row[6] === "FALSE");

    if (existingIndex!== -1) {
      const row = cartRows[existingIndex];
      row[3] = Number(row[3]) + qty;
      row[5] = row[3] * unitPrice;
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Cart!A${existingIndex + 2}:Z${existingIndex + 2}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [row] },
      });
      return NextResponse.json({ success: true, message: "تم تحديث الكمية" });
    }

    const cartID = crypto.randomUUID().replace(/-/g, "").substring(0, 8);
    const newRow = [cartID, customerID, productID, qty, storeID, qty * unitPrice, "FALSE", "FALSE", "", linePoints];
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Cart!A:Z",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [newRow] },
    });
    return NextResponse.json({ success: true, message: "تمت الإضافة" });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "خطأ بالاضافة" }, { status: 500 });
  }
}
