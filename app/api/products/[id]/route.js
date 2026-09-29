export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getSupabase as getSupabaseLib } from "@/lib/supabase";

function getSupabase() {
  return getSupabaseLib();
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
    const { data: products } = await supabase.from('products').select('"Product ID", "Store ID", "Product Name", Category, Unit, Price, Image, Description, Available, "Stock Qty", Active, "Weight Points"').eq('Product ID', productID).limit(1);
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
    const { data: stores } = await supabase.from('stores').select('"Store ID", "Store Name"').eq('Store ID', storeId).limit(1);
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
