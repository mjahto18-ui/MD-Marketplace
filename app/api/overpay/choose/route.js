import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function POST(req) {
  const { pendingId, donateAmount, charityId } = await req.json()

  // اذا تبرع = 0 يعني بده يرجع كلو عالمحفظة
  // اذا تبرع > 0 لازم يكون مختار جمعية
  if (donateAmount > 0 && !charityId) {
    return NextResponse.json({ error: 'اختر جمعية' }, { status: 400 })
  }

  const { error } = await supabase.rpc('process_overpay_choice', {
    p_pending_id: pendingId,
    p_donate_amount: Number(donateAmount),
    p_charity_customer_id: charityId
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
