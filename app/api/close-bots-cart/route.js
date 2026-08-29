export const dynamic = "force-dynamic";
// app/api/close-bots-cart/route.js
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID
  const ONESIGNAL_KEY = process.env.ONESIGNAL_REST_KEY

  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()

  const { data: sessions } = await supabase.from('bot_sessions')
    .select('*')
    .eq('"Active Bot"','BOT2')
    .eq('Status','ACTIVE')
    .lt('"Last Activity"', thirtyMinAgo)

  if (!sessions?.length) return NextResponse.json({msg:'no bots'})

  for (const s of sessions) {
    const phone = s['Phone']
    const last8 = phone?.replace(/\D/g,'').slice(-8)
    if (!last8) continue

    await supabase.from('bot_sessions').update({
      '"Active Bot"': 'BOT1',
      'Status': 'CLOSED',
      '"Closed At"': new Date().toISOString(),
      '"Last Activity"': new Date().toISOString()
    }).eq('"Bot ID"', s['Bot ID'])

    const { data: users } = await supabase.from('users').select('*').eq('Role','customer')
    const user = users?.find(u => {
      const num = (u['Whatsapp Number'] || u['Mobile'] || '').replace(/\D/g,'').slice(-8)
      return num === last8
    })
    if (!user) continue

    const { data: deleted } = await supabase.from('cart')
      .delete()
      .eq('"Customer ID"', user['Customer ID'])
      .or('"Checked Out".is.null,"Checked Out".eq.false')
      .select()

    if (deleted?.length && user['Subscription ID']) {
      await fetch('https://api.onesignal.com/notifications', {
        method:'POST',
        headers:{Authorization: `Key ${ONESIGNAL_KEY}`, 'Content-Type':'application/json'},
        body: JSON.stringify({
          app_id: ONESIGNAL_APP_ID,
          include_subscription_ids: [user['Subscription ID']],
          headings: { en: "🛒 تم حذف السلة" },
          contents: { en: "تم حذف سلتك تلقائياً بعد 30 دقيقة من عدم النشاط حرصاً على توفر المنتجات الطازجة للجميع 🌿\nفيك ترجع تطلب من جديد بأي وقت." }
        })
      })
    }
  }
  return NextResponse.json({closed: sessions.length})
}
export async function GET() { return POST() }
