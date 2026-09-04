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

    // 1. جيب معلومات اليوزر من جدول Users
    const { data: usersRows } = await supabase.from('users').select('*');
    const userRow = (usersRows||[]).find(row => String(row['Mobile'] || "").trim() === String(phone).trim());

    if (!userRow) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. جيب معلومات الكوستومر من جدول Customers عن طريق Mobile
    const { data: customersRows } = await supabase.from('customers').select('*');
    const customerRow = (customersRows||[]).find(row => String(row['Mobile'] || "").trim() === String(phone).trim());

    const customerData = customerRow || {};
    const userData = userRow;

    // 3. اختار الاحداثيات
    let lat = customerData['Current Latitude'] || customerData['Registration Latitude'] || null;
    let lng = customerData['Current Longtitude'] || customerData['Registration Longitude'] || null;

    // 4. ادمج كلشي سوا
    return NextResponse.json({
      user: {
        name: userData['Name'],
        phone: userData['Mobile'],
        role: userData['Role'] || 'Customer',
        email: userData['Email'],
        status: userData['Status'],
        AcceptedTerms: userData['AcceptedTerms'],

        // من جدول Customers
        customerId: customerData['Customer ID'],
        area: customerData['Area'],
        address: customerData['Adress'],
        freeDeliveries: parseInt(customerData['Free Delivery Remaining'] || 0) || 0,
        lat: lat,
        lng: lng,
        lastLocationUpdate: customerData['Last Location Update']
      }
    });

  } catch (error) {
    console.log('ME API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
