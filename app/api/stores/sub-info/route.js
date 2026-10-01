import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = "force-dynamic";

function getSupabase() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const url = rawUrl?.replace('/rest/v1','').replace(/\/$/,'');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return createClient(url, key);
}

export async function GET(req){
  const { searchParams } = new URL(req.url)
  const store_id = searchParams.get('store_id')
  if(!store_id) return NextResponse.json({enabled:false})

  const supabase = getSupabase()

  const { data, error } = await supabase.from('stores')
   .select('subscription_enabled, subscription_end')
   .eq('Store ID', store_id).single()

  console.log('sub-info check', store_id, data, error)

  if(error || !data) return NextResponse.json({enabled:false, error: error?.message})
  if(!data.subscription_enabled) return NextResponse.json({enabled:false})

  if(!data.subscription_end){
    return NextResponse.json({
      enabled:true,
      end: null,
      daysLeft: -1,
      expired: true
    })
  }

  const end = new Date(data.subscription_end)
  const diff = Math.ceil((end - new Date()) / 86400000)

  return NextResponse.json({
    enabled:true,
    end: data.subscription_end,
    daysLeft: diff,
    expired: diff < 0
  })
}
