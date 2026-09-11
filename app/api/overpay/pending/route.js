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
    .eq('Pending ID', id)
    .eq('Status', 'Pending')
    .single()

  if (error) {
    console.log('ERROR:', error.message)
    return NextResponse.json({ error: error.message, id }, { status: 500 })
  }
  
  return NextResponse.json({ 
    Net: data['Net'],
    CustomerId: data['Customer ID'],
    raw: data
  })
}
