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

    const { data: rows } = await supabase.from('products').select('*').eq('Store ID', String(storeID).trim());

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
