export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

export async function GET(req, { params }) {
  try {
    const productID = params.id;

    if (!productID) {
      return NextResponse.json({
        success: false,
        message: "Missing product ID",
      });
    }

    const supabase = getSupabase();

    // ============================
    // 1) جلب جدول Products - Supabase
    // ============================
    const { data: products } = await supabase.from('products').select('*').eq('Product ID', productID).limit(1);
    let product = products?.[0];

    if (!product) {
      const { data } = await supabase.from('products').select('*').eq('product_id', productID).limit(1);
      product = data?.[0];
    }

    if (!product) {
      // scan fallback
      const { data: allProducts } = await supabase.from('products').select('*');
      product = (allProducts||[]).find(row => String(row['Product ID'] || row['product_id'] || row[0] || "").trim() === String(productID).trim());
    }

    if (!product) {
      return NextResponse.json(
        { success: false, message: "المنتج غير موجود" },
        { status: 404 }
      );
    }

    // ============================
    // 2) جلب جدول Stores - Supabase
    // ============================
    const storeId = product['Store ID'] || product['store_id'] || product[1];
    const { data: stores } = await supabase.from('stores').select('*').eq('Store ID', storeId).limit(1);
    let store = stores?.[0];
    if (!store) {
      const { data } = await supabase.from('stores').select('*').eq('store_id', storeId).limit(1);
      store = data?.[0];
    }

    // ============================
    // 3) تجهيز بيانات المنتج - نفس المنطق
    // ============================
    const productData = {
      productID: product['Product ID'] || product['product_id'] || product[0],
      storeID: product['Store ID'] || product['store_id'] || product[1],
      name: product['Name'] || product['name'] || product[2],
      category: product['Category'] || product['category'] || product[3],
      unit: product['Unit'] || product['unit'] || product[4],
      price: Number(product['Price'] || product['price'] || product[5]),
      image: product['Image'] || product['image'] || product[6],
      description: product['Description'] || product['description'] || product[7],
      available: product['Available'] || product['available'] || product[8],
      stock: Number(product['Stock'] || product['stock'] || product[9]),
      active: product['Active'] || product['active'] || product[10],
      weightPoint: Number(product['Weight Point'] || product['weight_point'] || product[11]),
      storeName: store? (store['Store Name'] || store['store_name'] || store[1] || "متجر محذوف") : "متجر محذوف",
    };

    return NextResponse.json({
      success: true,
      product: productData,
    });

  } catch (err) {
    console.error("Product GET Error:", err);
    return NextResponse.json(
      { success: false, message: "خطأ بجلب المنتج" },
      { status: 500 }
    );
  }
}
