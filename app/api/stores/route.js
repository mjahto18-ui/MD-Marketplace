export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key, {
    auth: { persistSession: false }
  });
}

// نفس دالة المسافة يلي عندك بـ check-geofence
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
    const lat = parseFloat(searchParams.get("lat"));
    const lng = parseFloat(searchParams.get("lng"));

    const supabase = getSupabase();

    // 1. جيب كل الأبراج النشطة يلي السلة مفتوحة فيها
    const { data: centersRaw } = await supabase
      .from('geofence_centers')
      .select('*');
    const centers = (centersRaw||[]).filter(c => c.is_active === true && c.cart_enabled === true);

    // 2. جيب كل المتاجر النشطة
    const { data: dataRows } = await supabase.from('stores').select('*').eq('Status', 'Active');

    let allStores = (dataRows||[]).map((row) => ({
      storeID: row['Store ID'],
      storeName: row['Store Name'],
      category: row['Category'],
      ownerName: row['Owner Name'],
      phone: row['Mobile'],
      area: row['Area'],
      address: row['Adress'],
      description: row['Description'],
      image: row['Logo'],
      status: row['Status'],
      joinDate: row['Join Date'],
      commissionRate: row['Commission Rate'],
      deliveryAvailable: row['Delivery Available'],
      closeTime: row['Close Time'],
      openTime: row['Open Time'],
      currentLatitude: row['Current Latitude'],
      currentLongitude: row['Current Longitude'],
    }));

    // اذا الزبون ما بعت موقع - رجع كلشي (توافق خلفي)
    if (!lat || !lng) {
      const res = NextResponse.json({
        success: true,
        stores: allStores,
        filtered: false
      });
      res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.headers.set('Pragma', 'no-cache');
      res.headers.set('Expires', '0');
      return res;
    }

    // 3. شوف أي أبراج بتغطي الزبون
    const coveringCenters = [];
    for (let c of (centers||[])) {
      const distCustomerToCenter = getDistance(lat, lng, c.center_lat, c.center_lng);
      if (distCustomerToCenter <= c.radius_cart) {
        coveringCenters.push(c);
      }
    }

    // برا التغطية
    if (coveringCenters.length === 0) {
      const res = NextResponse.json({
        success: true,
        stores: [],
        filtered: true,
        allowed: false,
        message: 'خارج نطاق التغطية حالياً - أنت بالقبة ما بتشوف متاجر المينا',
        covering_centers: []
      });
      res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      return res;
    }

    // 4. فلتر المتاجر - المتجر لازم يكون ضمن نفس البرج يلي بيغطي الزبون
    const filteredStores = allStores.filter(store => {
      const sLat = parseFloat(store.currentLatitude);
      const sLng = parseFloat(store.currentLongitude);
      if (!sLat || !sLng) return false;

      // هل المتجر ضمن أي برج من الأبراج يلي بتغطي الزبون؟
      for (let center of coveringCenters) {
        const distStoreToCenter = getDistance(sLat, sLng, center.center_lat, center.center_lng);
        if (distStoreToCenter <= center.radius_cart) {
          return true;
        }
      }
      return false;
    });

    const res = NextResponse.json({
      success: true,
      stores: filteredStores,
      filtered: true,
      allowed: true,
      covering_centers: coveringCenters.map(c => ({ id: c.id, name: c.name, radius_cart: c.radius_cart })),
      total_unfiltered: allStores.length,
      total_filtered: filteredStores.length
    });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.headers.set('Pragma', 'no-cache');
    res.headers.set('Expires', '0');
    res.headers.set('CDN-Cache-Control', 'no-store');
    res.headers.set('Vercel-CDN-Cache-Control', 'no-store');
    return res;

  } catch (err) {
    console.error("Stores GET Error:", err);
    return NextResponse.json(
      { success: false, message: "خطأ بجلب المتاجر" },
      { status: 500 }
    );
  }
}
