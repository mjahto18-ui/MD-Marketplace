import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function getSupabase() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const url = rawUrl?.replace('/rest/v1','').replace(/\/$/,'');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return createClient(url, key, {
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: 'no-store', next: { revalidate: 0 } })
    }
  });
}

export async function GET(req){
  try {
    const { searchParams } = new URL(req.url)
    const store_id = searchParams.get('store_id')
    if(!store_id) return NextResponse.json({enabled:false, needSub:true, expired:true, daysLeft:0}, {headers:{'Cache-Control':'no-store'}})

    const supabase = getSupabase()

    const { data, error } = await supabase.from('stores')
     .select('subscription_enabled, subscription_end, "Store ID"')
     .eq('Store ID', store_id)
     .maybeSingle()

    console.log('sub-info check', store_id, data, error)

    if(error || !data) return NextResponse.json({enabled:false, needSub:true, expired:true, daysLeft:0}, {headers:{'Cache-Control':'no-store'}})

    const enabled = data.subscription_enabled === true
    const endStr = data.subscription_end

    // 1 - ما في اشتراك او ما في تاريخ = بدها باقة
    if(!enabled || !endStr){
      return NextResponse.json({
        enabled: false,
        needSub: true,
        expired: true,
        end: null,
        daysLeft: 0,
        msg: '🔒 هالخدمة بدها باقة اشتراك تتفعل'
      }, {headers:{'Cache-Control':'no-store'}})
    }

    // 2 - في تاريخ - نحسب لآخر النهار 23:59:59
    const now = new Date()
    const end = new Date(endStr)
    end.setHours(23,59,59,999)

    const diff = Math.ceil((end - now) / 86400000)
    const expired = end < now

    return NextResponse.json({
      enabled: true,
      needSub: false,
      end: endStr,
      daysLeft: expired ? 0 : diff,
      expired,
      msg: expired ? `⛔ انتهت الخدمة بتاريخ ${endStr} ولازم تتجدد` : `✅ باقي ${diff} يوم`
    }, {headers:{'Cache-Control':'no-store, no-cache, must-revalidate'}})

  } catch(e) {
    console.log('sub-info catch', e.message)
    return NextResponse.json({enabled:false, needSub:true, expired:true, daysLeft:0, error: e.message}, {headers:{'Cache-Control':'no-store'}})
  }
}
