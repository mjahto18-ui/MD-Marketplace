import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = "force-dynamic";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

export async function POST() {
  const supabase = getSupabase();
  const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID
  const ONESIGNAL_KEY = process.env.ONESIGNAL_REST_KEY

  const { data: broadcasts } = await supabase.from('broadcast').select('*').eq('Status','Pending').lte('Schedule At', new Date().toISOString())
  if (!broadcasts?.length) return NextResponse.json({msg:'No pending'})

  for (const b of broadcasts) {
    await supabase.from('broadcast').update({Status:'Sending'}).eq('Broadcast ID', b['Broadcast ID'])
    let q = supabase.from('users').select('"Subscription ID"').not('"Subscription ID"','is',null)
    if (b['Audience'] === 'Customer') q = q.eq('Role','customer')
    const { data: users } = await q
    const subs = (users||[]).map(u=>u['Subscription ID']).filter(Boolean)
    if (!subs.length) { await supabase.from('broadcast').update({Status:'Failed'}).eq('Broadcast ID', b['Broadcast ID']); continue }
    for (let i=0; i<subs.length; i+=2000) {
      await fetch('https://api.onesignal.com/notifications', {
        method:'POST',
        headers:{Authorization: `Key ${ONESIGNAL_KEY}`, 'Content-Type':'application/json'},
        body: JSON.stringify({ app_id: ONESIGNAL_APP_ID, include_subscription_ids: subs.slice(i,i+2000), headings: { en: b['Title'] }, contents: { en: b['Message'] } })
      })
    }
    await supabase.from('broadcast').update({Status:'Sent'}).eq('Broadcast ID', b['Broadcast ID'])
  }
  return NextResponse.json({done:true})
}

export async function GET() { return POST() }
