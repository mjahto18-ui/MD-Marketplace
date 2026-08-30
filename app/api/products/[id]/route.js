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
    // 1) جلب جدول Products
    // ============================
    const { data: products } = await supabase.from('products').select('*').eq('Product ID', productID).limit(1);
    let product = products?.[0];

    if (!product) {
      return NextResponse.json(
        { success: false, message: "المنتج غير موجود" },
        { status: 404 }
      );
    }

    // ============================
    // 2) جلب جدول Stores
    // ============================
    const storeId = product['Store ID'];
    const { data: stores } = await supabase.from('stores').select('*').eq('Store ID', storeId).limit(1);
    let store = stores?.[0];

    // ============================
    // 3) تجهيز بيانات المنتج
    // ============================
    const productData = {
      productID: product['Product ID'],
      storeID: product['Store ID'],
      name: product['Product Name'],
      category: product['Category'],
      unit: product['Unit'],
      price: Number(product['Price']),
      image: product['Image'],
      description: product['Description'],
      available: product['Available'],
      stock: Number(product['Stock Qty']),
      active: product['Active'],
      weightPoint: Number(product['Weight Points']),
      storeName: store? store['Store Name'] : "متجر محذوف",
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
