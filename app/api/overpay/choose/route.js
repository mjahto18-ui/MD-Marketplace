import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

export async function POST(req) {
  const { pendingId, chosenWalletId, chosenWalletName, donateAmount, charityCustomerId } = await req.json()

  const { error } = await supabase.rpc('process_overpay_choice', {
    p_pending_id: pendingId,
    p_chosen_wallet_id: chosenWalletId,
    p_chosen_name: chosenWalletName,
    p_donate_amount: donateAmount,
    p_charity_customer_id: charityCustomerId || chosenWalletId
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
