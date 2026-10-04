export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabase as getSupabaseLib } from "@/lib/supabase";

function getSupabase() {
  return getSupabaseLib();
}

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session');

  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  }

  try {
    const { phone } = JSON.parse(session.value);
    const phoneStr = String(phone).trim();
    const phoneNoZero = phoneStr.replace(/^0+/, '');
    const supabase = getSupabase();

    // 1. FIXED - بلا select('*') - eq + Index دغري
    const USER_COLS = '"User ID", "Customer ID", Name, Mobile, Role, Email, Status, "AcceptedTerms", taxi';
    const { data: userRows, error: userErr } = await supabase.from('users')
      .select(USER_COLS)
      .or(`Mobile.eq.${phoneStr},Mobile.eq.${phoneNoZero}`)
      .limit(1);

    if (userErr) console.error("me users error:", userErr.message);
    const userRow = userRows?.[0];

    if (!userRow) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. FIXED - بلا select('*') - eq + Index
    const CUSTOMER_COLS = '"Customer ID", Area, Adress, "Current Latitude", "Registration Latitude", "Current Longtitude", "Registration Longitude", "Free Delivery Remaining", "Last Location Update", Mobile';
    const { data: customerRows, error: custErr } = await supabase.from('customers')
      .select(CUSTOMER_COLS)
      .or(`Mobile.eq.${phoneStr},Mobile.eq.${phoneNoZero}`)
      .limit(1);

    if (custErr) console.error("me customers error:", custErr.message);
    const customerRow = customerRows?.[0] || {};

    const customerData = customerRow;
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
        taxi: userData['taxi'] ?? null,

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
