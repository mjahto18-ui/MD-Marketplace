export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req){
  try{
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { payroll_id } = await req.json()
    
    if(!payroll_id){
      return NextResponse.json({ success: false, message: 'payroll_id مطلوب' }, { status: 400 })
    }

    const { data: payroll, error: fetchErr } = await supabaseAdmin
      .from('payroll_runs')
      .select('id, employee_id, amount, status, employees!inner(user_id, full_name)')
      .eq('id', payroll_id)
      .single()

    if(fetchErr || !payroll){
      return NextResponse.json({ success: false, message: 'الراتب مش موجود' }, { status: 404 })
    }

    if(payroll.status !== 'pending'){
      return NextResponse.json({ success: false, message: `الراتب حالتو ${payroll.status} مش pending` }, { status: 400 })
    }

    const employeeUserId = payroll.employees?.user_id
    if(!employeeUserId){
      return NextResponse.json({ success: false, message: `الموظف ${payroll.employees?.full_name} ما عندو حساب يوزر مربوط` }, { status: 400 })
    }

    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('id')
      .eq('user_id', employeeUserId)
      .single()

    if(!wallet){
      return NextResponse.json({ success: false, message: `الموظف ${payroll.employees?.full_name} ما عندو محفظة` }, { status: 400 })
    }

    const { error: updateErr } = await supabaseAdmin
      .from('payroll_runs')
      .update({ 
        status: 'in_wallet',
        updated_at: new Date().toISOString()
      })
      .eq('id', payroll_id)
      .eq('status', 'pending')

    if(updateErr){
      console.error('update error', updateErr)
      return NextResponse.json({ success: false, message: 'فشل تغيير الحالة: ' + updateErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'تم التحويل للمحفظة' })

  }catch(e){
    console.error(e)
    return NextResponse.json({ success: false, message: 'خطأ سيرفر: ' + e.message }, { status: 500 })
  }
}
