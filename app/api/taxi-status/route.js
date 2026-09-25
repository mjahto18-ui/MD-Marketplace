export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
    const { customerId, taxi } = await req.json();

    if(!customerId){
      return NextResponse.json({ success: false, message: 'customerId مطلوب' }, { status: 400 });
    }

    // taxi مسموح يكون yes / no / null بس - هيدا اللي قلتلي عليه
    const allowed = ['yes', 'no', null, ''];
    if(!allowed.includes(taxi)){
      return NextResponse.json({ success: false, message: 'taxi لازم يكون yes او no او null' }, { status: 400 });
    }

    // تحديث بجدول users عن طريق Customer ID = 5555 نفسو اللي بجدول customers
    const { data, error } = await supabaseAdmin
     .from('users')
     .update({ taxi: taxi || null })
     .eq('Customer ID', String(customerId).trim())
     .select('"Customer ID", taxi');

    if(error) throw error;

    if(!data || data.length === 0){
      return NextResponse.json({ success: false, message: `ما لقيت يوزر عندو Customer ID = ${customerId}` }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'تم التحديث', updated: data[0] });

  }catch(e){
    console.error('taxi-status error', e);
    return NextResponse.json({ success: false, message: 'خطأ سيفر: ' + e.message }, { status: 500 });
  }
}
