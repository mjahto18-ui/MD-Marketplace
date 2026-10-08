export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryID = searchParams.get("id");
    const lat = parseFloat(searchParams.get("lat"));
    const lng = parseFloat(searchParams.get("lng"));

    if (!categoryID) {
      return NextResponse.json({ success: false, message: "Missing category ID" });
    }

    const supabase = getSupabase();

    // 1. جيب الأبراج النشطة للسلة
    const { data: centers } = await supabase
      .from('geofence_centers')
      .select('*')
      .eq('is_active', true)
      .eq('cart_enabled', true);

    // 2. جيب المتاجر حسب الفئة (بس النشطة)
    const { data: rows } = await supabase
      .from('stores')
      .select('*')
      .eq('Category', String(categoryID).trim())
      .eq('Status', 'Active');

    let allStores = (rows||[]).map(row => {
        return {
          store_id: row["Store ID"],
          store_name: row["Store Name"],
          logo: row["Logo"] || "",
          description: row["Description"] || "",
          category: row["Category"],
          status: row["Status"] || "",
          address: row["Adress"] || "",
          currentLatitude: row["Current Latitude"],
          currentLongitude: row["Current Longitude"],
        };
      });

    // اذا ما في موقع - رجع كلشي (توافق خلفي)
    if (!lat || !lng) {
      // شيل الاحداثيات من الرد مشان ما نغير شكل الـ API القديم
      const clean = allStores.map(({ currentLatitude, currentLongitude, ...rest }) => rest);
      return NextResponse.json({ success: true, stores: clean, filtered: false });
    }

    // 3. أي أبراج بتغطي الزبون؟
    const coveringCenters = [];
    for (let c of (centers||[])) {
      const dist = getDistance(lat, lng, c.center_lat, c.center_lng);
      if (dist <= c.radius_cart) {
        coveringCenters.push(c);
      }
    }

    if (coveringCenters.length === 0) {
      return NextResponse.json({ 
        success: true, 
        stores: [], 
        filtered: true,
        allowed: false,
        message: 'خارج نطاق التغطية' 
      });
    }

    // 4. فلتر المتاجر - لازم يكون ضمن نفس البرج
    const filtered = allStores.filter(store => {
      const sLat = parseFloat(store.currentLatitude);
      const sLng = parseFloat(store.currentLongitude);
      if (!sLat || !sLng) return false;
      
      for (let center of coveringCenters) {
        const d = getDistance(sLat, sLng, center.center_lat, center.center_lng);
        if (d <= center.radius_cart) return true;
      }
      return false;
    });

    // رجع بنفس الشكل القديم بدون احداثيات
    const cleanFiltered = filtered.map(({ currentLatitude, currentLongitude, ...rest }) => rest);

    return NextResponse.json({ 
      success: true, 
      stores: cleanFiltered,
      filtered: true,
      allowed: true,
      covering_centers: coveringCenters.map(c => c.name)
    });

  } catch (err) {
    console.error("by-category error:", err);
    return NextResponse.json({
      success: false,
      message: err.message || "Server Error"
    }, { status: 500 });
  }
}
