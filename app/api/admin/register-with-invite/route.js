export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

function normPhone(p){ return String(p||'').replace(/\D/g,'').trim(); }

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      code, // 6 digits invite
      role, // 'driver' | 'taxi_driver' | 'store'
      // common
      name, // Driver Name / full_name / Owner Name
      phone, // Mobile / phone
      area, // for drivers/stores = Area ID (FK), for taxi = free text
      lat,
      lng,
      // drivers specific
      vehicleTyp, // Moto | Car | Van -> for drivers table "VehicleTyp"
      // taxi_drivers specific
      gender, // male | female
      vehicle_type, // car | van | toktok | moto | touristic_van | touristic_van_11
      engine_cc, // code from taxi_engines -> dropdown
      car_color,
      plate_number,
      car_type,
      address,
      seats,
      // stores specific
      storeName,
      storeAddress,
    } = body;

    // 1. تحقق أساسي
    if (!code || !/\d{6}/.test(String(code))) return NextResponse.json({ error: 'كود الدعوة ناقص' }, { status: 400 });
    if (!role) return NextResponse.json({ error: 'الدور ناقص' }, { status: 400 });
    if (!lat || !lng) return NextResponse.json({ error: 'أول نقطة لوكيشن إجبارية للكل' }, { status: 400 });
    if (!phone || !name) return NextResponse.json({ error: 'الاسم ورقم الموبايل إجباري' }, { status: 400 });

    const supabase = getSupabase();

    // 2. فحص الكود - صالح ومو محروق ومو منتهي
    const { data: invite } = await supabase.from('admin_invite_codes').select('*').eq('code', String(code).trim()).maybeSingle();
    if (!invite) return NextResponse.json({ error: 'الكود غير موجود' }, { status: 404 });
    if (invite.is_used) return NextResponse.json({ error: 'الكود محروق مستخدم قبل' }, { status: 400 });
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) return NextResponse.json({ error: 'الكود منتهي (24 ساعة)' }, { status: 400 });

    const now = new Date().toISOString();
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const phoneNorm = normPhone(phone);

    // 3. حسب الدور
    if (role === 'driver') {
      // drivers table - Area مربوط بجدول areas و VehicleTyp dropdown Moto/Car/Van
      if (!vehicleTyp || !['Moto','Car','Van'].includes(vehicleTyp)) return NextResponse.json({ error: 'نوع المركبة لازم Moto أو Car أو Van' }, { status: 400 });
      if (!area) return NextResponse.json({ error: 'المنطقة إجبارية ويجب اختيارها من جدول areas' }, { status: 400 });

      const { error } = await supabase.from('drivers').insert({
        "Driver Name": name,
        "Mobile": phone,
        "Area": area, // Area ID - FK
        "VehicleTyp": vehicleTyp,
        "Status": "Active",
        "Current Latitude": latNum,
        "Current Longitude": lngNum,
        "Last Location Update": now
      });
      if (error) throw error;
      // trigger trg_drivers_create_user بيخلق اليوزر لحالو

    } else if (role === 'taxi_driver') {
      // taxi_drivers - area حرة + قوة المحرك dropdown من taxi_engines + لون ونوع
      if (!vehicle_type) return NextResponse.json({ error: 'نوع السيارة إجباري' }, { status: 400 });
      if (!engine_cc) return NextResponse.json({ error: 'قوة المحرك إجبارية - اختار من taxi_engines' }, { status: 400 });
      if (!car_color) return NextResponse.json({ error: 'لون السيارة إجباري' }, { status: 400 });
      
      // تحقق من شرط toktok
      if (vehicle_type === 'toktok' && engine_cc !== 'toktok') return NextResponse.json({ error: 'اذا النوع toktok لازم قوة المحرك toktok' }, { status: 400 });
      if (vehicle_type !== 'toktok' && engine_cc === 'toktok') return NextResponse.json({ error: 'قوة محرك toktok بس لنوع toktok' }, { status: 400 });

      const { error } = await supabase.from('taxi_drivers').insert({
        full_name: name,
        phone: phone,
        area: area || null, // حرة كتابة - مو مربوطة بجدول
        gender: gender || null,
        vehicle_type: vehicle_type,
        engine_cc: engine_cc, // FK ل taxi_engines
        car_color: car_color,
        plate_number: plate_number || null,
        car_type: car_type || null,
        address: address || null,
        seats: seats ? parseInt(seats) : 4,
        lat: latNum,
        lng: lngNum,
        "Current Latitude": latNum,
        "Current Longitude": lngNum,
        status: "active", // مباشرة active حسب طلبك
        is_online: false,
        commission_percentage: 10,
        "Last Location Update": now
      });
      if (error) throw error;
      // trigger trg_create_taxi_user بيخلق اليوزر

    } else if (role === 'store') {
      if (!area) return NextResponse.json({ error: 'المنطقة إجبارية من جدول areas' }, { status: 400 });
      if (!storeName) return NextResponse.json({ error: 'اسم المتجر إجباري' }, { status: 400 });

      const { error } = await supabase.from('stores').insert({
        "Store Name": storeName,
        "Owner Name": name,
        "Mobile": phone,
        "Area": area, // FK
        "Adress": storeAddress || address || null,
        "Current Latitude": String(latNum), // text بجدولك
        "Current Longitude": String(lngNum), // text
        "Current Store LatLong": `${latNum},${lngNum}`,
        "Status": "Active"
      });
      if (error) throw error;
      // trigger trg_stores_create_user بيخلق اليوزر

    } else {
      return NextResponse.json({ error: 'دور غير معروف' }, { status: 400 });
    }

    // 4. حرق الكود
    await supabase.from('admin_invite_codes').update({
      is_used: true,
      used_by: phone,
      used_at: now,
      used_role: role,
      used_area: area || null
    }).eq('code', String(code).trim());

    return NextResponse.json({ success: true, message: 'تم التسجيل وحرق الكود - أول نقطة لوكيشن تسجلت' });

  } catch (e) {
    console.error('Register error:', e);
    // رسائل أوضح للـ FK
    if (e.message?.includes('drivers_Area_fkey') || e.message?.includes('stores_Area_fkey')) {
      return NextResponse.json({ error: 'المنطقة غير موجودة بجدول areas - اختار من القائمة' }, { status: 400 });
    }
    if (e.message?.includes('fk_drivers_engine')) {
      return NextResponse.json({ error: 'قوة المحرك غير موجودة بجدول taxi_engines' }, { status: 400 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
