import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(req){
  try{
    const body = await req.json()
    const { employee_id, type, hours, reason } = body

    if(!employee_id || !type) return Response.json({success:false, message:'ناقص بيانات'}, {status:400})

    // TODO: هون فيك تجيب اليوزر من الكوكيز وتتأكد انو Admin / Assistant Admin
    // const approved_by = session.userId
    const approved_by = null

    if(type === 'on'){
      // تأكد مش فاتح دوام اصلا
      const { data: open } = await supabase.from('timesheet').select('id').eq('employee_id', employee_id).is('clock_out', null).limit(1)
      if(open && open.length>0) return Response.json({success:false, message:'هيدا الموظف اصلا ON'})

      const { error } = await supabase.from('timesheet').insert({
        employee_id,
        clock_in: new Date().toISOString(),
        source: 'manual_admin',
        approved_by,
        notes: 'ON يدوي من الادمن'
      })
      if(error) throw error
    }

    if(type === 'off'){
      const { data: open } = await supabase.from('timesheet').select('id, clock_in').eq('employee_id', employee_id).is('clock_out', null).order('clock_in',{ascending:false}).limit(1).single()
      if(!open) return Response.json({success:false, message:'ما عندو دوام مفتوح'})

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
      if(!hours || hours<=0) return Response.json({success:false, message:'حط ساعات صحيحة'})
      
      const { error } = await supabase.from('timesheet').insert({
        employee_id,
        clock_in: new Date().toISOString(),
        clock_out: new Date().toISOString(),
        total_hours: 0,
        overtime_hours: parseFloat(hours),
        overtime_reason: reason || 'اضافي يدوي',
        source: 'manual_admin',
        approved_by,
        notes: `اوفرتايم يدوي: ${reason||''}`
      })
      if(error) throw error
    }

    return Response.json({success:true})

  }catch(e){
    console.log(e)
    return Response.json({success:false, message:e.message}, {status:500})
  }
}
