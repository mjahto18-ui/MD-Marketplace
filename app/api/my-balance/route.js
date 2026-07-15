export const dynamic = "force-dynamic";
import { google } from "googleapis";

export async function GET(req) {
  const customerID = (req.nextUrl.searchParams.get("customerID") || "").trim().toLowerCase();
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const id = process.env.GOOGLE_SHEETS_ID;

  // 1. النقاط من Rewards
  const rew = await sheets.spreadsheets.values.get({ spreadsheetId: id, range: "Rewards!A:G" });
  let points = 0;
  (rew.data.values?.slice(1) || []).forEach(r => {
    if ((r[1]||"").toLowerCase() === customerID) {
      points += Number(r[5]||0) - Number(r[6]||0); // Points Added - Points Used
    }
  });

  // 2. المحفظة - عندك اسم الشيت هو ts او Transactions
  let wallet = 0;
  try {
    const wal = await sheets.spreadsheets.values.get({ spreadsheetId: id, range: "ts!A:I" });
    (wal.data.values?.slice(1) || []).forEach(r => {
      if ((r[1]||"").toLowerCase() === customerID) {
        wallet = Number(r[8] || r[4] || 0); // Balance After او Amount
      }
    });
  } catch {}

  return Response.json({ success: true, points, wallet });
}
