export const dynamic = "force-dynamic";
import { getgooglesheets } from "@/lib/googlesheets";

export async function GET(req) {
  const customerID = (req.nextUrl.searchParams.get("customerID") || "").trim();
  const sheets = await getgooglesheets();
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID || process.env.GOOGLE_SHEET_ID;

  // عندك الاسم فيه typo ب 2 u
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Order Requuest!A:AC",
  });

  const rows = res.data.values || [];
  const orders = rows.slice(1)
   .filter(r => (r[1]||"").trim() === customerID)
   .reverse()
   .map(r => ({
      requestID: r[0],
      date: r[3],
      itemsCost: r[15],
      deliveryFee: r[6],
      total: r[16],
      status: r[14] || r[9] || "Pending", // Delivery Status او Approval Status
      freeUsed: r[24] === "TRUE",
    }));

  return Response.json({ success: true, orders });
}
