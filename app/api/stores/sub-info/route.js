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
    if(!store_id) return NextResponse.json({enabled:false}, {headers:{'Cache-Control':'no-store'}})

    const supabase = getSupabase()

    const { data, error } = await supabase.from('stores')
     .select('subscription_enabled, subscription_end, "Store ID"')
     .eq('Store ID', store_id)
     .maybeSingle()

    console.log('sub-info check', store_id, data, error)

    if(error || !data) return NextResponse.json({enabled:false, error: error?.message}, {headers:{'Cache-Control':'no-store'}})
    if(!data.subscription_enabled) return NextResponse.json({enabled:false}, {headers:{'Cache-Control':'no-store'}})

    if(!data.subscription_end){
      return NextResponse.json({
        enabled:true,
        end: null,
        daysLeft: 999,
        expired: false
      }, {headers:{'Cache-Control':'no-store'}})
    }

    const today = new Date();
    today.setHours(0,0,0,0);

    const end = new Date(data.subscription_end);
    end.setHours(0,0,0,0);

    const diff = Math.round((end - today) / 86400000);

    return NextResponse.json({
      enabled:true,
      end: data.subscription_end,
      daysLeft: diff,
      expired: diff < 0
    }, {headers:{'Cache-Control':'no-store, no-cache, must-revalidate'}})

  } catch(e) {
    console.log('sub-info catch', e.message)
    return NextResponse.json({enabled:false, error: e.message}, {headers:{'Cache-Control':'no-store'}})
  }
}
