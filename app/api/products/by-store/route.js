export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const storeID = searchParams.get("id");

    if (!storeID) {
      return NextResponse.json({ success: false, message: "Missing store ID" });
    }

    const supabase = getSupabase();

    const { data: rows } = await supabase.from('products').select('*').eq('Store ID', String(storeID).trim()).limit(1000);
    let data = rows;
    if (!data?.length) {
      const { data: rows2 } = await supabase.from('products').select('*').eq('store_id', String(storeID).trim()).limit(1000);
      data = rows2;
    }

    if (!data?.length) {
      const { data: allRows } = await supabase.from('products').select('*');
      data = (allRows||[]).filter(row => {
        const raw = String(row['Store ID'] || row['store_id'] || row[1] || "");
        const cleaned = raw.trim().replace(/"/g, "").replace(/\u00A0/g, "").replace('.0', '');
        return cleaned === String(storeID).trim();
      });
    }

    // نفس mapping - فلترة المنتجات حسب storeID
    const products = (data||[]).map(row => {
        return {
          id: row['Product ID'] || row['product_id'] || row[0],
          productID: row['Product ID'] || row['product_id'] || row[0],
          name: row['Product Name'] || row['Name'] || row['product_name'] || row['name'] || "",
          image: row['Image'] || row['image'] || "",
          price: Number(row['Price'] || row['price'] || 0),
          unit: row['Unit'] || row['unit'] || "",
          category: row['Category'] || row['category'] || "",
          weightPoint: Number(row['Weight Points'] || row['WeightPoints'] || row['weight_points'] || 0),
          storeName: row['Store Name'] || row['store_name'] || "",
          available: row['Available'] || row['available'] || "Yes",
          stockQty: Number(row['Stock Qty'] || row['StockQty'] || row['stock_qty'] || 0),
          description: row['Description'] || row['description'] || "",
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
