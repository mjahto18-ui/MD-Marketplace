import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
  const { data: bots } = await supabase.from('bots').select('"Bot ID"').lt('Created At', fifteenMinAgo)
  if (!bots?.length) return NextResponse.json({msg:'no bots'})
  const botIds = bots.map(b => b['Bot ID'])
  await supabase.from('cart').delete().in('Bot ID', botIds)
  await supabase.from('bots').delete().in('Bot ID', botIds)
  return NextResponse.json({closed: botIds.length})
}
export async function GET() { return POST() }
