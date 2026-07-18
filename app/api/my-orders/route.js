export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(req) {
  try {
    const customerID = req.nextUrl.searchParams.get("customerID");
    if (!customerID) return NextResponse.json({ success: true, orders: [] });

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Order Requuest!A:AC",
    });

    const rows = res.data.values || [];

    const orders = rows
      .slice(1)
      .filter(r => (r[1] || "").toString().trim().toLowerCase() === customerID.toString().trim().toLowerCase())
      .reverse()
      .map(r => {

        // ⭐ فصل إحداثيات السائق من خانة وحدة (Current Location)
        const currentLocation = r[26] || "";
        const [driverLat, driverLng] = currentLocation.split(",");

        return {
          requestID: r[0],
          date: r[3],
          itemsCost: r[15],
          deliveryFee: r[6],
          total: r[16],
          status: r[14],
          freeUsed: r[24] === "TRUE",

          // ⭐ العميل (اتركهون متل ما هني)
          customerLat: r[29],
          customerLng: r[30],

          // ⭐ السائق (هيدا اللي بدنا نفصلو)
          driverLat: driverLat?.trim(),
          driverLng: driverLng?.trim(),
        };
      });

    return NextResponse.json({ success: true, orders });
  } catch (e) {
    return NextResponse.json({ success: false, orders: [], error: e.message });
  }
}
