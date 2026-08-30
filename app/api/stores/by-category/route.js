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
    const categoryID = searchParams.get("id");

    if (!categoryID) {
      return NextResponse.json({ success: false, message: "Missing category ID" });
    }

    const supabase = getSupabase();

    const { data: rows } = await supabase.from('stores').select('*').eq('Category', String(categoryID).trim()).limit(1000);
    let data = rows;
    if (!data?.length) {
      const { data: rows2 } = await supabase.from('stores').select('*').eq('category', String(categoryID).trim()).limit(1000);
      data = rows2;
    }

    if (!data?.length) {
      const { data: allRows } = await supabase.from('stores').select('*');
      data = (allRows||[]).filter(row => {
        const rowCategory = String(row['Category'] || row['category'] || "").trim().replace('.0','');
        return rowCategory === String(categoryID).trim();
      });
    }

    const stores = (data||[]).map(row => {
        return {
          store_id: row["Store ID"] || row["store_id"],
          store_name: row["Store Name"] || row["store_name"],
          logo: row["Logo"] || row["logo"] || "",
          description: row["Description"] || row["description"] || "",
          category: row["Category"] || row["category"],
          status: row["Status"] || row["status"] || "",
          address: row["Adress"] || row["Address"] || row["adress"] || row["address"] || "",
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
