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

    const { data: rows } = await supabase.from('order_requuest').select('*').eq('Request ID', requestID).limit(1);
    let order = rows?.[0];

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" });
    }

    return NextResponse.json({
      success: true,
      order: {
        requestID: order['Request ID'],
        totalAmount: order['Total Amount'],
        deliveryFee: order['Delivery Fee'],
        itemsCost: order['Items Cost'],
        deliveryStatus: order['Delivery Status'],
        approvalStatus: order['Approval Status'],
      },
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Error" });
  }
}
