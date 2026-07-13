export const dynamic = 'force-dynamic';


import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const storeID = searchParams.get("id");

    if (!storeID) {
      return NextResponse.json({ success: false, message: "Missing store ID" });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: "Products!A:Z",
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      return NextResponse.json({ success: true, products: [] });
    }

    const headers = rows[0].map(h => h.trim());
    const data = rows.slice(1);

    // دور على عمود Store ID بأي شكل
    const storeIdIndex = headers.findIndex(h =>
      h.toLowerCase().replace(/\s+/g, '').replace(/_/g, '') === "storeid"
    );

    if (storeIdIndex === -1) {
      return NextResponse.json({
        success: false,
        message: "Store ID column not found in Products sheet",
      });
    }

    // فلترة المنتجات حسب storeID
    const products = data
     .filter(row => {
        const raw = String(row[storeIdIndex]?? "");
        const cleaned = raw
         .trim()
         .replace(/"/g, "")
         .replace(/\u00A0/g, "")
         .replace('.0', ''); // عشان d195a89f ما يصير فيه مشكلة
        return cleaned === String(storeID).trim();
      })
     .map(row => {
        const obj = {};
        headers.forEach((h, i) => {
          obj[h] = row[i] || "";
        });

        return {
          id: obj["Product ID"],
          productID: obj["Product ID"],
          name: obj["Product Name"],
          image: obj["Image"] || "",
          price: Number(obj["Price"] || 0),
          unit: obj["Unit"] || "",
          category: obj["Category"] || "",
          weightPoint: Number(obj["Weight Points"] || obj["WeightPoints"] || 0),
          storeName: obj["Store Name"] || "",
          available: obj["Available"] || "Yes",
          stockQty: Number(obj["Stock Qty"] || obj["StockQty"] || 0),
          description: obj["Description"] || "",
        };
      });

    return NextResponse.json({ success: true, products });

  } catch (err) {
    console.error("by-store error:", err);
    return NextResponse.json({
      success: false,
      error: err.message || "Server Error"
    });
  }
}
