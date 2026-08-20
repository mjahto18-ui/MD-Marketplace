// الملف المصلح: app/api/products/route.js
// انسخ هاد مكان ملفك الحالي

export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getCachedProductsAndStores } from "@/lib/googlesheets"; // استخدم ملفك الحالي

export async function GET(req) {
  try {
    const storeID = req.nextUrl.searchParams.get("storeID");
    const search = req.nextUrl.searchParams.get("search")?.toLowerCase().trim() || "";
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20", 10);
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1", 10);

    // هون بيجيب من الكاش - 50 زبون = ضربة وحدة لـ Google
    const { productsValues, storesValues } = await getCachedProductsAndStores();
    
    const productsRows = productsValues.slice(1);
    const storesData = storesValues.slice(1);

    let filteredProducts = productsRows;
    if (storeID) {
      filteredProducts = productsRows.filter((row) => row[1] === storeID);
    }

    if (search) {
      filteredProducts = filteredProducts.filter((row) => {
        const name = (row[2] || "").toLowerCase();
        return name.includes(search);
      });
    }

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
        storeName: store ? store[1] : "متجر محذوف",
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
