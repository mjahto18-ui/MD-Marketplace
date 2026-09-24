import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = "force-dynamic";

function getSupabase() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const url = rawUrl?.replace('/rest/v1','').replace(/\/$/,'');
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;
  return createClient(url, key);
}

export async function GET(){
  try{
    const cookieStore = await cookies();
    const sessionRaw = cookieStore.get('admin_session')?.value
    if(!sessionRaw) return NextResponse.json({success:false, message:'مو مسجل دخول'}, {status:401})
    
    const session = JSON.parse(sessionRaw)
    const role = session.role
    if(!['Admin','Assistant Admin'].includes(role)){
      return NextResponse.json({success:false, message:`ما عندك صلاحية - دورك ${role}`}, {status:403})
    }

    const supabase = getSupabase()
    const todayStart = new Date()
    todayStart.setHours(0,0,0,0)

    const { data: employees } = await supabase
      .from('employees')
      .select('id, full_name, department, user_id, salary_type, device_type, device_fingerprint, device_registered_at')
      .eq('is_active', true)
      .order('full_name')

    const { data: liveRaw } = await supabase
      .from('timesheet')
      .select(`
        id,
        employee_id,
        clock_in,
        overtime_hours,
        employees ( full_name, department, device_type, device_fingerprint, device_registered_at )
      `)
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
