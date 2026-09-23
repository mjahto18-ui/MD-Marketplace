export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const url = rawUrl?.replace('/rest/v1','').replace(/\/$/,'');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("Missing Supabase URL");
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY - تأكد من Vercel Env اسمها SUPABASE_SERVICE_KEY");
  return createClient(url, key);
}

export async function POST(req){
  try{
    const supabaseAdmin = getSupabaseAdmin();
    const { payroll_id } = await req.json();
    
    if(!payroll_id){
      return NextResponse.json({ success: false, message: 'payroll_id مطلوب' }, { status: 400 });
    }

    const { data: payroll, error: fetchErr } = await supabaseAdmin
      .from('payroll_runs')
      .select('id, employee_id, amount, status, employees!inner(user_id, full_name)')
      .eq('id', payroll_id)
      .single();

    if(fetchErr || !payroll){
      return NextResponse.json({ success: false, message: 'الراتب مش موجود' }, { status: 404 });
    }

    if(payroll.status !== 'pending'){
      return NextResponse.json({ success: false, message: `الراتب حالتو ${payroll.status} مش pending` }, { status: 400 });
    }

    const employeeUserId = payroll.employees?.user_id;
    if(!employeeUserId){
      return NextResponse.json({ success: false, message: `الموظف ${payroll.employees?.full_name} ما عندو حساب يوزر مربوط` }, { status: 400 });
    }

    // ما بقى نشيك على جدول wallets لأنه مش موجود عندك - المحفظة هي wallet_transactions
    // اذا المبلغ 0 منغير الحالة بس بلا تحويل
    if(!payroll.amount || payroll.amount <= 0){
      const { error } = await supabaseAdmin
        .from('payroll_runs')
        .update({ status: 'in_wallet', updated_at: new Date().toISOString() })
        .eq('id', payroll_id)
        .eq('status', 'pending');
      if(error) throw error;
      return NextResponse.json({ success: true, message: 'تم - المبلغ 0' });
    }

    // هون بس منغير الحالة والـ Trigger بيعمل التحويل
    const { error: updateErr } = await supabaseAdmin
      .from('payroll_runs')
      .update({ 
        status: 'in_wallet',
        updated_at: new Date().toISOString()
      })
      .eq('id', payroll_id)
      .eq('status', 'pending');

    if(updateErr) throw updateErr;

    return NextResponse.json({ success: true, message: 'تم التحويل للمحفظة' });

  }catch(e){
    console.error('transfer error', e);
    return NextResponse.json({ success: false, message: 'خطأ سيفر: ' + e.message }, { status: 500 });
  }
}
