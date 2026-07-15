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

    const cust = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Wallet Transactions!A:Z" });
    let wallet = 0;
    const found = (cust.data.values||[]).slice(1).find(r => (r[0]||"").toString().trim().toLowerCase() === customerID.toString().trim().toLowerCase() || (r[1]||"").toString().trim().toLowerCase() === customerID.toString().trim().toLowerCase());
    if(found) wallet = Number(found[found.length-1] || found[8] || 0); // اخر عمود غالبا هو الرصيد

    return NextResponse.json({ success: true, points, wallet });
  } catch (e) {
    return NextResponse.json({ success: true, points: 0, wallet: 0, error: e.message });
  }
}
