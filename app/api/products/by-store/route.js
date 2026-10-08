export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextResponse } from "next/server";
import { getSupabase as getSupabaseLib } from "@/lib/supabase";

function getSupabase() {
  return getSupabaseLib();
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // كيلو
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // كيلو
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const storeID = searchParams.get("id");
    const lat = parseFloat(searchParams.get("lat"));
    const lng = parseFloat(searchParams.get("lng"));

    if (!storeID) {
      const res = NextResponse.json({ success: false, message: "Missing store ID" });
      res.headers.set('Cache-Control', 'no-store');
      res.headers.set('CDN-Cache-Control', 'no-store');
      res.headers.set('Vercel-CDN-Cache-Control', 'no-store');
      return res;
    }

    const supabase = getSupabase();

    // === فلتر البرج اذا في موقع ===
    if (lat && lng) {
      const { data: centersRaw } = await supabase
      .from('geofence_centers')
      .select('*');
      const centers = (centersRaw||[]).filter(c => c.is_active === true && c.cart_enabled === true);

      const coveringCenters = [];
      for (let c of (centers||[])) {
        if (getDistance(lat, lng, c.center_lat, c.center_lng) <= c.radius_cart) {
          coveringCenters.push(c);
        }
      }

      if (coveringCenters.length === 0) {
        const res = NextResponse.json({ success: true, products: [], allowed: false, message: 'خارج التغطية' });
        res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        res.headers.set('CDN-Cache-Control', 'no-store');
        res.headers.set('Vercel-CDN-Cache-Control', 'no-store');
        return res;
      }

      // جيب موقع المتجر المطلوب
      const { data: storeRows } = await supabase.from('stores').select('"Store ID", "Current Latitude", "Current Longitude"').eq('Store ID', String(storeID).trim()).limit(1);
      const storeLoc = storeRows?.[0];

      if (storeLoc) {
        const sLat = parseFloat(storeLoc['Current Latitude']);
        const sLng = parseFloat(storeLoc['Current Longitude']);
        let allowed = false;
        for (let center of coveringCenters) {
          if (getDistance(sLat, sLng, center.center_lat, center.center_lng) <= center.radius_cart) {
            allowed = true; break;
          }
        }
        if (!allowed) {
          const res = NextResponse.json({
            success: true,
            products: [],
            allowed: false,
            message: 'هالمتجر بالقبة وانت بالمينا - مش ضمن نطاقك'
          });
          res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
          res.headers.set('CDN-Cache-Control', 'no-store');
          res.headers.set('Vercel-CDN-Cache-Control', 'no-store');
          return res;
        }
      }
    }

    const { data: rows } = await supabase.from('products').select('"Product ID", "Product Name", Image, Price, Unit, Category, "Weight Points", Available, "Stock Qty", Description').eq('Store ID', String(storeID).trim());

    const products = (rows||[]).map(row => ({
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
    }));

    const res = NextResponse.json({ success: true, products });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.headers.set('Pragma', 'no-cache');
    res.headers.set('Expires', '0');
    res.headers.set('CDN-Cache-Control', 'no-store');
    res.headers.set('Vercel-CDN-Cache-Control', 'no-store');
    return res;

  } catch (err) {
    console.error("by-store error:", err);
    const res = NextResponse.json({ success: false, error: err.message || "Server Error" });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
