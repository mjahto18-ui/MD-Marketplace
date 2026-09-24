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

export async function POST(req){
  try{
    const cookieStore = await cookies();
    const sessionRaw = cookieStore.get('admin_session')?.value
    if(!sessionRaw) return NextResponse.json({success:false, message:'مو مسجل دخول'}, {status:401})

    const { employee_id } = await req.json()
    if(!employee_id) return NextResponse.json({success:false, message:'ما في ID'})

    const supabase = getSupabase()

    const { error } = await supabase.from('employees').update({
      device_type: null,
      device_fingerprint: null,
      device_registered_at: null
    }).eq('id', employee_id)

    if(error) return NextResponse.json({success:false, message:error.message}, {status:500})
    
    return NextResponse.json({success:true})
  }catch(e){
    console.log(e)
    return NextResponse.json({success:false, message:e.message}, {status:500})
  }
}
