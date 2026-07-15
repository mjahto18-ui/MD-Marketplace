export const dynamic = "force-dynamic";
import { getgooglesheets } from "@/lib/googlesheets";

export async function GET(req) {
  const customerID = (req.nextUrl.searchParams.get("customerID") || "").trim().toLowerCase();
  const sheets = await getgooglesheets();
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID || process.env.GOOGLE_SHEET_ID;

  const rew = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Rewards!A:G" });
  let points = 0;
  (rew.data.values?.slice(1) || []).forEach(r => {
    if ((r[1]||"").toLowerCase() === customerID) {
      points += Number(r[5]||0) - Number(r[6]||0);
    }
  });

  const wal = await sheets.spreadsheets.values.get({ spreadsheetId, range: "ts!A:I" });
  let wallet = 0;
  (wal.data.values?.slice(1) || []).forEach(r => {
    if ((r[1]||"").toLowerCase() === customerID) {
      wallet = Number(r[8] || 0); // Balance After
    }
  });

  return Response.json({ success: true, points, wallet });
}
