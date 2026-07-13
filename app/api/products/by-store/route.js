import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const storeID = searchParams.get("id");

    if (!storeID) {
      return NextResponse.json({ success: false, message: "Missing store ID" });
    }

    // Auth
    const auth = new google.auth.JWT(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      null,
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      ["https://www.googleapis.com/auth/spreadsheets"]
    );

    const sheets = google.sheets({ version: "v4", auth });

    // Read Products sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Products",
    });

    const rows = response.data.values;
    const headers = rows[0];
    const data = rows.slice(1);

    const storeIdIndex = headers.findIndex(
      h => h.trim().toLowerCase() === "store id"
    );

    const products = data
      .filter(row => String(row[storeIdIndex]).replace(/"/g, "").trim() === storeID.trim())
      .map(row => {
        const obj = {};
        headers.forEach((h, i) => {
          obj[h] = row[i];
        });

        return {
          productID: obj["Product ID"],
          name: obj["Product Name"],
          image: obj["Image"],
          price: Number(obj["Price"]),
          weightPoint: Number(obj["Weight Points"]),
          storeName: obj["Store Name"] || "",
        };
      });

    return NextResponse.json({ success: true, products });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
