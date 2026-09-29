export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getSupabase as getSupabaseLib } from "@/lib/supabase";

function getSupabase() {
  return getSupabaseLib();
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const storeID = searchParams.get("id");

    if (!storeID) {
      return NextResponse.json({ success: false, message: "Missing store ID" });
    }

    const supabase = getSupabase();

    const { data: rows } = await supabase.from('products').select('"Product ID", "Product Name", Image, Price, Unit, Category, "Weight Points", Available, "Stock Qty", Description').eq('Store ID', String(storeID).trim());

    const products = (rows||[]).map(row => {
        return {
          id: row['Product ID'],
          productID: row['Product ID'],
          name: row['Product Name'] || "",
          image: row['Image'] || "",
          price: Number(row['Price'] || 0),
          unit: row['Unit'] || "",
          category: row['Category'] || "",
          weightPoint: Number(row['Weight Points'] || 0),
          available: row['Available'] || "Yes",
          stockQty: Number(row['Stock Qty'] || 0),
          description: row['Description'] || "",
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
