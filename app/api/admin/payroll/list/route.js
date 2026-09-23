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

export async function GET(req){
  try{
    const cookieStore = await cookies();
    const sessionRaw = cookieStore.get('admin_session')?.value
    if(!sessionRaw) return NextResponse.json({success:false, message:'مو مسجل دخول'}, {status:401})
    const session = JSON.parse(sessionRaw)

    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month')
    if(!month) return NextResponse.json({success:false, message:'حدد الشهر'}, {status:400})

    const [y,m] = month.split('-').map(Number)
    const start = new Date(y, m-1, 1)
    const end = new Date(y, m, 1)

    const supabase = getSupabase()

    const { data: rows } = await supabase.from('payroll_runs')
      .select(`
        id, amount, base_amount, overtime_amount, overtime_hours, total_regular_hours, total_overtime_hours,
        claim_code, status, claimed_at, claimed_by, period_start,
        employees ( full_name, department )
      `)
      .gte('period_start', start.toISOString())
      .lt('period_start', end.toISOString())
      .order('created_at', {ascending:false})

    return NextResponse.json({success:true, rows: rows||[]})

  }catch(e){
    console.log(e)
    return NextResponse.json({success:false, message:e.message}, {status:500})
  }
}
