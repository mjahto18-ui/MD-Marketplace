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
    
    const { data: existing } = await supabase.from('customers').select('"Customer ID"').eq('Mobile', submittedPhone).limit(1);
    
    if (existing?.length) {
      return NextResponse.json({
        success: false,
        message: "الرقم مسجل مسبقاً"
      });
    }

    // ===== 2) جيب كل الـ New PINs =====
    const { data: pinRows } = await supabase.from('customers').select('"New PIN"');
    const existingNewPins = (pinRows||[]).map(r => String(r['New PIN'] || "").trim()).filter(Boolean);

    // ===== 3) ولّد PIN جديد غير مكرّر =====
    function generateUniqueNewPIN() {
      let pin;
      do {
        pin = Math.floor(1000 + Math.random() * 9000).toString();
      } while (existingNewPins.includes(pin));
      return pin;
    }

    const newPIN = generateUniqueNewPIN();

    // ===== 4) كتابة الصف =====
    const customerId = "CUST-" + Date.now();
    const now = new Date().toISOString();

    const { error } = await supabase.from('customers').insert([{
      "Customer ID": customerId,
      "Name": data.name,
      "Mobile": submittedPhone,
      "Area": data.area,
      "Adress": data.address,
      "Email": data.email || '',
      "Join Date": now,
      "Status": 'Pending',
      "Free Delivery Remaining": "5",
      "Registration Latitude": String(data.registrationLatitude || ""),
      "Registration Longitude": String(data.registrationLongitude || ""),
      "Current Latitude": String(data.currentLatitude || ""),
      "Current Longtitude": String(data.currentLongitude || ""),
      "Last Location Update": now,
      "Device Type": data.deviceType || "",
      "Device Name": data.deviceName || "",
      "Browser": data.browser || "",
      "IP Address": data.ipAddress || "",
      "PIN": String(data.pin || ""),
      "New PIN": newPIN
    }]);

    if (error) throw error;

    // ملاحظة: جدول users رح ينعمل تلقائي من trigger trg_customers_create_user عند الـ Approved
    // ما في داعي تدخله هون، الـ trigger تبعك يشتغل after UPDATE

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
