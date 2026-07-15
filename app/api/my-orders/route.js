export const dynamic = "force-dynamic";
import { google } from "googleapis";

export async function GET(req) {
  const customerID = req.nextUrl.searchParams.get("customerID");
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const id = process.env.GOOGLE_SHEETS_ID;

  const res = await sheets.spreadsheets.values.get({ range: "Order Request!A:Z" });
  const rows = res.data.values || [];
  const header = rows[0] || [];

  // فلتر حسب CustomerID - شوف عندك بأي عمود
  const orders = rows.slice(1).filter(r => r[1] === customerID).reverse().map(r => ({
    requestID: r[0], // A
    date: r[2], // C افترض
    subtotal: r[4], // قبل الدليفري
    deliveryFee: r[5], // الدليفري
    total: r[6], // المجموع
    status: r[7], // Status
  }));

  return Response.json({ success: true, orders });
}
