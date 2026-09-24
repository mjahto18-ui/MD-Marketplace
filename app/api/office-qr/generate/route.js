import { createClient } from '@supabase/supabase-js'
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
    const supabase = getSupabase()
    const token = `QR-${Date.now()}-${Math.random().toString(36).slice(2,12).toUpperCase()}`
    const expiresAt = new Date(Date.now() + 5*60*1000).toISOString()

    // مسح القديم
    await supabase.from('office_qr_tokens').delete().lt('expires_at', new Date().toISOString())
    // حفظ الجديد
    await supabase.from('office_qr_tokens').insert({ token, expires_at: expiresAt })

    return NextResponse.json({ success:true, token, expires_at: expiresAt })
  }catch(e){
    return NextResponse.json({ success:false, message:e.message }, {status:500})
  }
}
