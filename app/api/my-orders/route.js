export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(req) {
  try {
    const customerID = req.nextUrl.searchParams.get("customerID");
    if (!customerID) {
      return NextResponse.json({ success: true, orders: [] }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    }

    const supabase = getSupabase();
    const custId = String(customerID).trim();

    const { data: rows, error } = await supabase
      .from('order_requuest')
      .select('"Request ID", "Cerated Date", "Pickup At", "Items Cost", "Delivery Fee", "Total Amount", "Approval Status", "Delivery Status", "Free Delivery Used", "Customer Latitude", "Customer Longitude", "Current Location"')
      .ilike('"customer ID"', custId)
      .order('"Cerated Date"', { ascending: false });

    if (error) throw error;

    const orders = (rows||[]).map(r => {
      const currentLocation = String(r['Current Location'] || "").trim();
      let driverLat = null, driverLng = null;
      if (currentLocation.includes(",")) {
        const [lat,lng] = currentLocation.split(",");
        driverLat = lat?.trim() || null;
        driverLng = lng?.trim() || null;
      }
      return {
        requestID: r['Request ID'],
        date: r['Cerated Date'],
        pickupAt: r['Pickup At'],
        itemsCost: r['Items Cost'],
        deliveryFee: r['Delivery Fee'],
        total: r['Total Amount'],
        approvalStatus: r['Approval Status'],
        status: r['Delivery Status'],
        freeUsed: String(r['Free Delivery Used'] || "").toUpperCase() === "TRUE",
        customerLat: String(r['Customer Latitude'] || "").trim(),
        customerLng: String(r['Customer Longitude'] || "").trim(),
        driverLat, driverLng,
      };
    });

    return NextResponse.json({ success: true, orders }, { 
      headers: { 
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
      } 
    });
  } catch (e) {
    return NextResponse.json({ success: false, orders: [], error: e.message }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  }
}
