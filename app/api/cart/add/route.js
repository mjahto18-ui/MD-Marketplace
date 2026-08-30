import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { cookies } from "next/headers";
import { getGlobalConfig } from "@/lib/getGlobalConfig";

export const dynamic = "force-dynamic";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

function normalizePhone(p) {
  return String(p || "").replace(/\D/g, "").trim();
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

    // Customers من Supabase
    const { data: customers } = await supabase.from('customers').select('*');
    let customerID = null;
    for (const c of customers || []) {
      const mobile = normalizePhone(c["Mobile"] || "");
      const rawPhone = String(c["Mobile"] || "").trim();
      if (mobile === phoneNorm || rawPhone === phone || String(c["Customer ID"] || "") === phone) {
        customerID = c["Customer ID"];
        break;
      }
    }
    if (!customerID) {
      const found = (customers || []).find(c => String(c["Mobile"] || "").trim() === String(phone).trim());
      if (found) customerID = found["Customer ID"];
    }

    if (!customerID) return NextResponse.json({ success: false, message: "حسابك مش موجود" }, { status: 401 });

    // Products من Supabase
    const { data: products } = await supabase.from('products').select('*');
    const product = (products || []).find((row) => String(row["Product ID"] || "").trim() === String(productID).trim());
    if (!product) return NextResponse.json({ success: false, message: "المنتج غير موجود" });

    const unitPrice = Number(product["Price"] || 0);
    const storeID = product["Store ID"] || "";
    const linePoints = Number(product["Weight Points"] || 0);

    // Cart من Supabase
    const { data: cartRows } = await supabase.from('cart').select('*').eq('Customer ID', customerID).eq('Product ID', productID).eq('Checked Out', 'FALSE');
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
