import { NextResponse } from "next/server";
import { getSupabase as getSupabaseLib, normalizePhone } from "@/lib/supabase";
import { cookies } from "next/headers";
import { getGlobalConfig } from "@/lib/getGlobalConfig";

export const dynamic = "force-dynamic";

function getSupabase() {
  return getSupabaseLib();
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

    const { productID, qty = 1 } = await req.json();
    if (!productID) return NextResponse.json({ success: false, message: "Missing product" }, { status: 400 });

    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) return NextResponse.json({ success: false, message: "لازم تسجل دخول" }, { status: 401 });

    let phone;
    try {
      const s = JSON.parse(sessionCookie);
      phone = s.phone || s.Mobile || s.user?.phone || sessionCookie;
    } catch { phone = sessionCookie; }

    const supabase = getSupabase();
    const phoneNorm = normalizePhone(phone);

    // === Customers - هلا مع Index! ===
    let customerID = null;

    // 1. جرب نورمالايز
    let { data: customer } = await supabase.from('customers')
     .select('"Customer ID"')
     .eq('Mobile', phoneNorm)
     .maybeSingle();

    if (customer) {
      customerID = customer["Customer ID"];
    } else {
      // 2. fallback - الرقم الخام (للكود القديم)
      const { data: customer2 } = await supabase.from('customers')
       .select('"Customer ID"')
       .eq('Mobile', String(phone).trim())
       .maybeSingle();

      if (customer2) {
        customerID = customer2["Customer ID"];
      } else {
        // 3. جرب Customer ID دغري
        const { data: customer3 } = await supabase.from('customers')
         .select('"Customer ID"')
         .eq('Customer ID', String(phone).trim())
         .maybeSingle();
        if (customer3) customerID = customer3["Customer ID"];
      }
    }

    if (!customerID) return NextResponse.json({ success: false, message: "حسابك مش موجود" }, { status: 401 });

    // === Products - بس المنتج المطلوب! ===
    const { data: product } = await supabase.from('products')
     .select('"Product ID", Price, "Store ID", "Weight Points"')
     .eq('Product ID', productID)
     .maybeSingle();

    if (!product) return NextResponse.json({ success: false, message: "المنتج غير موجود" });

    const unitPrice = Number(product["Price"] || 0);
    const storeID = product["Store ID"] || "";
    const linePoints = Number(product["Weight Points"] || 0);

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
