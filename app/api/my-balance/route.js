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

    // 1. النقاط - هذا شغال
    const rew = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Rewards!A:G" });
    let points = 0;
    (rew.data.values?.slice(1) || []).forEach(r => {
      if ((r[1]||"").trim() === customerID.trim()) {
        points += Number(r[5]||0) - Number(r[6]||0);
      }
    });

    // 2. المحفظة - نجرب كل الاسماء المحتملة
    let wallet = 0;
    let walRows = [];
    const possibleNames = ["Wallet Transactions"];

    for (const name of possibleNames) {
      try {
        const wal = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `'${name}'!A:I`
        });
        if (wal.data.values && wal.data.values.length > 1) {
          walRows = wal.data.values;
          break; // لقينا الشيت
        }
      } catch {}
    }

    walRows.slice(1).forEach(r => {
      if ((r[1]||"").trim() === customerID.trim()) {
        wallet = Number(r[8]||0);
      }
    });

    return NextResponse.json({ success: true, points, wallet, foundRows: walRows.length });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
