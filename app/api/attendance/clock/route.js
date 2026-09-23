import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = "force-dynamic";

function getSupabase() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const url = rawUrl?.replace('/rest/v1','').replace(/\/$/,'');
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;
  return createClient(url, key);
}

export async function POST(req){
  try{
    let { employee_id, device_fingerprint, device_type, qr_token } = await req.json()
    if(!qr_token || !device_fingerprint)
      return NextResponse.json({success:false, message:'ناقص بيانات'})

    // فك التشفير - مهم مشان الايفون 11 لما يصور QR فيه لينك
    // الـ QR كان معمول encode مرتين
    let decodedToken = qr_token
    for(let i=0; i<3; i++){
      try{
        const d = decodeURIComponent(decodedToken)
        if(d === decodedToken) break
        decodedToken = d
      }catch{ break }
    }
    qr_token = decodedToken

    // هون الفك - اذا الـ QR فيه :: معناتا جاي من شاشة المكتب وفيه ID الموظف
    let tokenToCheck = qr_token
    if(qr_token.includes('::')){
      const parts = qr_token.split('::')
      tokenToCheck = parts[0]
      employee_id = parts[1] // مناخد الـ ID من الـ QR مش من الـ body
    }

    if(!employee_id) return NextResponse.json({success:false, message:'ما في ID موظف - صوّر الـ QR من جديد'})

    const supabase = getSupabase()

    // 1. فحص الـ QR صالح 5 دقايق - منفحص الـ base token بس
    const { data: qrRow } = await supabase.from('office_qr_tokens')
     .select('*').eq('token', tokenToCheck).gt('expires_at', new Date().toISOString()).single()

    if(!qrRow) return NextResponse.json({success:false, message:'الـ QR منتهي - حدث الصفحة بالمكتب'})

    // 2. جيب الموظف
    const { data: emp } = await supabase.from('employees').select('id, device_fingerprint').eq('id', employee_id).single()
    if(!emp) return NextResponse.json({success:false, message:'موظف مش موجود'})

    // 3. ربط البصمة - هون بتتاخد بصمة التلفون يلي صوّر، مش اللابتوب
    // هون رح تنحفظ بصمة الايفون 11 الحقيقية
    if(!emp.device_fingerprint){
      await supabase.from('employees').update({
        device_fingerprint,
        device_type: device_type?.slice(0,250),
        device_registered_at: new Date().toISOString()
      }).eq('id', employee_id)
    } else {
      if(emp.device_fingerprint !== device_fingerprint){
        return NextResponse.json({success:false, message:'هيدا مش تلفونك المسجل!'})
      }
    }

    // 4. شوف اذا ON ولا OFF
    const { data: live } = await supabase.from('timesheet')
     .select('id, clock_in').eq('employee_id', employee_id).is('clock_out', null).maybeSingle()

    if(live){
      const hours = (Date.now() - new Date(live.clock_in).getTime()) / (1000*60*60)
      await supabase.from('timesheet').update({
        clock_out: new Date().toISOString(),
        total_hours: hours
      }).eq('id', live.id)
      return NextResponse.json({success:true, action:'clock_out', message:'تم تسجيل الخروج'})
    }else{
      await supabase.from('timesheet').insert({
        employee_id,
        clock_in: new Date().toISOString()
      })
      return NextResponse.json({success:true, action:'clock_in', message:'تم تسجيل الدخول وربط الجهاز بنجاح ✅'})
    }

  }catch(e){
    console.log(e)
    return NextResponse.json({success:false, message:e.message}, {status:500})
  }
}
