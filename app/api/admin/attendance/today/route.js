import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(){
  try{
    const todayStart = new Date()
    todayStart.setHours(0,0,0,0)

    // كل الموظفين النشطين
    const { data: employees } = await supabase
      .from('employees')
      .select('id, full_name, department, user_id, salary_type')
      .eq('is_active', true)
      .order('full_name')

    // مين ON هلا
    const { data: liveRaw } = await supabase
      .from('timesheet')
      .select(`
        id,
        employee_id,
        clock_in,
        overtime_hours,
        employees ( full_name, department )
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
        overtime_hours: r.overtime_hours || 0
      }
    })

    // دوام اليوم
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

    return Response.json({
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
    return Response.json({success:false, message:e.message}, {status:500})
  }
}
