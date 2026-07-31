export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(req) {
  try {
    const storeID = req.nextUrl.searchParams.get("storeID");
    const search = req.nextUrl.searchParams.get("search")?.toLowerCase().trim() || "";
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20", 10);
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1", 10);

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    const [productsRes, storesRes] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId, range: "Products!A:L" }),
      sheets.spreadsheets.values.get({ spreadsheetId, range: "Stores!A:O" }),
    ]);

    const productsRows = (productsRes.data.values || []).slice(1);
    const storesData = (storesRes.data.values || []).slice(1);

    // 1. فلترة بالمتجر - نفس منطقك القديم
    let filteredProducts = productsRows;
    if (storeID) {
      filteredProducts = productsRows.filter((row) => row[1] === storeID);
    }

    // 2. فلترة بالبحث - جديد: بيدور بكل المنتجات على السيرفر حتى رقم 720
    if (search) {
      filteredProducts = filteredProducts.filter((row) => {
        const name = (row[2] || "").toLowerCase();
        return name.includes(search);
      });
    }

    // 3. Pagination - جديد: بياخد بس 20
    const total = filteredProducts.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedRows = filteredProducts.slice(start, end);

    const products = paginatedRows.map((row) => {
      const store = storesData.find((s) => s[0] === row[1]);
      return {
        productID: row[0],
        storeID: row[1],
        name: row[2],
        category: row[3],
        unit: row[4],
        price: Number(row[5]),
        image: row[6],
        description: row[7],
        available: row[8],
        stock: Number(row[9]),
        active: row[10],
        weightPoint: Number(row[11]),
        storeName: store? store[1] : "متجر محذوف",
      };
    });

    return NextResponse.json({
      success: true,
      products,
      total,
      page,
      hasMore: end < total,
    });

  } catch (err) {
    console.error("Products GET Error:", err);
    return NextResponse.json(
      { success: false, message: "خطأ بجلب المنتجات" },
      { status: 500 }
    );
  }
}
