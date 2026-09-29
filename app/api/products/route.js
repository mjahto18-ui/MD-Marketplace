export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getSupabase as getSupabaseLib } from "@/lib/supabase";

function getSupabase() {
  return getSupabaseLib();
}

export async function GET(req) {
  try {
    const storeID = req.nextUrl.searchParams.get("storeID");
    const search = req.nextUrl.searchParams.get("search")?.trim() || "";
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20", 10);
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1", 10);

    const supabase = getSupabase();

    let query = supabase.from('products').select('"Product ID", "Store ID", "Product Name", Category, Unit, Price, Image, Description, Available, "Stock Qty", Active, "Weight Points"', { count: 'exact' });

    if (storeID) {
      query = query.eq('Store ID', String(storeID).trim());
    }

    if (search) {
      query = query.ilike('Product Name', `%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data: productsRows, count, error } = await query.range(from, to);

    if (error) throw error;

    // جلب اسماء المتاجر للمنتجات المعروضة فقط
    const storeIds = [...new Set((productsRows||[]).map(r => r['Store ID']).filter(Boolean))];
    let storesMap = {};
    if (storeIds.length > 0) {
      const { data: storesValues } = await supabase.from('stores').select('"Store ID", "Store Name"').in('Store ID', storeIds);
      (storesValues||[]).forEach(s => {
        storesMap[s['Store ID']] = s['Store Name'];
      });
    }

    const products = (productsRows||[]).map((row) => {
      return {
        productID: row['Product ID'],
        storeID: row['Store ID'],
        name: row['Product Name'],
        category: row['Category'],
        unit: row['Unit'],
        price: Number(row['Price']),
        image: row['Image'],
        description: row['Description'],
        available: row['Available'],
        stock: Number(row['Stock Qty']),
        active: row['Active'],
        weightPoint: Number(row['Weight Points']),
        storeName: storesMap[row['Store ID']] || "متجر محذوف",
      };
    });

    return NextResponse.json({
      success: true,
      products,
      total: count || 0,
      page,
      hasMore: from + products.length < (count || 0),
    });

  } catch (err) {
    console.error("Products GET Error:", err);
    return NextResponse.json(
      { success: false, message: "خطأ بجلب المنتجات" },
      { status: 500 }
    );
  }
}
