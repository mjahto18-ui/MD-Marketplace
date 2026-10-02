import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
export const dynamic = "force-dynamic";

function getSupabase(){
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const url = rawUrl?.replace('/rest/v1','').replace(/\/$/,'');
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;
  return createClient(url,key);
}

function getFriendlyDeviceType(ua = '') {
  const u = ua.toLowerCase()
  if (u.includes('iphone')) return 'iPhone'
  if (u.includes('ipad')) return 'iPad'
  if (u.includes('android')) return 'Android'
  if (u.includes('windows')) return 'Windows'
  if (u.includes('macintosh') || u.includes('mac os')) return 'Mac'
  if (u.includes('cros')) return 'ChromeOS'
  return 'Unknown'
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000; // متر
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export async function POST(req){
  try{
    let { employee_id, device_fingerprint, device_type, qr_token, lat, lng, accuracy } = await req.json()
    if(!qr_token || !device_fingerprint)
      return NextResponse.json({success:false, message:'ناقص بيانات'})

    let decoded = qr_token
    for(let i=0;i<3;i++){ try{ const d=decodeURIComponent(decoded); if(d===decoded) break; decoded=d }catch{break} }
    qr_token = decoded

    // --- هون التعديل الجديد: QR صار token::store_id::employee_id ---
    let tokenToCheck = qr_token
    let qrStoreId = null
    let qrEmployeeId = null

    if(qr_token.includes('::')){
      const parts = qr_token.split('::')
      tokenToCheck = parts[0]
      if(parts.length === 2){
        // الحالة الجديدة: token::store_id
        qrStoreId = parts[1]
      } else if(parts.length >= 3){
        // الحالة الجديدة الكاملة: token::store_id::employee_id
        qrStoreId = parts[1]
        qrEmployeeId = parts[2]
      }
      if(!employee_id && qrEmployeeId) employee_id = qrEmployeeId
    }

    const supabase = getSupabase()

    // 1. جيب التوكن وتأكد انه تابع لمتجر
    const { data: qrRow } = await supabase.from('office_qr_tokens')
      .select('*').eq('token', tokenToCheck).gt('expires_at', new Date().toISOString()).single()
    
    if(!qrRow) return NextResponse.json({success:false, message:'الـ QR منتهي - حدث الشاشة بالمكتب'})

    // 2. تأكد store_id من الـ QR يطابق store_id بالداتا
    const finalStoreId = qrStoreId || qrRow.store_id
    if(!finalStoreId){
      return NextResponse.json({success:false, message:'QR قديم - ولد QR جديد من صفحة المتجر'})
    }
    if(qrRow.store_id && qrRow.store_id !== finalStoreId){
      return NextResponse.json({success:false, message:'QR لا يطابق المتجر'})
    }

    // 3. جيب الموظف حسب البصمة إذا ما عنا ID
    if(!qrEmployeeId && !employee_id){
      const { data: empByPrint } = await supabase.from('employees')
        .select('id, device_fingerprint, full_name, store_id').eq('device_fingerprint', device_fingerprint).single()
      if(!empByPrint) return NextResponse.json({success:false, message:'جهازك غير موثق - اختر اسمك من الشاشة أول مرة'})
      employee_id = empByPrint.id
    }

    if(!employee_id) return NextResponse.json({success:false, message:'لايوجد ID لهذا الموظف - اختر اسمك من الشاشة'})
    
    // 4. جيب الموظف وتأكد انه تابع لنفس المتجر
    const { data: emp } = await supabase.from('employees')
      .select('id, device_fingerprint, full_name, store_id')
      .eq('id', employee_id).single()
    
    if(!emp) return NextResponse.json({success:false, message:'موظف مش موجود'})

    // --- أهم شرط أمان: الموظف لازم يكون تابع لنفس متجر الـ QR ---
    if(emp.store_id && emp.store_id !== finalStoreId){
      return NextResponse.json({success:false, message:`هذا الموظف تابع لمتجر ${emp.store_id} وليس ${finalStoreId} ❌`})
    }

    // 5. أول مرة - توثيق الجهاز + ربطه بالمتجر
    if(!emp.device_fingerprint){
      await supabase.from('employees').update({
        device_fingerprint,
        device_type: getFriendlyDeviceType(device_type),
        device_registered_at: new Date().toISOString(),
        store_id: finalStoreId // هون بيربط الموظف بالمتجر أول مرة
      }).eq('id', employee_id)
      return NextResponse.json({success:true, action:'bind', message:`✅ تم توثيق ${emp.full_name} لمتجر ${finalStoreId} - التقط مرة ثانية لتسجيل الوقت`})
    }

    if(emp.device_fingerprint !== device_fingerprint){
      return NextResponse.json({success:false, message:'هذا ليس جهازك الموثق!'})
    }

    // ===== الجديد: فحص المسافة 150 متر - اذا مافي لوكايشن بالمتجر بيمرق =====
    if(lat && lng){
      const { data: store } = await supabase.from('stores')
        .select('"Store ID", "Current Latitude", "Current Longitude", "Geofence Enabled", "Geofence Radius"')
        .eq('"Store ID"', finalStoreId).single()

      const enabled = store?.["Geofence Enabled"] ?? true
      const radius = store?.["Geofence Radius"] ?? 150
      const sLat = parseFloat(store?.["Current Latitude"])
      const sLng = parseFloat(store?.["Current Longitude"])

      if(enabled && sLat && sLng && !isNaN(sLat) && !isNaN(sLng)){
        const dist = haversine(parseFloat(lat), parseFloat(lng), sLat, sLng)
        if(dist > radius){
          return NextResponse.json({success:false, message:`بعيد ${Math.round(dist)}م عن المتجر - لازم تكون ضمن ${radius}م ❌`})
        }
      }
      // اذا Geofence Enabled = false او مافي لوكايشن بالمتجر -> بيمرق عادي
    }

    // 6. حضور / انصراف - مع حفظ store_id + location
    const { data: live } = await supabase.from('timesheet')
      .select('id, clock_in').eq('employee_id', employee_id).is('clock_out', null).maybeSingle()

    if(live){
      const hours = (Date.now() - new Date(live.clock_in).getTime())/1000/60/60
      await supabase.from('timesheet').update({
        clock_out: new Date().toISOString(), 
        total_hours: hours,
        location_lat: lat ? parseFloat(lat) : null,
        location_lng: lng ? parseFloat(lng) : null,
        notes: accuracy ? `acc:${Math.round(accuracy)}m` : null
      }).eq('id', live.id)
      return NextResponse.json({success:true, action:'clock_out', message:`تم تسجيل الخروج ${emp.full_name} ✅`})
    }else{
      await supabase.from('timesheet').insert({
        employee_id, 
        clock_in: new Date().toISOString(),
        store_id: finalStoreId, // هون بنحفظ الحضور مربوط بالمتجر
        location_lat: lat ? parseFloat(lat) : null,
        location_lng: lng ? parseFloat(lng) : null,
        source: 'app',
        notes: accuracy ? `acc:${Math.round(accuracy)}m` : null
      })
      return NextResponse.json({success:true, action:'clock_in', message:`تم تسجيل الدخول ${emp.full_name} ✅`})
    }

  }catch(e){
    console.log(e)
    return NextResponse.json({success:false, message:e.message},{status:500})
  }
}
