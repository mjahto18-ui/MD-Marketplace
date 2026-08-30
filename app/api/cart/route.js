export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { cookies } from "next/headers";

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
    if (String(c["Mobile"] || "").trim() === String(phone).trim()) {
      return c["Customer ID"];
    }
  }
  const { data: users } = await supabase.from('users').select('*');
  const user = (users||[]).find(row => String(row["Mobile"] || "").trim() === String(phone).trim());
  return user ? (user["Customer ID"] || user["User ID"]) : null;
}

export async function GET(req) {
  try {
    const supabase = getSupabase();
    const customerID = await getCustomerIDFromSession(supabase);
    if (!customerID) {
      return NextResponse.json({ success: true, cart: [], totalWeight: 0, subtotal: 0, baseDeliveryFee: 0, deliveryFee: 0, freeDeliveryRemaining: 0 });
    }

    const [{ data: cartRows }, { data: productsRows }, { data: storesRows }, { data: ratesRows }, { data: customersRows }] = await Promise.all([
      supabase.from('cart').select('*'),
      supabase.from('products').select('*'),
      supabase.from('stores').select('*'),
      supabase.from('delivery_rates').select('*'),
      supabase.from('customers').select('*'),
    ]);

    const customerCart = (cartRows||[]).filter((r) => {
      const cid = String(r["Customer ID"] || "").trim();
      const checked = String(r["Checked Out"] || "FALSE").toUpperCase();
      return cid === String(customerID).trim() && checked === "FALSE";
    });

    const cartItems = customerCart.map((row) => {
      const productID = row["Product ID"];
      const product = (productsRows||[]).find((p) => String(p["Product ID"] || "").trim() === String(productID).trim());
      const qty = Number(row["Qty"] || 0);
      const lineTotal = Number(row["Line Total"] || 0);
      return {
        cartID: row["Cart ID"],
        productID: productID,
        name: product ? product["Product Name"] : "منتج محذوف",
        image: product ? product["Image"] : "",
        unitPrice: qty ? lineTotal / qty : 0,
        qty,
        lineTotal,
        linePoints: Number(row["Line Points"] || 0),
      };
    });

    const totalWeight = cartItems.reduce((s, i) => s + i.qty * i.linePoints, 0);
    const subtotal = cartItems.reduce((s, i) => s + i.lineTotal, 0);

    const customerRow = (customersRows||[]).find((r) => String(r["Customer ID"] || "").trim() === String(customerID).trim());
    const freeDeliveryRemaining = customerRow ? Number(customerRow["Free Delivery Remaining"] || 0) : 0;

    let baseDeliveryFee = 0;
    const rateRow = (ratesRows||[]).find((r) => {
      const min = Number(r["Min Points"] || 0);
      const max = Number(r["Max Points"] || 999999);
      return totalWeight >= min && totalWeight <= max;
    });
    if (rateRow) baseDeliveryFee = Number(rateRow["Delivery Fee"] || 0);

    let finalDeliveryFee;
    if (freeDeliveryRemaining === 0) {
      finalDeliveryFee = baseDeliveryFee;
    } else {
      finalDeliveryFee = totalWeight <= 10 ? 0 : baseDeliveryFee;
    }

    return NextResponse.json({
      success: true,
      cart: cartItems,
      totalWeight,
      subtotal,
      baseDeliveryFee,
      deliveryFee: finalDeliveryFee,
      freeDeliveryRemaining,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
