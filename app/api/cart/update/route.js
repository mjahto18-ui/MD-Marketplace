import { NextResponse } from "next/server";
import { getSupabase as getSupabaseLib } from "@/lib/supabase";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

function getSupabase() {
  return getSupabaseLib();
}

async function getCustomerIDFromSession(supabase) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) return null;
  let phone;
  try {
    const session = JSON.parse(sessionCookie);
    phone = session.phone || session.Mobile || session.user?.phone || sessionCookie;
  } catch { phone = sessionCookie; }
  if (!phone) return null;

  const phoneStr = String(phone).trim();
  const phoneNoZero = phoneStr.replace(/^0+/, '');

  const { data: customer } = await supabase.from('customers')
 .select('"Customer ID"')
 .or(`Mobile.eq.${phoneStr},Mobile.eq.${phoneNoZero}`)
 .maybeSingle();

  if (customer) return customer["Customer ID"];

  const { data: user } = await supabase.from('users')
 .select('"Customer ID", "User ID"')
 .or(`Mobile.eq.${phoneStr},Mobile.eq.${phoneNoZero}`)
 .maybeSingle();

  return user? (user["Customer ID"] || user["User ID"]) : null;
}

export async function PUT(req) {
  try {
    const { cartID, qty } = await req.json();
    if (!cartID ||!qty) return NextResponse.json({ success: false, message: "cartID و qty مطلوبين" }, { status: 400 });
    if (qty < 1) return NextResponse.json({ success: false, message: "الكمية لازم تكون 1 أو أكثر" }, { status: 400 });

    const supabase = getSupabase();
    const customerID = await getCustomerIDFromSession(supabase);
    if (!customerID) return NextResponse.json({ success: false, message: "لازم تسجل دخول" }, { status: 401 });

    const { data: cartRows } = await supabase.from('cart')
 .select('"Cart ID", "Customer ID", "Product ID"')
 .eq('Cart ID', cartID);

    let cartItem = (cartRows||[])[0];
    if (!cartItem) return NextResponse.json({ success: false, message: "المنتج مش بالسلة" }, { status: 404 });

    const itemCustomer = String(cartItem["Customer ID"] || "").trim();
    if (itemCustomer!== String(customerID).trim()) {
      return NextResponse.json({ success: false, message: "ما عندك صلاحية تعدل هالمنتج" }, { status: 403 });
    }

    const productID = cartItem["Product ID"];

    const { data: product } = await supabase.from('products')
 .select('"Product ID", Price')
 .eq('Product ID', productID)
 .maybeSingle();

    if (!product) return NextResponse.json({ success: false, message: "المنتج غير موجود" }, { status: 404 });

    const unitPrice = Number(product["Price"] || 0);
    const newTotal = Number(qty) * unitPrice;

    const { error } = await supabase.from('cart').update({ "Qty": qty, "Line Total": newTotal }).eq('Cart ID', cartID);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "تم تعديل الكمية" });
  } catch (err) {
    console.error("Cart UPDATE Error:", err);
    return NextResponse.json({ success: false, message: "خطأ بالتعديل" }, { status: 500 });
  }
}
