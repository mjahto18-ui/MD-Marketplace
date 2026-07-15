export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(req) {
  try {
    const customerID = req.nextUrl.searchParams.get("customerID");
    if (!customerID) return NextResponse.json({ success: true, points: 0, wallet: 0 });
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    const rew = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Rewards!A:Z" });
    let points = 0;
    (rew.data.values||[]).slice(1).forEach(r => { if((r[1]||"").toString().trim().toLowerCase() === customerID.toString().trim().toLowerCase()) points += Number(r[5]||0) - Number(r[6]||0); });

   const cust = await sheets.spreadsheets.values.get({
  spreadsheetId,
  range: "Wallet Transactions!A:Z",
});

let wallet = 0;

(cust.data.values || [])
  .slice(1)
  .forEach((r) => {
    const id = (r[1] || "").toString().trim().toLowerCase();
    const type = (r[3] || "").toString().trim().toLowerCase(); // غيّر رقم العمود إذا Type بمكان آخر
    const amount = Number(r[4] || 0);

    if (id === customerID.toString().trim().toLowerCase()) {
      switch (type) {
        case "Deduct":
          wallet -= amount;
          break;

        case "Add":
        case "Refund":
        case "Points":
          wallet += amount;
          break;

        default:
          wallet += amount;
          break;
      }
    }
  });
    return NextResponse.json({ success: true, points, wallet });
  } catch (e) {
    return NextResponse.json({ success: true, points: 0, wallet: 0, error: e.message });
  }
}
