import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { canAccess } from '@/lib/checkSub'

export const dynamic = "force-dynamic";

function getSupabase() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const url = rawUrl?.replace('/rest/v1','').replace(/\/$/,'');
  // تصليح 1: SERVICE_ROLE اول مشان يقرا كل الجداول بدون RLS
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

export async function GET(request){
  try{
    const cookieStore = await cookies();
    const sessionRaw = cookieStore.get('admin_session')?.value
    if(!sessionRaw) return NextResponse.json({success:false, message:'مو مسجل دخول'}, {status:401})
    
    const session = JSON.parse(sessionRaw)
    const role = session.role
    
    const allowed = ['Admin','Assistant Admin','Store Owner','Store Manager','Store Assistant','Manager','Owner']
    if(!allowed.includes(role) && !session.storeId){
      return NextResponse.json({success:false, message:`ما عندك صلاحية - دورك ${role}`}, {status:403})
    }

    const { searchParams } = new URL(request.url)
    let store_id = searchParams.get('store_id')

    // تصليح 2: الفلتر - هاد هو سبب المشكلة عندك
    const isStoreUser = session.storeId && (role === 'Store Owner' || role === 'Store Manager' || role === 'Store Assistant' || role?.includes('Store'))
    if(isStoreUser){
      // Store Owner -> مجبور يشوف متجرو بس
      store_id = session.storeId
    }
    // Admin -> بياخد يلي بالفلتر ?store_id=STORE_TEBBANEH

    const supabase = getSupabase()

    // === حماية الاشتراك - مع canAccess الجديد ===
    if(store_id){
      const check = await canAccess(supabase, store_id, 'attendance')
      if(!check.ok){
        return NextResponse.json({
          success:false, 
          message: check.msg,
          employees: [],
          live: [],
          stats:{ on_now:0, present_today:0, absent:0, today_total:0 }
        }, {status:402})
      }
    }

    const todayStart = new Date()
    todayStart.setHours(0,0,0,0)

    let empQuery = supabase
      .from('employees')
      .select('id, full_name, department, user_id, salary_type, device_type, device_fingerprint, device_registered_at, store_id')
      .eq('is_active', true)
      .order('full_name')

    if(store_id){
      empQuery = empQuery.eq('store_id', store_id)
    }

    const { data: employees, error: empErr } = await empQuery
    if(empErr) console.log('empErr', empErr)

    const employeeIds = (employees||[]).map(e=>e.id)

    if(employeeIds.length===0){
      return NextResponse.json({
        success:true,
        employees: [],
        live: [],
        stats:{ on_now:0, present_today:0, absent:0, today_total:0 }
      })
    }

    const { data: liveRaw } = await supabase
      .from('timesheet')
      .select(`
        id,
        employee_id,
        clock_in,
        overtime_hours,
        employees ( full_name, department, device_type, device_fingerprint, device_registered_at )
      `)
      .in('employee_id', employeeIds)
      .is('clock_out', null)
      .order('clock_in', {ascending:false})

    const live = (liveRaw || []).map(r=>{
      const diffMs = Date.now() - new Date(r.clock_in).getTime()
      const hours_now = diffMs / (1000*60*60)
      return {
        id: r.id,
        employee_id: r.employee_id,
        full_name: r.employees?.full_name || '---',
        department: r.employees?.department || '',
        clock_in: r.clock_in,
        hours_now,
        overtime_hours: r.overtime_hours || 0,
        device_type: r.employees?.device_type || null,
        device_fingerprint: r.employees?.device_fingerprint || null,
        device_registered_at: r.employees?.device_registered_at || null
      }
    })

    const { data: todayRows } = await supabase
      .from('timesheet')
      .select('employee_id, total_hours, overtime_hours')
      .in('employee_id', employeeIds)
      .gte('clock_in', todayStart.toISOString())

    const presentIds = new Set((todayRows||[]).map(x=>x.employee_id).concat(live.map(x=>x.employee_id)))
    const present_today = presentIds.size
    const totalEmployees = (employees||[]).length
    const absent = totalEmployees - present_today

    let today_total = 0
    ;(todayRows||[]).forEach(r=>{ today_total += Number(r.total_hours||0) + Number(r.overtime_hours||0) })
    live.forEach(r=>{ today_total += Number(r.hours_now||0) + Number(r.overtime_hours||0) })

    return NextResponse.json({
      success:true,
      employees: employees || [],
      live,
      stats:{
        on_now: live.length,
        present_today,
        absent: absent <0 ? 0 : absent,
        today_total
      }
    })

  }catch(e){
    console.log(e)
    return NextResponse.json({success:false, message:e.message}, {status:500})
  }
}
