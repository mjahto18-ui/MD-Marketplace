import { createClient } from "@supabase/supabase-js"
import { cookies } from 'next/headers'
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic";

function getSupabase() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const url = rawUrl?.replace('/rest/v1','').replace(/\/$/,'');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return createClient(url, key);
}

function genCode(){
  return Math.floor(10000 + Math.random()*90000).toString()
}

export async function POST(req){
  try{
    const cookieStore = await cookies();
    const sessionRaw = cookieStore.get('admin_session')?.value
    if(!sessionRaw) return NextResponse.json({success:false, message:'مو مسجل دخول'}, {status:401})
    const session = JSON.parse(sessionRaw)
    if(!['Admin','Assistant Admin','Accounting'].includes(session.role)){
      return NextResponse.json({success:false, message:'ما عندك صلاحية'}, {status:403})
    }

    const { month } = await req.json() // 2025-05
    if(!month) return NextResponse.json({success:false, message:'حدد الشهر'}, {status:400})

    const month_year = month // جدولك بيستعمل month_year text مباشرة

    const [y,m] = month.split('-').map(Number)
    const start = new Date(y, m-1, 1)
    const end = new Date(y, m, 1)

    const supabase = getSupabase()
    const { data: emps } = await supabase.from('employees').select('*').eq('is_active', true)
    if(!emps || emps.length===0) return NextResponse.json({success:false, message:'ما في موظفين'})

    let count = 0
    for(const emp of emps){
      const { data: ts } = await supabase.from('timesheet')
        .select('total_hours, overtime_hours')
        .eq('employee_id', emp.id)
        .gte('clock_in', start.toISOString())
        .lt('clock_in', end.toISOString())

      let regular = 0, overtime = 0
      ;(ts||[]).forEach(r=>{ regular += Number(r.total_hours||0); overtime += Number(r.overtime_hours||0) })

      let base_amount = 0, overtime_amount = 0
      if(emp.salary_type === 'hourly'){
        base_amount = regular * Number(emp.hourly_rate||0)
        overtime_amount = overtime * Number(emp.hourly_rate||0) * 1.5
      }else{
        base_amount = Number(emp.base_salary||0)
        const hourly = Number(emp.hourly_rate||0) || (Number(emp.base_salary||0) / 176)
        overtime_amount = overtime * hourly * 1.5
      }
      const amount = base_amount + overtime_amount
      const total_hours = regular + overtime

      // موجود قبل؟
      const { data: existing } = await supabase.from('payroll_runs')
        .select('id, status')
        .eq('employee_id', emp.id)
        .eq('month_year', month_year)
        .maybeSingle()

      if(existing){
        if(existing.status === 'claimed') continue
        await supabase.from('payroll_runs').update({
          total_hours,
          base_amount,
          overtime_hours: overtime,
          overtime_amount,
          amount
        }).eq('id', existing.id)
        count++
        continue
      }

      let code = genCode()
      // تأكد ما يتكرر بنفس الشهر
      for(let i=0;i<5;i++){
        const { data: dup } = await supabase.from('payroll_runs').select('id').eq('secret_code_5', code).eq('month_year', month_year).limit(1)
        if(!dup || dup.length===0) break
        code = genCode()
      }

      const { error } = await supabase.from('payroll_runs').insert({
        employee_id: emp.id,
        month_year,
        total_hours,
        amount,
        secret_code_5: code,
        status: 'pending',
        base_amount,
        overtime_hours: overtime,
        overtime_amount
      })
      if(!error) count++
      else console.log('insert error', error)
    }

    return NextResponse.json({success:true, count})

  }catch(e){
    console.log(e)
    return NextResponse.json({success:false, message:e.message}, {status:500})
  }
}
