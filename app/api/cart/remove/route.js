import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

function normalize(p) { return String(p||"").trim(); }

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
    if (normalize(c["Mobile"]) === normalize(phone)) {
      return c["Customer ID"];
    }
  }
  const { data: users } = await supabase.from('users').select('*');
  const user = (users||[]).find(row => Object.values(row).map(v=>String(v)).includes(String(phone)));
  if (user) return user["User ID"] || user["Customer ID"];
  return null;
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

    const { data: cartRows } = await supabase.from('cart').select('*').eq('Customer ID', customerID).eq('Product ID', productID).eq('Checked Out', 'FALSE');
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
