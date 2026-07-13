import { NextResponse } from "next/server";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const storeID = searchParams.get("id");

    if (!storeID) {
      return NextResponse.json({ success: false, message: "Missing store ID" });
    }

    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();

    const sheet = doc.sheetsByTitle["Products"];
    const rows = await sheet.getRows();

    const products = rows
      .filter(r => String(r["Store ID"]).replace(/"/g, "").trim() === storeID.trim())
      .map(r => ({
        productID: r["Product ID"],
        name: r["Product Name"],
        image: r["Image"],
        price: Number(r["Price"]),
        weightPoint: Number(r["Weight Points"]),
        storeName: r["Store Name"] || "",
      }));

    return NextResponse.json({ success: true, products });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
