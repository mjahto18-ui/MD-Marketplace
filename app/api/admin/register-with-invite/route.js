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
      code, role, name, phone, area, lat, lng,
      vehicleTyp,
      gender, vehicle_type, engine_cc, car_color, plate_number, car_type, address, seats,
      storeName, storeAddress, openTime, closeTime, category, description
    } = body;

    if (!code || !/\d{6}/.test(String(code))) return NextResponse.json({ error: 'كود الدعوة ناقص' }, { status: 400 });
    if (!role) return NextResponse.json({ error: 'الدور ناقص' }, { status: 400 });
    if (!lat || !lng) return NextResponse.json({ error: 'أول نقطة لوكيشن إجبارية للكل' }, { status: 400 });
    if (!phone || !name) return NextResponse.json({ error: 'الاسم ورقم الموبايل إجباري' }, { status: 400 });

    const supabase = getSupabase();
    const { data: invite } = await supabase.from('admin_invite_codes').select('*').eq('code', String(code).trim()).maybeSingle();
    if (!invite) return NextResponse.json({ error: 'الكود غير موجود' }, { status: 404 });
    if (invite.is_used) return NextResponse.json({ error: 'الكود محروق مستخدم قبل' }, { status: 400 });
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) return NextResponse.json({ error: 'الكود منتهي (24 ساعة)' }, { status: 400 });

    const now = new Date().toISOString();
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    // Join Date dd/mm/yyyy now
    const d = new Date();
    const joinDate = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;

    if (role === 'driver') {
      if (!vehicleTyp || !['Moto','Car','Van'].includes(vehicleTyp)) return NextResponse.json({ error: 'نوع المركبة لازم Moto أو Car أو Van' }, { status: 400 });
      if (!area) return NextResponse.json({ error: 'المنطقة إجبارية ويجب اختيارها من جدول areas' }, { status: 400 });
      const { error } = await supabase.from('drivers').insert({
        "Driver Name": name,
        "Mobile": phone,
        "Area": area,
        "VehicleTyp": vehicleTyp,
        "Status": "Active",
        "Current Latitude": latNum,
        "Current Longitude": lngNum,
        "Last Location Update": now
      });
      if (error) throw error;

    } else if (role === 'taxi_driver') {
      if (!vehicle_type) return NextResponse.json({ error: 'نوع السيارة إجباري' }, { status: 400 });
      if (!engine_cc) return NextResponse.json({ error: 'قوة المحرك إجبارية - 1200/1500/2000/2500/150/200' }, { status: 400 });
      if (!car_color) return NextResponse.json({ error: 'لون السيارة إجباري' }, { status: 400 });
      // الغينا التكتك كاسم - عندك ياه 200 سي سي
      const allowed = ['1200','1500','2000','2500','150','200'];
      if (!allowed.includes(String(engine_cc))) return NextResponse.json({ error: 'قوة المحرك لازم 1200/1500/2000/2500/150/200 - التكتك هو 200' }, { status: 400 });
      // اذا نوع المركبة toktok نخلي المحرك 200 اجباري
      if (vehicle_type === 'toktok' && String(engine_cc) !== '200') return NextResponse.json({ error: 'التكتك محركو 200 سي سي' }, { status: 400 });

      const { error } = await supabase.from('taxi_drivers').insert({
        full_name: name,
        phone: phone,
        area: area || null,
        gender: gender || null,
        vehicle_type: vehicle_type,
        engine_cc: String(engine_cc),
        car_color: car_color,
        plate_number: plate_number || null,
        car_type: car_type || null,
        address: address || null,
        seats: seats ? parseInt(seats) : 4,
        lat: latNum,
        lng: lngNum,
        "Current Latitude": latNum,
        "Current Longitude": lngNum,
        status: "active",
        is_online: false,
        commission_percentage: 10,
        "Last Location Update": now
      });
      if (error) throw error;

    } else if (role === 'store') {
      if (!area) return NextResponse.json({ error: 'المنطقة إجبارية من جدول areas' }, { status: 400 });
      if (!storeName) return NextResponse.json({ error: 'اسم المتجر إجباري' }, { status: 400 });

      // Category مربوط بجدول categories - FK
      // Description لازم تكون
      // Join Date dd/mm/yyyy now
      // Open Time / Close Time لازم يكون مكتوبين وين انحط
      const { error } = await supabase.from('stores').insert({
        "Store Name": storeName,
        "Owner Name": name,
        "Mobile": phone,
        "Area": area,
        "Category": category || null,
        "Adress": storeAddress || address || null,
        "Description": description || null,
        "Join Date": joinDate,
        "Current Latitude": String(latNum),
        "Current Longitude": String(lngNum),
        "Current Store LatLong": `${latNum},${lngNum}`,
        "Status": "Active",
        "Open Time": openTime || null,
        "Close Time": closeTime || null
      });
      if (error) throw error;
    } else {
      return NextResponse.json({ error: 'دور غير معروف' }, { status: 400 });
    }

    const { error: burnError } = await supabase.from('admin_invite_codes').update({
      is_used: true,
      used_by: phone,
      used_at: now,
      area: area || null
    }).eq('code', String(code).trim());
    if (burnError) throw burnError;

    return NextResponse.json({ success: true, message: 'تم التسجيل وحرق الكود - أول نقطة لوكيشن تسجلت' });

  } catch (e) {
    console.error('Register error:', e);
    if (e.message?.includes('drivers_Area_fkey') || e.message?.includes('stores_Area_fkey')) {
      return NextResponse.json({ error: 'المنطقة غير موجودة بجدول areas - اختار من القائمة' }, { status: 400 });
    }
    if (e.message?.includes('stores_Category_fkey')) {
      return NextResponse.json({ error: 'الكاتيجوري غير موجود بجدول categories' }, { status: 400 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
