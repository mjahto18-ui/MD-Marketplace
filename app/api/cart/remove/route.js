import { NextResponse } from "next/server";
import { getSupabase as getSupabaseLib, normalizePhone } from "@/lib/supabase";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

function getSupabase() {
  return getSupabaseLib();
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

  const normalized = normalizePhone(phone);

  // مع Index!
  const { data: customer } = await supabase.from('customers')
  .select('"Customer ID"')
  .eq('Mobile', normalized)
  .maybeSingle();
  if (customer) return customer["Customer ID"];

  const { data: customer2 } = await supabase.from('customers')
  .select('"Customer ID"')
  .eq('Mobile', String(phone).trim())
  .maybeSingle();
  if (customer2) return customer2["Customer ID"];

  const { data: user } = await supabase.from('users')
  .select('"Customer ID", "User ID"')
  .eq('Mobile', normalized)
  .maybeSingle();

  return user? (user["Customer ID"] || user["User ID"]) : null;
}

export async function DELETE(req) {
  try {
    const productID = req.nextUrl.searchParams.get("productID");
    if (!productID) {
      return NextResponse.json({ success: false, message: "productID مطلوب" }, { status: 400 });
    }

    const supabase = getSupabase();
    const customerID = await getCustomerIDFromSession(supabase);
    if (!customerID) {
      return NextResponse.json({ success: false, message: "لازم تسجل دخول" }, { status: 401 });
    }

    // بس Cart ID - مش select('*')!
    const { data: cartRows } = await supabase.from('cart')
    .select('"Cart ID"')
    .eq('Customer ID', customerID)
    .eq('Product ID', productID)
    .eq('Checked Out', 'FALSE');

    let row = (cartRows||[])[0];

    if (!row) {
      return NextResponse.json({ success: false, message: "المنتج غير موجود بالسلة" }, { status: 404 });
    }

    const cartId = row["Cart ID"];
    const { error } = await supabase.from('cart').delete().eq('Cart ID', cartId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "تم حذف المنتج من السلة" });
  } catch (err) {
    console.error("Cart DELETE Error:", err);
    return NextResponse.json({ success: false, message: "خطأ بالحذف", error: err.message }, { status: 500 });
  }
}
