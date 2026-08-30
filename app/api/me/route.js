export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

export async function GET() {
  const cookieStore = cookies();
  const session = cookieStore.get('session');

  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  }

  try {
    const { phone } = JSON.parse(session.value);
    const supabase = getSupabase();

    // 1. جيب معلومات اليوزر من جدول Users - Supabase فقط
    const { data: usersRows } = await supabase.from('users').select('*');
    const userRow = (usersRows||[]).find(row => String(row['Mobile'] || row['mobile'] || "").trim() === String(phone).trim());

    if (!userRow) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. جيب معلومات الكوستومر من جدول Customers عن طريق Mobile - Supabase فقط
    const { data: customersRows } = await supabase.from('customers').select('*');
    const customerRow = (customersRows||[]).find(row => String(row['Mobile'] || row['mobile'] || "").trim() === String(phone).trim());

    const customerData = customerRow || {};
    const userData = userRow;

    // 3. اختار الاحداثيات
    let lat = customerData['Current Latitude'] || customerData['current_latitude'] || customerData['Registration Latitude'] || null;
    let lng = customerData['Current Longtitude'] || customerData['Current Longitude'] || customerData['current_longitude'] || customerData['Registration Longitude'] || null;

    // 4. ادمج كلشي سوا
    return NextResponse.json({
      user: {
        name: userData['Name'] || userData['name'],
        phone: userData['Mobile'] || userData['mobile'],
        role: userData['Role'] || userData['role'] || 'Customer',
        email: userData['Email'] || userData['email'],
        status: userData['Status'] || userData['status'],

        // ⭐⭐ المهم جداً
        AcceptedTerms: userData['AcceptedTerms'] || userData['accepted_terms'] || userData['Accepted Terms'],

        // من جدول Customers
        customerId: customerData['Customer ID'] || customerData['customer_id'],
        area: customerData['Area'] || customerData['area'],
        address: customerData['Adress'] || customerData['Address'] || customerData['address'],
        freeDeliveries: parseInt(customerData['Free Delivery Remaining'] || customerData['free_delivery_remaining'] || 0) || 0,
        lat: lat,
        lng: lng,
        lastLocationUpdate: customerData['Last Location Update'] || customerData['last_location_update']
      }
    });

  } catch (error) {
    console.log('ME API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
