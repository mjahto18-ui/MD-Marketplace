import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryID = searchParams.get("id");

    if (!categoryID) {
      return NextResponse.json({ success: false, message: "Missing category ID" });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Stores!A:Z",
    });

    const rows = res.data.values || [];
    if (rows.length <= 1) {
      return NextResponse.json({ success: true, stores: [] });
    }

    const headers = rows[0].map(h => h.trim());
    const data = rows.slice(1);

    // عمود Category في شيت Stores
    const categoryIndex = headers.findIndex(h => h.toLowerCase() === 'category');

    if (categoryIndex === -1) {
      return NextResponse.json({
        success: false,
        message: "Category column not found in Stores sheet"
      });
    }

    const stores = data
     .filter(row => {
        const rowCategory = String(row[categoryIndex] || "")
         .trim()
         .replace('.0', ''); // عشان 3002.0 تصير 3002
        return rowCategory === String(categoryID).trim();
      })
     .map(row => {
        const store = {};
        headers.forEach((h, i) => store[h] = row[i] || "");

        return {
          store_id: store["Store ID"],
          store_name: store["Store Name"],
          logo: store["Logo"] || "",
          description: store["Description"] || "",
          category: store["Category"],
          status: store["Status"] || "",
          address: store["Adress"] || store["Address"] || "",
        };
      });

    return NextResponse.json({ success: true, stores });

  } catch (err) {
    console.error("by-category error:", err);
    return NextResponse.json({
      success: false,
      message: err.message || "Server Error"
    });
  }
}
