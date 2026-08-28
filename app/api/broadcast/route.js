import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID
const ONESIGNAL_KEY = process.env.ONESIGNAL_REST_API_KEY

export async function POST() {
  const { data: broadcasts } = await supabase.from('broadcast').select('*').eq('Status','Pending').lte('Schedule At', new Date().toISOString())
  if (!broadcasts?.length) return NextResponse.json({msg:'No pending'})

  for (const b of broadcasts) {
    await supabase.from('broadcast').update({Status:'Sending'}).eq('Broadcast ID', b['Broadcast ID'])
    
    let q = supabase.from('users').select('"Subscription ID"').not('"Subscription ID"','is',null)
    if (b.Audience === 'Customer') q = q.eq('Role','customer')
    if (b.Audience === 'Store') q = q.eq('Role','store')
    if (b.Audience === 'Driver') q = q.eq('Role','driver')
    if (b.Audience === 'Area' && b['Area ID']?.length) q = q.in('Area', b['Area ID'])
    
    const { data: users } = await q
    const subs = (users||[]).map(u=>u['Subscription ID']).filter(Boolean)
    
    if (!subs.length) { await supabase.from('broadcast').update({Status:'Failed'}).eq('Broadcast ID', b['Broadcast ID']); continue }
    
    for (let i=0; i<subs.length; i+=2000) {
      await fetch('https://api.onesignal.com/notifications', {
        method:'POST',
        headers:{Authorization: `Key ${ONESIGNAL_KEY}`, 'Content-Type':'application/json'},
        body: JSON.stringify({
          app_id: ONESIGNAL_APP_ID,
          include_subscription_ids: subs.slice(i,i+2000),
          headings: { en: b.Title },
          contents: { en: b.Message },
          big_picture: b['Image URL'] || undefined,
          url: b['Deep Link'] || undefined
        })
      })
    }
    await supabase.from('broadcast').update({Status:'Sent'}).eq('Broadcast ID', b['Broadcast ID'])
  }
  return NextResponse.json({done:true})
}

export async function GET() { return POST() } // مشان الكرون يقدر يعمل GET
