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

  const { data: broadcasts } = await supabase
    .from('broadcast')
    .select('*')
    .eq('Status', 'Pending')
    .lte('Schedule At', new Date().toISOString())

  if (!broadcasts?.length) {
    return NextResponse.json({ msg: 'No pending' })
  }

  for (const b of broadcasts) {
    try {
      await supabase.from('broadcast').update({ Status: 'Sending' }).eq('Broadcast ID', b['Broadcast ID'])

      const audience = String(b['Audience'] || '').toLowerCase()
      const areaIds = (b['Area ID'] || []).map(x => String(x).toLowerCase().trim())

      const { data: users } = await supabase.from('users').select('*').not('"Subscription ID"', 'is', null)

      let ids = []

      for (const u of users || []) {
        if (String(u['Active']).toUpperCase() !== 'TRUE') continue
        if (String(u['Status']).toLowerCase() !== 'active') continue

        const role = String(u['Role'] || '').toLowerCase()
        const userArea = String(u['Area'] || '').toLowerCase().trim()
        const subId = u['Subscription ID']
        if (!subId) continue

        if (audience === 'all') ids.push(subId)
        if (audience === 'customer' && role === 'customer') ids.push(subId)
        if (audience === 'driver' && role === 'driver') ids.push(subId)
        if (audience === 'store owner' && role.includes('store')) ids.push(subId)
        if (audience === 'area' && areaIds.includes(userArea)) ids.push(subId)
      }

      ids = [...new Set(ids)]

      if (ids.length === 0) throw new Error('ما لقيت حدا')

      // === هون كان ناقص الديب لينك ===
      const deepLink = b['Deep Link'] || `https://www.md-marketplace.store/products/${b['Product ID']}`
      const buttonText = b['Button Text'] || 'اطلب الان'

      for (let i = 0; i < ids.length; i += 2000) {
        const res = await fetch('https://api.onesignal.com/notifications', {
          method: 'POST',
          headers: {
            Authorization: `Key ${process.env.ONESIGNAL_REST_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            app_id: process.env.ONESIGNAL_APP_ID,
            include_subscription_ids: ids.slice(i, i + 2000),
            headings: { en: b['Title'] },
            contents: { en: b['Message'] },
            big_picture: b['Image URL'] || undefined,
            // === هيدول هنن يلي كانو ناقصين ===
            url: deepLink,           // للويب والموبايل
            web_url: deepLink,       // للويب تحديداً
            app_url: deepLink,       // للتطبيق
            buttons: [
              { id: "order_now", text: buttonText }
            ],
            data: {
              productId: b['Product ID'],
              storeId: b['Store ID'],
              deepLink: deepLink
            }
          })
        })
        const json = await res.json()
        if (!res.ok) throw new Error(JSON.stringify(json))
      }

      await supabase.from('broadcast').update({
        Status: 'Sent',
        'Sent At': new Date().toISOString(),
        'Recipients': ids.length,
        'Sent Count': ids.length,
        'Error': null
      }).eq('Broadcast ID', b['Broadcast ID'])

    } catch (err) {
      await supabase.from('broadcast').update({
        Status: 'Failed',
        'Error': String(err),
        'Recipients': 0
      }).eq('Broadcast ID', b['Broadcast ID'])
    }
  }

  return NextResponse.json({ done: true })
}

export async function GET() { return POST() }
