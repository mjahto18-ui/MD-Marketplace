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
    const { employee_id, device_fingerprint, device_type, qr_token } = await req.json()
    if(!employee_id || !device_fingerprint || !qr_token) 
      return NextResponse.json({success:false, message:'ناقص بيانات'})

    const supabase = getSupabase()

    // 1. فحص الـ QR صالح 5 دقايق
    const { data: qrRow } = await supabase.from('office_qr_tokens')
      .select('*').eq('token', qr_token).gt('expires_at', new Date().toISOString()).single()
    
    if(!qrRow) return NextResponse.json({success:false, message:'الـ QR منتهي - حدث الصفحة بالمكتب'})

    // 2. جيب الموظف
    const { data: emp } = await supabase.from('employees').select('id, device_fingerprint').eq('id', employee_id).single()
    if(!emp) return NextResponse.json({success:false, message:'موظف مش موجود'})

    // 3. ربط البصمة
    if(!emp.device_fingerprint){
      // اول مرة - ربط
      await supabase.from('employees').update({
        device_fingerprint,
        device_type,
        device_registered_at: new Date().toISOString()
      }).eq('id', employee_id)
    } else {
      // تاني مرة - تحقق
      if(emp.device_fingerprint !== device_fingerprint){
        return NextResponse.json({success:false, message:'هيدا مش تلفونك المسجل!'})
      }
    }

    // 4. شوف اذا ON ولا OFF
    const { data: live } = await supabase.from('timesheet')
      .select('id, clock_in').eq('employee_id', employee_id).is('clock_out', null).maybeSingle()

    if(live){
      // كان ON -> عملو OFF
      const hours = (Date.now() - new Date(live.clock_in).getTime()) / (1000*60*60)
      await supabase.from('timesheet').update({
        clock_out: new Date().toISOString(),
        total_hours: hours
      }).eq('id', live.id)
      return NextResponse.json({success:true, action:'clock_out', message:'تم تسجيل الخروج'})
    }else{
      // كان OFF -> عملو ON
      await supabase.from('timesheet').insert({
        employee_id,
        clock_in: new Date().toISOString()
      })
      return NextResponse.json({success:true, action:'clock_in', message:'تم تسجيل الدخول'})
    }

  }catch(e){
    console.log(e)
    return NextResponse.json({success:false, message:e.message}, {status:500})
  }
}
