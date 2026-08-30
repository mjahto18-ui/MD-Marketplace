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
    const { searchParams } = new URL(req.url);
    const requestID = searchParams.get("id");

    if (!requestID) {
      return NextResponse.json({ success: false, message: "Missing ID" });
    }

    const supabase = getSupabase();

    // نفس المنطق - find by Request ID [0]
    const { data: rows } = await supabase.from('order_requuest').select('*').eq('Request ID', requestID).limit(1);
    let order = rows?.[0];

    if (!order) {
      const { data } = await supabase.from('order_requuest').select('*').eq('request_id', requestID).limit(1);
      order = data?.[0];
    }

    if (!order) {
      // fallback scan
      const { data: all } = await supabase.from('order_requuest').select('*');
      order = (all||[]).find(r => String(r['Request ID'] || r['request_id'] || r[0] || "").trim() === String(requestID).trim());
    }

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" });
    }

    return NextResponse.json({
      success: true,
      order: {
        requestID: order['Request ID'] || order['request_id'] || order[0],
        totalAmount: order['Delivery Fee'] || order['delivery_fee'] || order['Total'] || order[6],
      },
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Error" });
  }
}
