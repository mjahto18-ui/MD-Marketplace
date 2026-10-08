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

export async function GET(req, { params }) {
  try {
    const productID = params.id;
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat"));
    const lng = parseFloat(searchParams.get("lng"));

    if (!productID) {
      return NextResponse.json({ success: false, message: "Missing product ID" });
    }

    const supabase = getSupabase();

    const { data: products } = await supabase.from('products').select('"Product ID", "Store ID", "Product Name", Category, Unit, Price, Image, Description, Available, "Stock Qty", Active, "Weight Points"').eq('Product ID', productID).limit(1);
    let product = products?.[0];

    if (!product) {
      return NextResponse.json({ success: false, message: "المنتج غير موجود" }, { status: 404 });
    }

    // === فلتر البرج - اذا في موقع ===
    if (lat && lng) {
      const { data: centers } = await supabase
       .from('geofence_centers')
       .select('*')
       .eq('is_active', true)
       .eq('cart_enabled', true);

      const coveringCenters = [];
      for (let c of (centers||[])) {
        if (getDistance(lat, lng, c.center_lat, c.center_lng) <= c.radius_cart) {
          coveringCenters.push(c);
        }
      }

      if (coveringCenters.length === 0) {
        return NextResponse.json({
          success: false,
          allowed: false,
          message: 'خارج نطاق التغطية - هالمنتج مش ضمن برجك'
        }, { status: 403 });
      }

      // جيب المتجر تبع المنتج
      const storeId = product['Store ID'];
      const { data: storeRows } = await supabase.from('stores').select('"Store ID", "Current Latitude", "Current Longitude"').eq('Store ID', storeId).limit(1);
      const storeLoc = storeRows?.[0];

      if (storeLoc) {
        const sLat = parseFloat(storeLoc['Current Latitude']);
        const sLng = parseFloat(storeLoc['Current Longitude']);
        let storeAllowed = false;

        for (let center of coveringCenters) {
          if (getDistance(sLat, sLng, center.center_lat, center.center_lng) <= center.radius_cart) {
            storeAllowed = true;
            break;
          }
        }

        if (!storeAllowed) {
          return NextResponse.json({
            success: false,
            allowed: false,
            message: 'هالمنتج من متجر بالقبة وانت بالمينا - مش ضمن نطاقك'
          }, { status: 403 });
        }
      }
    }

    const storeId = product['Store ID'];
    const { data: stores } = await supabase.from('stores').select('"Store ID", "Store Name"').eq('Store ID', storeId).limit(1);
    let store = stores?.[0];

    const productData = {
      productID: product['Product ID'],
      storeID: product['Store ID'],
      name: product['Product Name'],
      category: product['Category'],
      unit: product['Unit'],
      price: Number(product['Price']),
      image: product['Image'],
      description: product['Description'],
      available: product['Available'],
      stock: Number(product['Stock Qty']),
      active: product['Active'],
      weightPoint: Number(product['Weight Points']),
      storeName: store? store['Store Name'] : "متجر محذوف",
    };

    return NextResponse.json({ success: true, product: productData });

  } catch (err) {
    console.error("Product GET Error:", err);
    return NextResponse.json({ success: false, message: "خطأ بجلب المنتج" }, { status: 500 });
  }
}
