export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = 'force-no-store';

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
      const res = NextResponse.json({ success: false, message: "Missing ID" });
      res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      res.headers.set('Pragma', 'no-cache');
      res.headers.set('Expires', '0');
      res.headers.set('CDN-Cache-Control', 'no-store');
      res.headers.set('Vercel-CDN-Cache-Control', 'no-store');
      return res;
    }
    const supabase = getSupabase();
    const { data: rows } = await supabase.from('special_orders').select('*').eq('Request ID', requestID).limit(1);
    let order = rows?.[0];
    if (!order) {
      const res = NextResponse.json({ success: false, message: "Order not found" });
      res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      res.headers.set('Pragma', 'no-cache');
      res.headers.set('Expires', '0');
      res.headers.set('CDN-Cache-Control', 'no-store');
      res.headers.set('Vercel-CDN-Cache-Control', 'no-store');
      return res;
    }
    const res = NextResponse.json({
      success: true,
      order: {
        requestID: order['Request ID'],
        orderText: order['الطلب'],
        quantity: order['Quantity'],
        status: order['Status'],
        totalAmount: order['Total Amount'],
      },
    });
    // === شيل الكاش بالمرة ===
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.headers.set('Pragma', 'no-cache');
    res.headers.set('Expires', '0');
    res.headers.set('CDN-Cache-Control', 'no-store');
    res.headers.set('Vercel-CDN-Cache-Control', 'no-store');
    return res;
  } catch (err) {
    console.error(err);
    const res = NextResponse.json({ success: false, message: "Error" }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.headers.set('Pragma', 'no-cache');
    res.headers.set('Expires', '0');
    res.headers.set('CDN-Cache-Control', 'no-store');
    res.headers.set('Vercel-CDN-Cache-Control', 'no-store');
    return res;
  }
}
