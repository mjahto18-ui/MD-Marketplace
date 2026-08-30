export const dynamic = "force-dynamic";
// app/api/close-bots-cart/route.js
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new Error("Missing Supabase URL");
  return createClient(url, key);
}

export async function POST() {
  const supabase = getSupabase();
  const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID
  const ONESIGNAL_KEY = process.env.ONESIGNAL_REST_KEY

  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()

  const { data: activeSessions } = await supabase.from('bot_sessions')
 .select('*')
 .eq('Active Bot','BOT2')
 .eq('Status','ACTIVE')
 .lt('Last Activity', thirtyMinAgo)

  if (!activeSessions?.length) return NextResponse.json({msg:'no bots'})

  for (const s of activeSessions) {
    const phone = s['Phone']
    const last8 = phone?.replace(/\D/g,'').slice(-8)
    if (!last8) continue

    // تسكير الجلسة - المفتاح هو Phone حسب جدولك
    await supabase.from('bot_sessions').update({
      'Active Bot': 'BOT1',
      'Status': 'CLOSED',
      'Closed At': new Date().toISOString(),
      'Last Activity': new Date().toISOString()
    }).eq('Phone', phone)

    const { data: customerUsers } = await supabase.from('users').select('*').eq('Role','customer')

    const user = customerUsers?.find(u => {
      const num = (u['WhatsApp Number'] || u['Mobile'] || '').replace(/\D/g,'').slice(-8)
      return num === last8
    })
    if (!user) continue

    const customerId = user['Customer ID'];

    const { data: deletedRows } = await supabase.from('cart')
   .delete()
   .eq('Customer ID', customerId)
   .eq('Checked Out','FALSE')
   .select()

    if (deletedRows?.length && user['Subscription ID']) {
      const subId = user['Subscription ID'];
      await fetch('https://api.onesignal.com/notifications', {
        method:'POST',
        headers:{Authorization: `Key ${ONESIGNAL_KEY}`, 'Content-Type':'application/json'},
        body: JSON.stringify({
          app_id: ONESIGNAL_APP_ID,
          include_subscription_ids: [subId],
          headings: { en: "🛒 تم حذف السلة" },
          contents: { en: "تم حذف سلتك تلقائياً بعد 30 دقيقة من عدم النشاط حرصاً على توفر المنتجات الطازجة للجميع 🌿\nفيك ترجع تطلب من جديد بأي وقت." }
        })
      })
    }
  }
  return NextResponse.json({closed: activeSessions.length})
}
export async function GET() { return POST() }
