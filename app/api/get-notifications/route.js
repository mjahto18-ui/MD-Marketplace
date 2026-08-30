export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { cookies } from "next/headers";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

export async function POST(req) {
  try {
    const cookieStore = cookies();
    const session = cookieStore.get('session');

    if (!session) {
      return NextResponse.json({ success: false, message: "Not logged in", notifications: [] }, { status: 401 });
    }

    const { phone } = JSON.parse(session.value);
    if (!phone) {
       return NextResponse.json({ success: false, message: "Invalid session", notifications: [] }, { status: 401 });
    }

    const supabase = getSupabase();

    // 1. جيب الـ Customer ID من رقم الموبايل - نفس المنطق
    const { data: customers } = await supabase.from('customers').select('*');
    const customerRow = (customers||[]).find(row =>
      String(row['Mobile'] || row['mobile'] || row['Phone'] || "").trim() === String(phone).trim()
    );

    if (!customerRow) {
      return NextResponse.json({ success: false, notifications: [], message: "Customer not found" });
    }

    const customerId = customerRow['Customer ID'] || customerRow['customer_id'] || customerRow['ID'];

    // 2. جيب التنبيهات من webhook table
    const { data: webhookRows } = await supabase.from('webhook').select('*').eq('Customer ID', customerId);
    let rows = webhookRows;
    if (!rows?.length) {
      const { data } = await supabase.from('webhook').select('*').eq('customer_id', customerId);
      rows = data;
    }

    const notifications = (rows||[])
    .map(r => ({
        customerId: r['Customer ID'] || r['customer_id'] || r[0],
        title: r['Title'] || r['title'] || r[1],
        message: r['Message'] || r['message'] || r[2],
        image: r['Image'] || r['image'] || r[3],
        date: r['Date'] || r['date'] || r[4],
      }))
    .reverse()
    .slice(0, 10);

    return NextResponse.json({
      success: true,
      notifications,
      count: notifications.length,
    });

  } catch (err) {
    console.log(err);
    return NextResponse.json({ success: false, error: err.message, notifications: [] });
  }
}
