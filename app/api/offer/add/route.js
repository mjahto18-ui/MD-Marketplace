// /app/api/offer/add/route.js
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export const dynamic = "force-dynamic";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}
function normalizePhone(p){ return String(p||"").replace(/\D/g,"").trim(); }

export async function POST(req) {
  try {
    const { phone, productID } = await req.json();
    // phone = 9613177653 يلي جاي من واتساب
    // productID = 0011110636768 مثلا من جدول products

    if (!phone ||!productID) return NextResponse.json({ success:false, message:"phone + productID مطلوبين" }, {status:400});

    const supabase = getSupabase();
    const phoneNorm = normalizePhone(phone);

    // 1- جيب Customer ID من users -> WhatsApp Number
    const { data: users } = await supabase.from('users').select('*');
    let customerID = null;
    for (const u of users || []) {
      const wa = normalizePhone(u["WhatsApp Number"] || "");
      if (wa === phoneNorm || wa.endsWith(phoneNorm) || phoneNorm.endsWith(wa)) {
        customerID = u["Customer ID"];
        break;
      }
    }
    if (!customerID) return NextResponse.json({ success:false, message:`ما لقيت ${phone} بـ users` }, {status:404});

    // 2- جيب معلومات المنتج كلها من products
    const { data: products } = await supabase.from('products').select('*');
    const product = (products||[]).find(p => String(p["Product ID"]).trim() === String(productID).trim());
    if (!product) return NextResponse.json({ success:false, message:"المنتج مش موجود" }, {status:404});

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
      const newQty = Number(ex["Qty"]||0) + qty;
      await supabase.from('cart').update({
        "Qty": newQty,
        "Line Total": newQty * unitPrice,
        "Line Points": newQty * linePoints
      }).eq('Cart ID', ex["Cart ID"]);
      return NextResponse.json({ success:true, updated:true, customerID });
    }

    // 4- اضافة جديدة - كل معلومات المنتج
    const cartID = crypto.randomUUID().replace(/-/g,"").substring(0,8);
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

    await supabase.from('cart').insert([newRow]);

    return NextResponse.json({ success:true, message:"انضاف", customerID, cartID, product: product["Product Name"] });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ success:false, message: err.message }, {status:500});
  }
}
