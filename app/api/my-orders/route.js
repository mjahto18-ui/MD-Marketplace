export const dynamic = "force-dynamic";
import { google } from "googleapis";

export async function GET(req) {
  const customerID = req.nextUrl.searchParams.get("customerID");
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const id = process.env.GOOGLE_SHEETS_ID;

  const res = await sheets.spreadsheets.values.get({ range: "Order Requuest!A:AC" });
  const rows = res.data.values || [];
  const header = rows[0] || [];

  // فلتر حسب CustomerID - شوف عندك بأي عمود
  const orders = rows.slice(1).filter(r => r[1] === customerID).reverse().map(r => ({
    requestID: r[0], // A
    date: r[3], // C افترض
    subtotal: r[15], // قبل الدليفري
    deliveryFee: r[6], // الدليفري
    total: r[16], // المجموع
    status: r[14] || r[9], // Delivery Status او Aprproval Status
    freeUsed: r[24], // ==="TRUE"
  }));

  return Response.json({ success: true, orders });
}
