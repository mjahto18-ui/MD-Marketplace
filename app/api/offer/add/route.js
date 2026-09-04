// /app/api/offer/add/route.js
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

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
    const { phone, productID } = await req.json();

    if (!phone ||!productID) {
      return NextResponse.json({ success: false, message: "phone + productID مطلوبين" }, { status: 400 });
    }

    const supabase = getSupabase();
    const phoneNorm = normalizePhone(phone);

    // 1- جيب Customer ID من users -> WhatsApp Number
    const { data: users, error: usersError } = await supabase.from('users').select('*');

    if (usersError) {
      console.error("users fetch error", usersError);
      return NextResponse.json({ success: false, message: usersError.message }, { status: 500 });
    }

    let customerID = null;
    let foundRow = null;

    for (const u of users || []) {
      const wa = normalizePhone(u["WhatsApp Number"] || "");
      if (!wa) continue; // تخطى الـ NULL يلي شفتهم بالصورة

      if (wa === phoneNorm) { // نفس القيمة بالضبط 9613177653
        foundRow = u;
        if (u["Customer ID"]) {
          customerID = u["Customer ID"];
        }
        break;
      }
    }

    // لقى الرقم بس ما عندو Customer ID
    if (foundRow &&!customerID) {
      return NextResponse.json({
        success: false,
        message: `رقمك ${phone} موجود بس مش مسجل بالموقع - لازم تكون مسجل بالموقع لتقدر تطلب`
      }, { status: 403 });
    }

    // ما لقى الرقم نهائيا
    if (!customerID) {
      return NextResponse.json({ success: false, message: `ما لقيت ${phone} بـ users` }, { status: 404 });
    }

    // 2- جيب معلومات المنتج كلها من products
    const { data: products } = await supabase.from('products').select('*');
    const product = (products || []).find(p => String(p["Product ID"]).trim() === String(productID).trim());

    if (!product) {
      return NextResponse.json({ success: false, message: "المنتج مش موجود" }, { status: 404 });
    }

    const unitPrice = Number(product["Price"] || 0);
    const storeID = product["Store ID"] || "";
    const linePoints = Number(product["Weight Points"] || product["Points"] || 0);
    const qty = 1;

    // 3- شوف اذا موجود بالسلة قبل
    const { data: existingCart } = await supabase.from('cart')
     .select('*')
     .eq('Customer ID', customerID)
     .eq('Product ID', productID)
     .eq('Checked Out', 'FALSE');

    if (existingCart && existingCart[0]) {
      const ex = existingCart[0];
      const newQty = Number(ex["Qty"] || 0) + qty;
      await supabase.from('cart').update({
        "Qty": newQty,
        "Line Total": newQty * unitPrice,
        "Line Points": newQty * linePoints
      }).eq('Cart ID', ex["Cart ID"]);

      return NextResponse.json({ success: true, updated: true, customerID, product: product["Product Name"] });
    }

    // 4- اضافة جديدة
    const cartID = crypto.randomUUID().replace(/-/g, "").substring(0, 8);
    const newRow = {
      "Cart ID": cartID,
      "Customer ID": customerID,
      "Product ID": String(product["Product ID"]),
      "Qty": qty,
      "Store ID": storeID,
      "Line Total": qty * unitPrice,
      "Checked Out": "FALSE",
      "Check Out Flag": "FALSE",
      "Request ID": "",
      "Line Points": linePoints
    };

    const { error: insertError } = await supabase.from('cart').insert([newRow]);

    if (insertError) {
      console.error("cart insert error", insertError);
      return NextResponse.json({ success: false, message: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "انضاف", customerID, cartID, product: product["Product Name"] });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
