import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
export const dynamic = "force-dynamic";

function getSupabase(){
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const url = rawUrl?.replace('/rest/v1','').replace(/\/$/,'');
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;
  return createClient(url,key);
}

// هون التصليح - iPhone قبل Mac دائماً
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

export async function POST(req){
  try{
    let { employee_id, device_fingerprint, device_type, qr_token } = await req.json()
    if(!qr_token || !device_fingerprint)
      return NextResponse.json({success:false, message:'ناقص بيانات'})

    let decoded = qr_token
    for(let i=0;i<3;i++){ try{ const d=decodeURIComponent(decoded); if(d===decoded) break; decoded=d }catch{break} }
    qr_token = decoded

    let tokenToCheck = qr_token
    let qrEmployeeId = null
    if(qr_token.includes('::')){
      const p = qr_token.split('::')
      tokenToCheck = p[0]
      qrEmployeeId = p[1]
      if(!employee_id) employee_id = qrEmployeeId
    }

    const supabase = getSupabase()
    const { data: qrRow } = await supabase.from('office_qr_tokens')
      .select('*').eq('token', tokenToCheck).gt('expires_at', new Date().toISOString()).single()
    if(!qrRow) return NextResponse.json({success:false, message:'الـ QR منتهي - حدث الشاشة بالمكتب'})

    if(!qrEmployeeId){
      const { data: empByPrint } = await supabase.from('employees')
        .select('id, device_fingerprint, full_name').eq('device_fingerprint', device_fingerprint).single()
      if(!empByPrint) return NextResponse.json({success:false, message:'جهازك غير موثوق - اختر اسمك من الشاشة أول مرة'})
      employee_id = empByPrint.id
    }

    if(!employee_id) return NextResponse.json({success:false, message:'لايوجد ID لهذا الموظف - اختر اسمك من الشاشة'})
    const { data: emp } = await supabase.from('employees').select('id, device_fingerprint, full_name').eq('id', employee_id).single()
    if(!emp) return NextResponse.json({success:false, message:'موظف مش موجود'})

    if(!emp.device_fingerprint){
      await supabase.from('employees').update({
        device_fingerprint,
        device_type: getFriendlyDeviceType(device_type),
        device_registered_at: new Date().toISOString()
      }).eq('id', employee_id)
      return NextResponse.json({success:true, action:'bind', message:`✅ تم توثيق ${emp.full_name} - التقط مرة ثانية لتسجيل الوقت`})
    }

    if(emp.device_fingerprint !== device_fingerprint){
      return NextResponse.json({success:false, message:'هذا ليس جهازك الموثق!'})
    }

    const { data: live } = await supabase.from('timesheet')
      .select('id, clock_in').eq('employee_id', employee_id).is('clock_out', null).maybeSingle()

    if(live){
      const hours = (Date.now() - new Date(live.clock_in).getTime())/1000/60/60
      await supabase.from('timesheet').update({clock_out: new Date().toISOString(), total_hours: hours}).eq('id', live.id)
      return NextResponse.json({success:true, action:'clock_out', message:`تم تسجيل الخروج لهذا اليوم ${emp.full_name}`})
    }else{
      await supabase.from('timesheet').insert({employee_id, clock_in: new Date().toISOString()})
      return NextResponse.json({success:true, action:'clock_in', message:`تم تسجيل الدخول لهذا اليوم ${emp.full_name} ✅`})
    }

  }catch(e){
    console.log(e)
    return NextResponse.json({success:false, message:e.message},{status:500})
  }
}
