import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

async function getCustomerIDFromSession(supabase) {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) return null;
  let phone;
  try {
    const session = JSON.parse(sessionCookie);
    phone = session.phone || session.Mobile || session.user?.phone || sessionCookie;
  } catch { phone = sessionCookie; }
  if (!phone) return null;
  const { data: customers } = await supabase.from('customers').select('*');
  for (const c of customers || []) {
    const vals = [c["Mobile"], c["mobile"], c["Phone"], c["phone"]].map(v=>String(v||"").trim());
    if (vals.includes(String(phone).trim()) || String(c[1]||"").trim()===String(phone).trim() || String(c[2]||"").trim()===String(phone).trim()) {
      return c["Customer ID"] || c["customer_id"] || c["ID"] || c["id"] || c[0];
    }
  }
  const { data: users } = await supabase.from('users').select('*');
  const user = (users||[]).find(row => Object.values(row).map(v=>String(v)).includes(String(phone)));
  return user? (user["User ID"] || user["user_id"] || user["Customer ID"] || user["customer_id"]) : null;
}

export async function PUT(req) {
  try {
    const { cartID, qty } = await req.json();
    if (!cartID ||!qty) return NextResponse.json({ success: false, message: "cartID و qty مطلوبين" }, { status: 400 });
    if (qty < 1) return NextResponse.json({ success: false, message: "الكمية لازم تكون 1 أو أكثر" }, { status: 400 });

    const supabase = getSupabase();
    const customerID = await getCustomerIDFromSession(supabase);
    if (!customerID) return NextResponse.json({ success: false, message: "لازم تسجل دخول" }, { status: 401 });

    // Cart من Supabase
    const { data: cartRows } = await supabase.from('cart').select('*').eq('Cart ID', cartID);
    let cartItem = (cartRows||[])[0];
    if (!cartItem) {
      const { data: cartRows2 } = await supabase.from('cart').select('*').eq('cart_id', cartID);
      cartItem = (cartRows2||[])[0];
    }
    if (!cartItem) return NextResponse.json({ success: false, message: "المنتج مش بالسلة" }, { status: 404 });

    const itemCustomer = String(cartItem["Customer ID"] || cartItem["customer_id"] || "").trim();
    if (itemCustomer!== String(customerID).trim()) {
      return NextResponse.json({ success: false, message: "ما عندك صلاحية تعدل هالمنتج" }, { status: 403 });
    }

    const productID = cartItem["Product ID"] || cartItem["product_id"];

    const { data: products } = await supabase.from('products').select('*');
    const product = (products||[]).find((row) => String(row["Product ID"] || row["product_id"] || row["id"] || "").trim() === String(productID).trim());
    if (!product) return NextResponse.json({ success: false, message: "المنتج غير موجود" }, { status: 404 });

    const unitPrice = Number(product["Price"] || product["price"] || product[5] || 0);
    const newTotal = Number(qty) * unitPrice;

    const { error } = await supabase.from('cart').update({ "Qty": qty, "Line Total": newTotal }).eq('Cart ID', cartID);
    if (error) {
      await supabase.from('cart').update({ qty: qty, line_total: newTotal }).eq('cart_id', cartID);
    }

    return NextResponse.json({ success: true, message: "تم تعديل الكمية" });
  } catch (err) {
    console.error("Cart UPDATE Error:", err);
    return NextResponse.json({ success: false, message: "خطأ بالتعديل" }, { status: 500 });
  }
}
