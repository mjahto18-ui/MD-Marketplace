export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getSupabase as getSupabaseLib } from "@/lib/supabase";

function getSupabase() {
  return getSupabaseLib();
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
    const storeID = req.nextUrl.searchParams.get("storeID");
    const search = req.nextUrl.searchParams.get("search")?.trim() || "";
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20", 10);
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1", 10);
    const lat = parseFloat(req.nextUrl.searchParams.get("lat"));
    const lng = parseFloat(req.nextUrl.searchParams.get("lng"));

    const supabase = getSupabase();

    // === 1. اذا في موقع، حدد الأبراج يلي بتغطي الزبون ===
    let allowedStoreIds = null; // null = ما في فلتر
    let coveringCenters = [];
    
    if (lat && lng) {
      const { data: centers } = await supabase
        .from('geofence_centers')
        .select('*')
        .eq('is_active', true)
        .eq('cart_enabled', true);

      // أي برج بيغطي الزبون؟
      for (let c of (centers||[])) {
        const dist = getDistance(lat, lng, c.center_lat, c.center_lng);
        if (dist <= c.radius_cart) {
          coveringCenters.push(c);
        }
      }

      // الزبون برا التغطية - ما بيشوف ولا منتج
      if (coveringCenters.length === 0) {
        return NextResponse.json({
          success: true,
          products: [],
          total: 0,
          page,
          hasMore: false,
          filtered: true,
          allowed: false,
          message: 'خارج نطاق التغطية - ما في منتجات بالقبة اذا انت بالمينا'
        });
      }

      // جيب كل المتاجر النشطة وشوف أي متجر ضمن نفس البرج
      const { data: allStores } = await supabase
        .from('stores')
        .select('"Store ID", "Current Latitude", "Current Longitude"')
        .eq('Status', 'Active');

      const allowed = [];
      for (let s of (allStores||[])) {
        const sLat = parseFloat(s['Current Latitude']);
        const sLng = parseFloat(s['Current Longitude']);
        if (!sLat || !sLng) continue;

        for (let center of coveringCenters) {
          const d = getDistance(sLat, sLng, center.center_lat, center.center_lng);
          if (d <= center.radius_cart) {
            allowed.push(s['Store ID']);
            break;
          }
        }
      }

      allowedStoreIds = allowed; // حتى لو فاضي
    }

    // === 2. ابنِ كويري المنتجات ===
    let query = supabase.from('products').select('"Product ID", "Store ID", "Product Name", Category, Unit, Price, Image, Description, Available, "Stock Qty", Active, "Weight Points"', { count: 'exact' });

    // اذا في فلتر أبراج - طبقو
    if (allowedStoreIds !== null) {
      if (allowedStoreIds.length === 0) {
        return NextResponse.json({
          success: true,
          products: [],
          total: 0,
          page,
          hasMore: false,
          filtered: true,
          allowed: true,
          covering_centers: coveringCenters.map(c => c.name)
        });
      }
      query = query.in('Store ID', allowedStoreIds);
    }

    if (storeID) {
      // اذا المتجر المطلوب مش ضمن نطاق الزبون، رجع فاضي
      if (allowedStoreIds !== null && !allowedStoreIds.includes(String(storeID).trim())) {
        return NextResponse.json({
          success: true,
          products: [],
          total: 0,
          page,
          hasMore: false,
          filtered: true,
          allowed: false,
          message: 'هالمتجر مش ضمن برجك - انت بالقبة والمتجر بالمينا'
        });
      }
      query = query.eq('Store ID', String(storeID).trim());
    }

    if (search) {
      query = query.ilike('Product Name', `%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data: productsRows, count, error } = await query.range(from, to);

    if (error) throw error;

    // جلب اسماء المتاجر للمنتجات المعروضة فقط
    const storeIds = [...new Set((productsRows||[]).map(r => r['Store ID']).filter(Boolean))];
    let storesMap = {};
    if (storeIds.length > 0) {
      const { data: storesValues } = await supabase.from('stores').select('"Store ID", "Store Name"').in('Store ID', storeIds);
      (storesValues||[]).forEach(s => {
        storesMap[s['Store ID']] = s['Store Name'];
      });
    }

    const products = (productsRows||[]).map((row) => {
      return {
        productID: row['Product ID'],
        storeID: row['Store ID'],
        name: row['Product Name'],
        category: row['Category'],
        unit: row['Unit'],
        price: Number(row['Price']),
        image: row['Image'],
        description: row['Description'],
        available: row['Available'],
        stock: Number(row['Stock Qty']),
        active: row['Active'],
        weightPoint: Number(row['Weight Points']),
        storeName: storesMap[row['Store ID']] || "متجر محذوف",
      };
    });

    return NextResponse.json({
      success: true,
      products,
      total: count || 0,
      page,
      hasMore: from + products.length < (count || 0),
      filtered: allowedStoreIds !== null,
      allowed: true,
      covering_centers: coveringCenters.map(c => c.name)
    });

  } catch (err) {
    console.error("Products GET Error:", err);
    return NextResponse.json(
      { success: false, message: "خطأ بجلب المنتجات" },
      { status: 500 }
    );
  }
}
