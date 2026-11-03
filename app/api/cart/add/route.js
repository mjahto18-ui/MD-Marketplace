import { NextResponse } from "next/server";
import { getSupabase as getSupabaseLib } from "@/lib/supabase";
import { cookies } from "next/headers";
import { getGlobalConfig } from "@/lib/getGlobalConfig";

export const dynamic = "force-dynamic";

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

export async function POST(req) {
  try {
    const config = await getGlobalConfig();

    if (config.isLocked) {
      return NextResponse.json({
        success: false,
        message: config.emergency_lock?.message || "المنصة متوقفة حداداً"
      }, { status: 403 });
    }

    if (config.isCartClosed) {
      return NextResponse.json({
        success: false,
        isClosed: true,
        message: config.cart_closed_message || "السلة مغلقة حالياً"
      }, { status: 403 });
    }

    const { productID, qty = 1, lat, lng } = await req.json();
    if (!productID) return NextResponse.json({ success: false, message: "Missing product" }, { status: 400 });

    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) return NextResponse.json({ success: false, message: "لازم تسجل دخول" }, { status: 401 });

    let phone;
    try {
      const s = JSON.parse(sessionCookie);
      phone = s.phone || s.Mobile || s.user?.phone || sessionCookie;
    } catch { phone = sessionCookie; }

    const supabase = getSupabase();
    const phoneStr = String(phone).trim();
    const phoneNoZero = phoneStr.replace(/^0+/, '');

    let customerID = null;
    let { data: customer } = await supabase.from('customers')
      .select('"Customer ID"')
      .or(`Mobile.eq.${phoneStr},Mobile.eq.${phoneNoZero}`)
      .maybeSingle();

    if (customer) {
      customerID = customer["Customer ID"];
    } else {
      const { data: customer3 } = await supabase.from('customers')
        .select('"Customer ID"')
        .eq('Customer ID', phoneStr)
        .maybeSingle();
      if (customer3) customerID = customer3["Customer ID"];
    }

    if (!customerID) return NextResponse.json({ success: false, message: "حسابك مش موجود" }, { status: 401 });

    // === جيب المنتج مع المتجر ونوع التغطية ===
    const { data: product } = await supabase.from('products')
      .select('"Product ID", Price, "Store ID", "Weight Points"')
      .eq('Product ID', productID)
      .maybeSingle();

    if (!product) return NextResponse.json({ success: false, message: "المنتج غير موجود" });

    // جيب نوع التغطية تبع متجر المنتج
    const { data: storeData } = await supabase.from('stores')
      .select('coverage_type')
      .eq('Store ID', product["Store ID"])
      .maybeSingle();
    
    const newProductCoverage = storeData?.coverage_type || 'geofence';

    // === حماية جيوفنس - بس اذا المنتج geofence ===
    if (newProductCoverage === 'geofence') {
      if (!lat || !lng) {
        return NextResponse.json({ success: false, geofenced: true, message: "ما قدرنا نحدد موقعك" }, { status: 403 });
      }
      const { data: centers } = await supabase.from('geofence_centers').select('*').eq('is_active', true).eq('cart_enabled', true);
      let allowed = false;
      for (let c of (centers||[])) {
        const radius = c['radius_cart'];
        const dist = getDistance(Number(lat), Number(lng), c.center_lat, c.center_lng);
        if (dist <= radius) { allowed = true; break; }
      }
      if (!allowed) {
        return NextResponse.json({ success: false, geofenced: true, message: "خارج نطاق التغطية حالياً" }, { status: 403 });
      }
    }
    // اذا global - ما في فحص جيو، بيمرق حتى برا التغطية

    const unitPrice = Number(product["Price"] || 0);
    const storeID = product["Store ID"] || "";
    const linePoints = Number(product["Weight Points"] || 0);

    // === فحص الخلط - هل السلة فيها نوع تاني؟ ===
    const { data: existingCart } = await supabase.from('cart')
      .select('"Product ID", "Store ID"')
      .eq('Customer ID', customerID)
      .eq('Checked Out', 'FALSE');

    if (existingCart && existingCart.length > 0) {
      const existingStoreIds = [...new Set(existingCart.map(r => r["Store ID"]).filter(Boolean))];
      if (existingStoreIds.length > 0) {
        const { data: existingStores } = await supabase.from('stores')
          .select('"Store ID", coverage_type')
          .in('Store ID', existingStoreIds);
        
        const existingCoverage = existingStores?.[0]?.coverage_type || 'geofence';
        
        if (existingCoverage !== newProductCoverage) {
          return NextResponse.json({ 
            success: false, 
            message: existingCoverage === 'global' 
              ? "سلة التوصيل لكل لبنان لا يمكنك اضافة عليها طلب منتج توصيل سريع - يرجى الانتهاء من طلبك الحالي أولا"
              : "سلة التوصيل السريع لا يمكنك اضافة عليها منتج يحتاج اكثر من يومين توصيل - يرجى الانتهاء من طلبك الحالي أولا"
          }, { status: 400 });
        }
      }
    }

    // === Cart - بس سلة هالمنتج ===
    const { data: cartRows } = await supabase.from('cart')
      .select('"Cart ID", Qty')
      .eq('Customer ID', customerID)
      .eq('Product ID', productID)
      .eq('Checked Out', 'FALSE');

    let existing = (cartRows || [])[0];

    if (existing) {
      const existingQty = Number(existing["Qty"] || 0);
      const newQty = existingQty + Number(qty);
      const newTotal = newQty * unitPrice;
      const existingId = existing["Cart ID"];
      await supabase.from('cart').update({ "Qty": newQty, "Line Total": newTotal }).eq('Cart ID', existingId);
      return NextResponse.json({ success: true, message: "تم تحديث الكمية" });
    }

    const cartID = crypto.randomUUID().replace(/-/g, "").substring(0, 8);
    const newRow = { "Cart ID": cartID, "Customer ID": customerID, "Product ID": productID, "Qty": qty, "Store ID": storeID, "Line Total": qty * unitPrice, "Checked Out": "FALSE", "Check Out Flag": "FALSE", "Request ID": "", "Line Points": linePoints };
    await supabase.from('cart').insert([newRow]);

    return NextResponse.json({ success: true, message: "تمت الإضافة" });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "خطأ بالاضافة" }, { status: 500 });
  }
}
