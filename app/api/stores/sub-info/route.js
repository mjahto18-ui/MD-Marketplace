import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req){
  const { searchParams } = new URL(req.url)
  const store_id = searchParams.get('store_id')
  if(!store_id) return NextResponse.json({enabled:false})

  const { data } = await supabase.from('stores')
   .select('subscription_enabled, subscription_end')
   .eq('"Store ID"', store_id).single()

  if(!data?.subscription_enabled) return NextResponse.json({enabled:false})

  const end = new Date(data.subscription_end)
  const diff = Math.ceil((end - new Date()) / 86400000)

  return NextResponse.json({
    enabled:true,
    end: data.subscription_end,
    daysLeft: diff,
    expired: diff < 0
  })
}
