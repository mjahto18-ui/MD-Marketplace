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
    const vals = [c["Mobile"], c["mobile"], c["Phone"], c["phone"], c[1], c[2]].map(v=>String(v||"").trim());
    if (vals.includes(String(phone).trim())) {
      return c["Customer ID"] || c["customer_id"] || c["ID"] || c["id"] || c[0];
    }
  }
  const { data: users } = await supabase.from('users').select('*');
  const user = (users||[]).find(row => Object.values(row).map(v=>String(v)).includes(String(phone)));
  return user? (user["User ID"] || user["user_id"]) : null;
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
      const cid = String(r["Customer ID"] || r["customer_id"] || "").trim();
      const checked = String(r["Checked Out"] || r["checked_out"] || "FALSE").toUpperCase();
      return cid === String(customerID).trim() && checked === "FALSE";
    });

    const cartItems = customerCart.map((row) => {
      const productID = row["Product ID"] || row["product_id"];
      const product = (productsRows||[]).find((p) => String(p["Product ID"] || p["product_id"] || p["id"] || "").trim() === String(productID).trim());
      const qty = Number(row["Qty"] || row["qty"] || 0);
      const lineTotal = Number(row["Line Total"] || row["line_total"] || 0);
      return {
        cartID: row["Cart ID"] || row["cart_id"],
        productID: productID,
        name: product? (product["Product Name"] || product["product_name"] || product[2]) : "منتج محذوف",
        image: product? (product["Image"] || product["image"] || product["Image URL"] || product[6] || "") : "",
        unitPrice: qty? lineTotal / qty : 0,
        qty,
        lineTotal,
        linePoints: Number(row["Line Points"] || row["line_points"] || row[9] || 0),
      };
    });

    const totalWeight = cartItems.reduce((s, i) => s + i.qty * i.linePoints, 0);
    const subtotal = cartItems.reduce((s, i) => s + i.lineTotal, 0);

    const customerRow = (customersRows||[]).find((r) => String(r["Customer ID"] || r["customer_id"] || r["ID"] || "").trim() === String(customerID).trim());
    const freeDeliveryRemaining = customerRow? Number(customerRow["Free Delivery Remaining"] || customerRow["free_delivery_remaining"] || customerRow[8] || 0) : 0;

    let baseDeliveryFee = 0;
    const rateRow = (ratesRows||[]).find((r) => {
      const min = Number(r["Min"] || r["min"] || r["Min Weight"] || r[2] || 0);
      const max = Number(r["Max"] || r["max"] || r["Max Weight"] || r[3] || 999999);
      return totalWeight >= min && totalWeight <= max;
    });
    if (rateRow) baseDeliveryFee = Number(rateRow["Fee"] || rateRow["fee"] || rateRow["Delivery Fee"] || rateRow[4] || 0);

    let finalDeliveryFee;
    if (freeDeliveryRemaining === 0) {
      finalDeliveryFee = baseDeliveryFee;
    } else {
      finalDeliveryFee = totalWeight <= 10? 0 : baseDeliveryFee;
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
