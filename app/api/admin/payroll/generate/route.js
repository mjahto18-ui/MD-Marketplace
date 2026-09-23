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
function genCode(){ return Math.floor(10000 + Math.random()*90000).toString() }

export async function POST(req){
  try{
    const cookieStore = await cookies();
    const sessionRaw = cookieStore.get('admin_session')?.value
    if(!sessionRaw) return NextResponse.json({success:false, message:'مو مسجل دخول'}, {status:401})
    const session = JSON.parse(sessionRaw)
    if(!['Admin','Assistant Admin','Accounting'].includes(session.role)){
      return NextResponse.json({success:false, message:'ما عندك صلاحية'}, {status:403})
    }
    const { month } = await req.json()
    if(!month) return NextResponse.json({success:false, message:'حدد الشهر'}, {status:400})

    const month_year = month
    const [y,m] = month.split('-').map(Number)
    const start = new Date(y, m-1, 1)
    const end = new Date(y, m, 1)

    const supabase = getSupabase()
    // هون صار يقرا required_hours من الجدول
    const { data: emps, error: empErr } = await supabase.from('employees').select('id, full_name, department, salary_type, base_salary, required_hours, is_active').eq('is_active', true)
    if(empErr) throw empErr
    if(!emps || emps.length===0) return NextResponse.json({success:false, message:'ما في موظفين فعالين'})

    let count=0, details=[]
    for(const emp of emps){
      let regular=0, overtime=0
      const { data: ts } = await supabase.from('timesheet')
        .select('total_hours, overtime_hours, clock_in')
        .eq('employee_id', emp.id)
        .gte('clock_in', start.toISOString())
        .lt('clock_in', end.toISOString())

      if(ts && ts.length>0){
        ts.forEach(r=>{ 
          regular += Number(r.total_hours||0)
          overtime += Number(r.overtime_hours||0)
        })
      }

      const baseSalary = Number(emp.base_salary||0)
      const REQUIRED = Number(emp.required_hours||286)
      
      // سعر الساعة بناء على اساس المعاش / المطلوب
      const hourly = REQUIRED > 0 ? baseSalary / REQUIRED : 0

      // كم ساعة محسوبة للاساسي (ما بتتخطى المطلوب)
      const regularForBase = Math.min(regular, REQUIRED)
      // ساعات زيادة فوق المطلوب تنحسب اوفرتايم
      const extraBeyond = Math.max(0, regular - REQUIRED)

      let base_amount = 0
      if(regular >= REQUIRED){
        base_amount = baseSalary // سكر المطلوب = الاساس كامل
      } else {
        base_amount = REQUIRED > 0 ? baseSalary * (regularForBase / REQUIRED) : 0 // نسبي
      }

      const totalOvertime = overtime + extraBeyond
      const overtime_amount = totalOvertime * hourly * 1.5

      const amount = Math.round(base_amount + overtime_amount)
      const total_hours = regular + overtime

      const { data: existing } = await supabase.from('payroll_runs')
        .select('id, status, secret_code_5')
        .eq('employee_id', emp.id)
        .eq('month_year', month_year)
        .maybeSingle()

      if(existing){
        if(existing.status === 'claimed'){
          details.push(`${emp.full_name}: مقبوض سابقا - تخطيناه`)
          continue
        }
        await supabase.from('payroll_runs').update({
          total_hours,
          base_amount: Math.round(base_amount),
          overtime_hours: totalOvertime,
          overtime_amount: Math.round(overtime_amount),
          amount
        }).eq('id', existing.id)
        count++
        details.push(`${emp.full_name}: ${regular}س اساسي + ${totalOvertime}س اضافي = ${amount}`)
        continue
      }

      let code = genCode()
      for(let i=0;i<8;i++){
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
        base_amount: Math.round(base_amount),
        overtime_hours: totalOvertime,
        overtime_amount: Math.round(overtime_amount)
      })
      if(!error){ count++; details.push(`${emp.full_name}: ${regular}س اساسي + ${totalOvertime}س اضافي = ${amount}`) }
      else details.push(`${emp.full_name}: خطأ ${error.message}`)
    }

    return NextResponse.json({success:true, count, details, month_year, message:`تم ${count} راتب - الشهر ${month_year} - حضور من ${start.toISOString().slice(0,10)} - المطلوب ${emps[0]?.required_hours||286}س`})

  }catch(e){
    console.log(e)
    return NextResponse.json({success:false, message:e.message}, {status:500})
  }
}
