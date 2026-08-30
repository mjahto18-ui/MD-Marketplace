export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

export async function GET(req) {
  try {
    const storeID = req.nextUrl.searchParams.get("storeID");
    const search = req.nextUrl.searchParams.get("search")?.toLowerCase().trim() || "";
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20", 10);
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1", 10);

    const supabase = getSupabase();

    const { data: productsValues } = await supabase.from('products').select('*');
    const { data: storesValues } = await supabase.from('stores').select('*');

    let productsRows = productsValues || [];

    if (storeID) {
      productsRows = productsRows.filter((row) => String(row['Store ID'] || row['store_id'] || row[1] || "").trim() === String(storeID).trim());
    }

    if (search) {
      productsRows = productsRows.filter((row) => {
        const name = String(row['Name'] || row['name'] || row['Product Name'] || row[2] || "").toLowerCase();
        return name.includes(search);
      });
    }

    const total = productsRows.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedRows = productsRows.slice(start, end);

    const products = paginatedRows.map((row) => {
      const storeIdForRow = row['Store ID'] || row['store_id'] || row[1];
      const store = (storesValues||[]).find((s) => String(s['Store ID'] || s['store_id'] || s[0] || "").trim() === String(storeIdForRow).trim());
      return {
        productID: row['Product ID'] || row['product_id'] || row[0],
        storeID: row['Store ID'] || row['store_id'] || row[1],
        name: row['Name'] || row['name'] || row[2],
        category: row['Category'] || row['category'] || row[3],
        unit: row['Unit'] || row['unit'] || row[4],
        price: Number(row['Price'] || row['price'] || row[5]),
        image: row['Image'] || row['image'] || row[6],
        description: row['Description'] || row['description'] || row[7],
        available: row['Available'] || row['available'] || row[8],
        stock: Number(row['Stock'] || row['stock'] || row[9]),
        active: row['Active'] || row['active'] || row[10],
        weightPoint: Number(row['Weight Point'] || row['weight_point'] || row[11]),
        storeName: store? (store['Store Name'] || store['store_name'] || store[1] || "متجر محذوف") : "متجر محذوف",
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
