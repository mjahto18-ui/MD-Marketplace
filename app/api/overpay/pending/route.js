import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { data, error } = await supabase
    .from('pending_overpay')
    .select('*')
    .eq('id', id) // هلا منفتش بالـ pendingId مش بالـ customerId
    .eq('Status', 'Pending')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  
  // نفترض عندك عمود اسمه Net او Amount
  return NextResponse.json({ 
    Net: data.Net || data.amount || 0,
    CustomerId: data['Customer ID'] 
  })
}
