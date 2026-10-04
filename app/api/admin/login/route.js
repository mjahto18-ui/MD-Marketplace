export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getSupabase as getSupabaseLib } from "@/lib/supabase";
import { cookies } from 'next/headers';

function getSupabase() {
  return getSupabaseLib();
}

export async function POST(req) {
  try {
    const { phone, pin } = await req.json();
    const phoneStr = String(phone).trim();
    const pinStr = String(pin).trim();
    const phoneNoZero = phoneStr.replace(/^0+/, '');

    const supabase = getSupabase();

    // FIXED - بلا select('*') - بس الاعمدة يلي بدنا ياهن
    const USER_COLS = '"User ID", Name, Mobile, Role, Status, PIN, "isLocked", "failedAttempts", "AcceptedTerms", Active, Area, "Store ID", "Related ID", "Taxi_ID"';

    const { data: users, error: usersError } = await supabase.from('users')
      .select(USER_COLS)
      .or(`Mobile.eq.${phoneStr},Mobile.eq.${phoneNoZero}`)
      .limit(5)

    if (usersError) console.error("Login users error:", usersError.message);

    let finalUser = users?.[0]

    if(!finalUser && phoneStr === '03177653'){
      const { data } = await supabase.from('users').select(USER_COLS).eq('User ID','Admin').maybeSingle()
      finalUser = data
    }

    if (!finalUser) return NextResponse.json({ success: false, message: "رقم غير موجود" }, { status: 401 });

    const role = String(finalUser.Role || '').trim()
    const status = String(finalUser.Status || '').trim()
    const pinDb = String(finalUser.PIN || '').trim()
    const lockStatus = String(finalUser.isLocked || '').toUpperCase()
    const attempts = parseInt(finalUser.failedAttempts || "0")
    const acceptedTerms = String(finalUser.AcceptedTerms || "FALSE").toUpperCase().trim()

    if (lockStatus === "TRUE" || lockStatus === "LOCKED") {
      return NextResponse.json({ success: false, message: "تم قفل الحساب بسبب محاولات دخول غير صحيحة. يرجى التواصل مع فريق الدعم أو طلب إعادة تعيين رمز الدخول لإعادة تفعيل الحساب." }, { status: 403 });
    }

    const activeRaw = finalUser.Active
    const activeStr = String(activeRaw).toLowerCase()
    const isActive = activeRaw === true || activeStr === 'true' || activeStr === 'TRUE' || activeStr === '1'

    if(!isActive){
      return NextResponse.json({ success: false, message: `حسابك موقوف - Active = ${finalUser.Active}` }, { status: 403 });
    }
    if (status!== 'Active'){
      return NextResponse.json({ success: false, message: `الحساب غير مفعل - Status = ${status}` }, { status: 403 });
    }

    const allowedRoles = ['Admin','Store Owner','Driver','Taxi Driver','Assistant Admin','Accounting']
    if(!allowedRoles.includes(role)){
      return NextResponse.json({ success: false, message: `دورك ${role} غير مسموح حاليا` }, { status: 403 });
    }

    if (pinDb === pinStr) {
      await supabase.from('users').update({
        'failedAttempts': "0",
        'isLocked': "FALSE"
      }).eq('User ID', finalUser['User ID']);

      let taxiData = null
      if(finalUser['Taxi_ID']){
        const { data: driver } = await supabase
          .from('taxi_drivers')
          .select('engine_cc, vehicle_type, car_type, car_color, seats, full_name')
          .eq('Taxi_ID', finalUser['Taxi_ID'])
          .single()
        taxiData = driver
      }

      const cookieStore = await cookies();
      cookieStore.set('admin_session', JSON.stringify({
        userId: finalUser['User ID'],
        name: finalUser.Name,
        phone: phoneStr,
        role: role,
        AcceptedTerms: acceptedTerms,
        storeId: finalUser['Store ID'] || null,
        area: finalUser.Area || null,
        relatedId: finalUser['Related ID'] || null,
        Taxi_ID: finalUser['Taxi_ID'] || null,
        taxiId: finalUser['Taxi_ID'] || null,
        engine_cc: taxiData?.engine_cc || '1500',
        vehicle_type: taxiData?.vehicle_type || 'car',
        car_type: taxiData?.car_type || null,
        car_color: taxiData?.car_color || null,
        seats: taxiData?.seats || 4,
      }), { httpOnly: true, secure: false, sameSite: 'lax', path: '/', maxAge: 60*60*8 });

      let redirectTo;
      if (acceptedTerms!== "TRUE") {
        redirectTo = '/admin/terms-approval';
      } else {
        redirectTo = 
          role === 'Store Owner' ? '/store-owner' :
          role === 'Driver' ? '/driver-owner' :
          role === 'Taxi Driver' ? '/taxi-driver' :
          '/admin';
      }

      return NextResponse.json({ 
        success: true, 
        role,
        userId: finalUser['User ID'],
        AcceptedTerms: acceptedTerms,
        redirectTo,
        engine_cc: taxiData?.engine_cc || '1500',
        vehicle_type: taxiData?.vehicle_type || 'car'
      });
    }

    let newAttempts = attempts + 1;
    if (newAttempts >= 3) {
      await supabase.from('users').update({
        'failedAttempts': String(newAttempts),
        'PIN': "",
        'isLocked': "TRUE"
      }).eq('User ID', finalUser['User ID']);

      return NextResponse.json({ success: false, message: "تم قفل الحساب بسبب محاولات دخول غير صحيحة. يرجى التواصل مع فريق الدعم أو طلب إعادة تعيين رمز الدخول لإعادة تفعيل الحساب." }, { status: 403 });
    }

    await supabase.from('users').update({
      'failedAttempts': String(newAttempts)
    }).eq('User ID', finalUser['User ID']);

    return NextResponse.json({ success: false, message: `PIN غلط - محاولة ${newAttempts}/3` }, { status: 401 });

  } catch (e) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
