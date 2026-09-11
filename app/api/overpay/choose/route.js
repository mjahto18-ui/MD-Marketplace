import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req) {
  try {
    const { pendingId, donateAmount, charityId } = await req.json()

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      return NextResponse.json({ error: `ENV ناقص: url=${!!url} key=${!!key}` }, { status: 500 })
    }

    const supabase = createClient(url, key)

    const { data, error } = await supabase.rpc('process_overpay_choice', {
      p_pending_id: pendingId,
      p_donate_amount: Number(donateAmount),
      p_charity_customer_id: charityId || null
    })

    if (error) {
      console.error('RPC ERROR:', error)
      return NextResponse.json({ error: error.message, hint: error.hint, details: error.details }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (e) {
    console.error('CATCH:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
