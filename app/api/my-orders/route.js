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
    const customerID = req.nextUrl.searchParams.get("customerID");
    if (!customerID) return NextResponse.json({ success: true, orders: [] });

    const supabase = getSupabase();
    const custIdLower = customerID.toString().trim().toLowerCase();

    const { data: rows } = await supabase.from('order_requuest').select('*').order('Cerated Date', { ascending: false });

    const orders = (rows||[])
   .filter(r => String(r['customer ID'] || "").trim().toLowerCase() === custIdLower)
   .map(r => {
        const currentLocation = String(r['Current Location'] || "").trim();
        let driverLat = null;
        let driverLng = null;

        if (currentLocation && currentLocation.includes(",")) {
          const parts = currentLocation.split(",");
          driverLat = parts[0]?.trim() || null;
          driverLng = parts[1]?.trim() || null;
        }

        return {
          requestID: r['Request ID'],
          date: r['Cerated Date'],
          itemsCost: r['Items Cost'],
          deliveryFee: r['Delivery Fee'],
          total: r['Total Amount'],
          approvalStatus: r['Approval Status'],
          status: r['Delivery Status'],
          freeUsed: String(r['Free Delivery Used'] || "").toUpperCase() === "TRUE",
          customerLat: String(r['Customer Latitude'] || "").trim(),
          customerLng: String(r['Customer Longitude'] || "").trim(),
          driverLat: driverLat,
          driverLng: driverLng,
        };
      });

    return NextResponse.json({ success: true, orders });
  } catch (e) {
    return NextResponse.json({ success: false, orders: [], error: e.message });
  }
}
