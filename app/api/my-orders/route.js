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

    const { data: rows } = await supabase.from('order_requuest').select('*').order('Created Date', { ascending: false });

    let allRows = rows;
    if (!allRows?.length) {
      const { data } = await supabase.from('order_requuest').select('*').order('created_date', { ascending: false });
      allRows = data;
    }

    const orders = (allRows||[])
    .filter(r => String(r['Customer ID'] || r['customer_id'] || r[1] || "").trim().toLowerCase() === custIdLower)
    .reverse()
    .map(r => {
        // ⭐ فصل إحداثيات السائق - نفس المنطق
        const currentLocation = String(r['Current Location'] || r['current_location'] || r[26] || "").trim();
        let driverLat = null;
        let driverLng = null;

        if (currentLocation && currentLocation.includes(",")) {
          const parts = currentLocation.split(",");
          driverLat = parts[0]?.trim() || null;
          driverLng = parts[1]?.trim() || null;
        } else {
          driverLat = r['Driver Latitude'] || r['driver_latitude'] || null;
          driverLng = r['Driver Longitude'] || r['driver_longitude'] || null;
        }

        return {
          requestID: r['Request ID'] || r['request_id'] || r[0],
          date: r['Created Date'] || r['created_date'] || r[3],
          itemsCost: r['Items Cost'] || r['items_cost'] || r[15],
          deliveryFee: r['Delivery Fee'] || r['delivery_fee'] || r[6],
          total: r['Total'] || r['total'] || r[16],
          approvalStatus: r['Approval Status'] || r['approval_status'] || r[9],
          status: r['Delivery Status'] || r['delivery_status'] || r[14],
          freeUsed: String(r['Is Free Delivery'] || r['is_free_delivery'] || r[24] || "").toUpperCase() === "TRUE",
          // العميل
          customerLat: String(r['Customer Latitude'] || r['customer_latitude'] || r[29] || "").trim(),
          customerLng: String(r['Customer Longitude'] || r['customer_longitude'] || r[30] || "").trim(),
          // السائق مفصول
          driverLat: driverLat,
          driverLng: driverLng,
        };
      });

    return NextResponse.json({ success: true, orders });
  } catch (e) {
    return NextResponse.json({ success: false, orders: [], error: e.message });
  }
}
