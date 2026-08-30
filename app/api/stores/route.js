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

    const { data: dataRows } = await supabase.from('stores').select('*');

    const stores = (dataRows||[]).map((row) => ({
      storeID: row['Store ID'],
      storeName: row['Store Name'],
      category: row['Category'],
      ownerName: row['Owner Name'],
      phone: row['Mobile'],
      area: row['Area'],
      address: row['Adress'],
      description: row['Description'],
      image: row['Logo'],
      status: row['Status'],
      joinDate: row['Join Date'],
      commissionRate: row['Commission Rate'],
      deliveryAvailable: row['Delivery Available'],
      closeTime: row['Close Time'],
      openTime: row['Open Time'],
      currentLatitude: row['Current Latitude'],
      currentLongitude: row['Current Longitude'],
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
