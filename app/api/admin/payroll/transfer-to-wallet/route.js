export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { canAccess } from '@/lib/checkSub';
import { cookies } from 'next/headers';

function getSupabaseAdmin() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const url = rawUrl?.replace('/rest/v1','').replace(/\/$/,'');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("Missing Supabase URL");
  if (!key) throw new Error("Missing Key - تأكد من Vercel Env");
  return createClient(url, key);
}

export async function POST(req){
  try{
    const supabaseAdmin = getSupabaseAdmin();
    const { payroll_id, store_id } = await req.json();
    
    if(!payroll_id){
      return NextResponse.json({ success: false, message: 'payroll_id مطلوب' }, { status: 400 });
    }
    if(!store_id){
      return NextResponse.json({ success: false, message: 'store_id مطلوب' }, { status: 400 });
    }

    // === حماية الاشتراك - الادمن مستثنى ===
    const cookieStore = await cookies();
    const sessionRaw = cookieStore.get('admin_session')?.value
    let isAdmin = true; // كل يلي بيوصل لـ /api/admin هو ادمن
    try{
      const session = JSON.parse(sessionRaw || '{}')
      isAdmin = session.role === 'Admin' || session.role === 'Assistant Admin' || true
    }catch{}
    
    if(!isAdmin){
      const check = await canAccess(supabaseAdmin, store_id, 'payroll', isAdmin)
      if(!check.ok){
        return NextResponse.json({success:false, message: check.msg}, {status:402})
      }
    }
    // === نهاية الحماية ===

    const { data: payroll, error: fetchErr } = await supabaseAdmin
      .from('payroll_runs')
      .select('id, employee_id, amount, status, store_id, employees!inner(user_id, full_name, store_id)')
      .eq('id', payroll_id)
      .eq('store_id', store_id)
      .single();

    if(fetchErr || !payroll){
      return NextResponse.json({ success: false, message: 'الراتب مش موجود بهالمتجر' }, { status: 404 });
    }

    if(payroll.employees?.store_id !== store_id){
      return NextResponse.json({ success: false, message: `الموظف تابع لمتجر ${payroll.employees?.store_id} مش ${store_id}` }, { status: 403 });
    }

    if(payroll.status !== 'pending'){
      return NextResponse.json({ success: false, message: `الراتب حالتو ${payroll.status} مش pending` }, { status: 400 });
    }

    if(!payroll.employees?.user_id){
      return NextResponse.json({ success: false, message: `الموظف ${payroll.employees?.full_name} ما عندو حساب يوزر مربوط` }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('payroll_runs')
      .update({ status: 'in_wallet' })
      .eq('id', payroll_id)
      .eq('status', 'pending')
      .eq('store_id', store_id);

    if(error) throw error;

    return NextResponse.json({ success: true, message: `تم التحويل للمحفظة - متجر ${store_id}` });

  }catch(e){
    console.error('transfer error', e);
    return NextResponse.json({ success: false, message: 'خطأ سيفر: ' + e.message }, { status: 500 });
  }
}
