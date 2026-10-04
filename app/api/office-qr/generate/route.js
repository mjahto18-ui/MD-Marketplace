import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = "force-dynamic";

function getSupabase() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const url = rawUrl?.replace('/rest/v1','').replace(/\/$/,'');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

// بتدعمه GET و POST - التاجر بيبعت store_id
export async function GET(req){
  try{
    const { searchParams } = new URL(req.url)
    const store_id = searchParams.get('store_id')

    if(!store_id){
      return NextResponse.json({ success:false, message:'store_id مطلوب' }, {status:400})
    }

    const supabase = getSupabase()
    const token = `QR-${Date.now()}-${Math.random().toString(36).slice(2,12).toUpperCase()}`
    const expiresAt = new Date(Date.now() + 5*60*1000).toISOString()

    // مسح القديم لنفس المتجر فقط
    await supabase.from('office_qr_tokens').delete()
      .eq('store_id', store_id)
      .lt('expires_at', new Date().toISOString())

    // حفظ الجديد مربوط بالمتجر
    await supabase.from('office_qr_tokens').insert({ 
      token, 
      expires_at: expiresAt,
      store_id: store_id // <-- هون الربط
    })

    // QR بيحمل store_id جواته مشان ما حدا من برا يبصم
    const qr_string = `${token}::${store_id}`

    return NextResponse.json({ 
      success:true, 
      token, 
      store_id,
      qr_string, // هاد اللي بتعرضه كـ QR Code
      expires_at: expiresAt 
    })
  }catch(e){
    return NextResponse.json({ success:false, message:e.message }, {status:500})
  }
}

export async function POST(req){
  try{
    const { store_id } = await req.json()
    if(!store_id){
      return NextResponse.json({ success:false, message:'store_id مطلوب' }, {status:400})
    }

    const supabase = getSupabase()
    const token = `QR-${Date.now()}-${Math.random().toString(36).slice(2,12).toUpperCase()}`
    const expiresAt = new Date(Date.now() + 5*60*1000).toISOString()

    await supabase.from('office_qr_tokens').delete()
      .eq('store_id', store_id)
      .lt('expires_at', new Date().toISOString())

    await supabase.from('office_qr_tokens').insert({ 
      token, 
      expires_at: expiresAt,
      store_id
    })

    const qr_string = `${token}::${store_id}`

    return NextResponse.json({ 
      success:true, 
      token, 
      store_id,
      qr_string,
      expires_at: expiresAt 
    })
  }catch(e){
    return NextResponse.json({ success:false, message:e.message }, {status:500})
  }
}
