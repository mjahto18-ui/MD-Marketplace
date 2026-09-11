import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const customerId = searchParams.get('customerId')
  
  const { data, error } = await supabase
    .from('pending_overpay')
    .select('*')
    .eq('Customer ID', customerId)
    .eq('Status', 'Pending')
    .order('Created At', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
