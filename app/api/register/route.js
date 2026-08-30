export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

export async function POST(req) {
  try {
    const data = await req.json();
    const supabase = getSupabase();

    // ===== 1) Check رقم الهاتف =====
    const submittedPhone = data.phone.toString().trim();
    const { data: existing } = await supabase.from('customers').select('Mobile, mobile, C:C').ilike('Mobile', `%${submittedPhone}%`);
    
    // check exact
    const { data: allCustomers } = await supabase.from('customers').select('*');
    const existingPhones = (allCustomers||[]).map(r => String(r['Mobile'] || r['mobile'] || r['C'] || "").trim()).filter(Boolean);

    if (existingPhones.includes(submittedPhone)) {
      return NextResponse.json({
        success: false,
        message: "الرقم مسجل مسبقاً، "
      });
    }

    // ===== 2) جيب كل الـ New PINs من عمود W =====
    const existingNewPins = (allCustomers||[]).map(r => String(r['New PIN'] || r['new_pin'] || r['W'] || "").trim()).filter(Boolean);

    // ===== 3) ولّد PIN جديد غير مكرّر =====
    function generateUniqueNewPIN() {
      let pin;
      do {
        pin = Math.floor(1000 + Math.random() * 9000).toString();
      } while (existingNewPins.includes(pin));
      return pin;
    }

    const newPIN = generateUniqueNewPIN();

    // ===== 4) كتابة الصف كامل =====
    const customerId = "CUST-" + Date.now();
    const now = new Date().toISOString();

    await supabase.from('customers').insert([{
      "Customer ID": customerId,
      "customer_id": customerId,
      "Name": data.name,
      "name": data.name,
      "Mobile": submittedPhone,
      "mobile": submittedPhone,
      "Area": data.area,
      "area": data.area,
      "Adress": data.address,
      "address": data.address,
      "Email": data.email || '',
      "email": data.email || '',
      "Created Date": now,
      "created_date": now,
      "Status": 'Pending',
      "status": 'Pending',
      "Free Delivery Remaining": 5,
      "free_delivery_remaining": 5,
      "Registration Latitude": data.registrationLatitude,
      "registration_latitude": data.registrationLatitude,
      "Registration Longitude": data.registrationLongitude,
      "registration_longitude": data.registrationLongitude,
      "Current Latitude": data.currentLatitude,
      "current_latitude": data.currentLatitude,
      "Current Longtitude": data.currentLongitude,
      "current_longitude": data.currentLongitude,
      "Last Location Update": now,
      "last_location_update": now,
      "Device Type": data.deviceType,
      "device_type": data.deviceType,
      "Device Name": data.deviceName,
      "device_name": data.deviceName,
      "Browser": data.browser,
      "browser": data.browser,
      "IP Address": data.ipAddress,
      "ip_address": data.ipAddress,
      "PIN": data.pin,
      "pin": data.pin,
      "New PIN": newPIN,
      "new_pin": newPIN
    }]);

    // وكمان بـ Users
    try {
      await supabase.from('users').insert([{
        "User ID": customerId,
        "user_id": customerId,
        "Name": data.name,
        "name": data.name,
        "Mobile": submittedPhone,
        "mobile": submittedPhone,
        "Role": "Customer",
        "role": "Customer",
        "Status": "Pending",
        "status": "Pending"
      }]);
    } catch(e){ console.log("users insert skip", e.message) }

    return NextResponse.json({
      success: true,
      message: "تم إرسال طلب الانضمام بنجاح"
    });

  } catch (error) {
    console.error('Register Error:', error);
    return NextResponse.json({
      success: false,
      message: "فشل إنشاء الحساب"
    }, { status: 500 });
  }
}
