export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

export async function GET() {
  try {
    const supabase = getSupabase();

    // ============================
    // 1) جلب جدول Stores - صغيرة
    // ============================
    const { data: dataRows } = await supabase.from('stores').select('*');

    // ============================
    // 2) تجهيز البيانات حسب ترتيب الأعمدة الصحيح - نفس mapping
    // ============================
    const stores = (dataRows||[]).map((row) => ({
      storeID: row['store_id'] || row['Store ID'] || row[0],
      storeName: row['store_name'] || row['Store Name'] || row[1],
      category: row['category'] || row['Category'] || row[2],
      ownerName: row['owner_name'] || row['Owner Name'] || row[3],
      phone: row['phone'] || row['Phone'] || row[4],
      area: row['area'] || row['Area'] || row[5],
      address: row['adress'] || row['address'] || row['Address'] || row[6],
      description: row['description'] || row['Description'] || row[7],
      image: row['logo'] || row['Logo'] || row['image'] || row[8],
      status: row['status'] || row['Status'] || row[9],
      joinDate: row['join_date'] || row['Join Date'] || row[10],
      commissionRate: row['commission_rate'] || row['Commission Rate'] || row[11],
      deliveryAvailable: row['delivery_available'] || row['Delivery Available'] || row[12],
      closeTime: row['close_time'] || row['Close Time'] || row[13],
      openTime: row['open_time'] || row['Open Time'] || row[14],
    }));

    return NextResponse.json({
      success: true,
      stores,
    });

  } catch (err) {
    console.error("Stores GET Error:", err);
    return NextResponse.json(
      { success: false, message: "خطأ بجلب المتاجر" },
      { status: 500 }
    );
  }
}
