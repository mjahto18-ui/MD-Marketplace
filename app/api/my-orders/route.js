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
        // ⭐ فصل إحداثيات السائق من خانة وحدة r[26] -> Current Location
        const currentLocation = (r[26] || "").toString().trim();
        let driverLat = null;
        let driverLng = null;

        if (currentLocation && currentLocation.includes(",")) {
          const parts = currentLocation.split(",");
          driverLat = parts[0]?.trim() || null;
          driverLng = parts[1]?.trim() || null;
        }

        return {
          requestID: r[0],
          date: r[3],
          itemsCost: r[15],
          deliveryFee: r[6],
          total: r[16],
          approvalStatus: r[9], // J
          status: r[14],
          freeUsed: r[24] === "TRUE",
          // العميل
          customerLat: (r[29] || "").toString().trim(),
          customerLng: (r[30] || "").toString().trim(),
          // السائق مفصول
          driverLat: driverLat,
          driverLng: driverLng,
        };
      });

    return NextResponse.json({ success: true, orders });
  } catch (e) {
    return NextResponse.json({ success: false, orders: [], error: e.message });
  }
}
