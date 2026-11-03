export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getSupabase as getSupabaseLib } from "@/lib/supabase";
import { cookies } from "next/headers";

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

export async function GET(req) {
  try {
    const supabase = getSupabase();
    const customerID = await getCustomerIDFromSession(supabase);
    if (!customerID) {
      return NextResponse.json({ success: true, cart: [], totalWeight: 0, subtotal: 0, baseDeliveryFee: 0, deliveryFee: 0, freeDeliveryRemaining: 0, coverage_type: 'geofence' });
    }

    const { data: cartRows } = await supabase.from('cart')
    .select('"Cart ID", "Customer ID", "Product ID", Qty, "Line Total", "Line Points", "Store ID"')
    .eq('Customer ID', customerID)
    .eq('Checked Out', 'FALSE');

    const productIds = [...new Set((cartRows||[]).map(r => r['Product ID']).filter(Boolean))];
    const storeIds = [...new Set((cartRows||[]).map(r => r['Store ID']).filter(Boolean))];

    let productsMap = {};
    let storesMap = {};
    
    if (productIds.length > 0) {
      const { data: productsRows } = await supabase.from('products')
      .select('"Product ID", "Product Name", Image, "Store ID"')
      .in('Product ID', productIds);
      (productsRows||[]).forEach(p => productsMap[p['Product ID']] = p);
    }

    if (storeIds.length > 0) {
      const { data: storesRows } = await supabase.from('stores')
      .select('"Store ID", coverage_type')
      .in('Store ID', storeIds);
      (storesRows||[]).forEach(s => storesMap[s['Store ID']] = s.coverage_type || 'geofence');
    }

    // حدد نوع السلة
    let cartCoverage = 'geofence';
    if (storeIds.length > 0) {
      const firstStoreCoverage = storesMap[storeIds[0]] || 'geofence';
      cartCoverage = firstStoreCoverage;
    }

    const [{ data: ratesRows }, { data: customerRow }] = await Promise.all([
      supabase.from('delivery_rates').select('"Min Points", "Max Points", "Delivery Fee", coverage_type'),
      supabase.from('customers').select('"Free Delivery Remaining", "Last Free Delivery Date"').eq('Customer ID', customerID).maybeSingle(),
    ]);

    const cartItems = (cartRows||[]).map((row) => {
      const productID = row["Product ID"];
      const product = productsMap[productID];
      const qty = Number(row["Qty"] || 0);
      const lineTotal = Number(row["Line Total"] || 0);
      return {
        cartID: row["Cart ID"],
        productID: productID,
        name: product? product["Product Name"] : "منتج محذوف",
        image: product? product["Image"] : "",
        storeID: row["Store ID"],
        unitPrice: qty? lineTotal / qty : 0,
        qty,
        lineTotal,
        linePoints: Number(row["Line Points"] || 0),
        coverage_type: storesMap[row["Store ID"]] || 'geofence',
      };
    });

    const totalWeight = cartItems.reduce((s, i) => s + i.qty * i.linePoints, 0);
    const subtotal = cartItems.reduce((s, i) => s + i.lineTotal, 0);

    const freeDeliveryRemaining = customerRow? Number(customerRow["Free Delivery Remaining"] || 0) : 0;
    const lastFreeDeliveryDate = customerRow? customerRow["Last Free Delivery Date"] || "" : "";
    const today = new Date().toLocaleDateString("en-GB");

    let baseDeliveryFee = 0;
    
    // فلتر حسب نوع السلة + الوزن
    const filteredRates = (ratesRows||[]).filter(r => {
      const rc = r.coverage_type || 'geofence';
      return rc === cartCoverage;
    });
    
    const rateRow = filteredRates.find((r) => {
      const min = Number(r["Min Points"] || 0);
      const max = Number(r["Max Points"] || 999999);
      return totalWeight >= min && totalWeight <= max;
    });
    
    if (rateRow) baseDeliveryFee = Number(rateRow["Delivery Fee"] || 0);

    const isFreeDelivery = cartCoverage === 'geofence' && freeDeliveryRemaining > 0 && totalWeight > 0 && totalWeight <= 10 && lastFreeDeliveryDate!== today;
    const finalDeliveryFee = isFreeDelivery? 0 : baseDeliveryFee;

    return NextResponse.json({
      success: true,
      cart: cartItems,
      totalWeight,
      subtotal,
      baseDeliveryFee,
      deliveryFee: finalDeliveryFee,
      freeDeliveryRemaining,
      lastFreeDeliveryDate,
      today,
      isFreeDelivery,
      coverage_type: cartCoverage,
      order_type: cartCoverage,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
