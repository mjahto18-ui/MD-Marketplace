import { createClient } from "@supabase/supabase-js"
import { cookies } from 'next/headers'
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic";

function getSupabase() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const url = rawUrl?.replace('/rest/v1','').replace(/\/$/,'');
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  // للكتابة لازم service key
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return createClient(url, serviceKey);
}

export async function POST(req){
  try{
    const cookieStore = await cookies();
    const sessionRaw = cookieStore.get('admin_session')?.value
    if(!sessionRaw) return NextResponse.json({success:false, message:'مو مسجل دخول'}, {status:401})
    
    const session = JSON.parse(sessionRaw)
    const role = session.role
    const userId = session.userId

    if(!['Admin','Assistant Admin'].includes(role)){
      return NextResponse.json({success:false, message:`ما عندك صلاحية - دورك ${role}`}, {status:403})
    }

    const supabase = getSupabase()
    const body = await req.json()
    const { employee_id, type, hours, reason } = body

    if(!employee_id || !type) return NextResponse.json({success:false, message:'ناقص بيانات'}, {status:400})

    if(type === 'on'){
      const { data: open } = await supabase.from('timesheet').select('id').eq('employee_id', employee_id).is('clock_out', null).limit(1)
      if(open && open.length>0) return NextResponse.json({success:false, message:'هيدا الموظف اصلا ON'})

      const { error } = await supabase.from('timesheet').insert({
        employee_id,
        clock_in: new Date().toISOString(),
        source: 'manual_admin',
        approved_by: userId,
        notes: `ON يدوي بواسطة ${session.name || userId}`
      })
      if(error) throw error
    }

    if(type === 'off'){
      const { data: open } = await supabase.from('timesheet').select('id, clock_in').eq('employee_id', employee_id).is('clock_out', null).order('clock_in',{ascending:false}).limit(1).maybeSingle()
      if(!open) return NextResponse.json({success:false, message:'ما عندو دوام مفتوح'})

      const clock_out = new Date()
      const diffMs = clock_out.getTime() - new Date(open.clock_in).getTime()
      const total_hours = diffMs / (1000*60*60)

      const { error } = await supabase.from('timesheet').update({
        clock_out: clock_out.toISOString(),
        total_hours: parseFloat(total_hours.toFixed(2))
      }).eq('id', open.id)
      if(error) throw error
    }

    if(type === 'overtime'){
      if(!hours || hours<=0) return NextResponse.json({success:false, message:'حط ساعات صحيحة'})
      
      const { error } = await supabase.from('timesheet').insert({
        employee_id,
        clock_in: new Date().toISOString(),
        clock_out: new Date().toISOString(),
        total_hours: 0,
        overtime_hours: parseFloat(hours),
        overtime_reason: reason || 'اضافي يدوي',
        source: 'manual_admin',
        approved_by: userId,
        notes: `اوفرتايم ${hours}ساعة بواسطة ${session.name} - السبب: ${reason||''}`
      })
      if(error) throw error
    }

    return NextResponse.json({success:true, by: session.name})

  }catch(e){
    console.log(e)
    return NextResponse.json({success:false, message:e.message}, {status:500})
  }
}
