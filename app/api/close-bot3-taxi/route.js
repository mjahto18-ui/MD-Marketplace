export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

export async function POST() {
  const supabase = getSupabase();
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()

  const { data: sessions } = await supabase.from('bot_sessions')
    .select('*')
    .eq('Active Bot','BOT3_TAXI')
    .eq('Status','ACTIVE')
    .lt('Last Activity', tenMinAgo)

  if (!sessions?.length) return NextResponse.json({msg:'no bot3'})

  for (const s of sessions) {
    await supabase.from('bot_sessions').update({
      'Active Bot': 'BOT1',
      'Status': 'CLOSED',
      'Closed At': new Date().toISOString(),
      'Last Activity': new Date().toISOString()
    }).eq('Phone', s['Phone'])
  }
  return NextResponse.json({closed: sessions.length})
}
export async function GET() { return POST() }
