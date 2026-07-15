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

  // 1. النقاط
  const rew = await sheets.spreadsheets.values.get({ range: "Rewards!A:G" });
  const rewRows = rew.data.values?.slice(1).filter(r => r[1] === customerID) || [];
  let points = 0;
  rewRows.forEach(r => {
    points += Number(r[5] || 0); // F = Points Added
    points -= Number(r[6] || 0); // G = Points Used
  });

  // 2. المحفظة - ناخد اخر Balance After
  const wal = await sheets.spreadsheets.values.get({ range: "Wallet Transactions!A:I" });
  const walRows = wal.data.values?.slice(1).filter(r => r[1] === customerID) || [];
  let wallet = 0;
  if (walRows.length > 0) {
    // اخر حركة هي الرصيد
    const last = walRows[walRows.length - 1];
    wallet = Number(last[8] || 0); // I = Balance After
    // اذا فاضي، احسب SUM Amount
    if (!wallet) {
      walRows.forEach(r => wallet += Number(r[4] || 0));
    }
  }

  return Response.json({ success: true, points, wallet });
}
