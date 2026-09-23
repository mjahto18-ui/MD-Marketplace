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

    // فك التشفير - مشان مشكلة الـ double encode تبع QR
    let decodedToken = qr_token
    for(let i=0; i<3; i++){
      try{
        const d = decodeURIComponent(decodedToken)
        if(d === decodedToken) break
        decodedToken = d
      }catch{ break }
    }
    qr_token = decodedToken

    // فك الـ QR - فيه ::ID
    let tokenToCheck = qr_token
    if(qr_token.includes('::')){
      const parts = qr_token.split('::')
      tokenToCheck = parts[0]
      employee_id = parts[1]
    }

    if(!employee_id) return NextResponse.json({success:false, message:'ما في ID موظف - صوّر الـ QR من جديد'})

    const supabase = getSupabase()

    // 1. فحص الـ QR صالح 5 دقايق
    const { data: qrRow } = await supabase.from('office_qr_tokens')
     .select('*').eq('token', tokenToCheck).gt('expires_at', new Date().toISOString()).single()

    if(!qrRow) return NextResponse.json({success:false, message:'الـ QR منتهي - حدث الصفحة بالمكتب'})

    // 2. جيب الموظف
    const { data: emp } = await supabase.from('employees').select('id, device_fingerprint, full_name').eq('id', employee_id).single()
    if(!emp) return NextResponse.json({success:false, message:'موظف مش موجود'})

    // 3. اذا مربوط من قبل
    if(emp.device_fingerprint){
      if(emp.device_fingerprint !== device_fingerprint){
        return NextResponse.json({success:false, message:'هيدا الجهاز مربوط لموظف تاني! هيدا مش تلفونك المسجل'})
      }
      // نفس تلفونو وراجع يصور
      return NextResponse.json({success:true, action:'already_bound', message:`يا ${emp.full_name} تلفونك مربوط من قبل ✅`})
    }

    // 4. ربط جديد - بس بصمة، ما في دوام
    const { error } = await supabase.from('employees').update({
      device_fingerprint,
      device_type: device_type?.slice(0,250),
      device_registered_at: new Date().toISOString()
    }).eq('id', employee_id)

    if(error) throw error

    return NextResponse.json({
      success:true, 
      action:'bind',
      message:`✅ تم ربط بصمة تلفون ${emp.full_name} بنجاح`
    })

  }catch(e){
    console.log(e)
    return NextResponse.json({success:false, message:e.message}, {status:500})
  }
}
