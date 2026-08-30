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

    const { data: rows } = await supabase.from('stores').select('*').eq('Category', String(categoryID).trim());

    const stores = (rows||[]).map(row => {
        return {
          store_id: row["Store ID"],
          store_name: row["Store Name"],
          logo: row["Logo"] || "",
          description: row["Description"] || "",
          category: row["Category"],
          status: row["Status"] || "",
          address: row["Adress"] || "",
        };
      });

    return NextResponse.json({ success: true, stores });

  } catch (err) {
    console.error("by-category error:", err);
    return NextResponse.json({
      success: false,
      message: err.message || "Server Error"
    }, { status: 500 });
  }
}
