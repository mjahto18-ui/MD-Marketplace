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

  // نفس المنطق: جيب كل BOT2 ACTIVE قبل 30 دقيقة
  const { data: sessions } = await supabase.from('bot_sessions')
   .select('*')
   .eq('Active Bot','BOT2')
   .eq('Status','ACTIVE')
   .lt('Last Activity', thirtyMinAgo)

  // fallback لو الاعمدة lowercase
  let activeSessions = sessions;
  if (!activeSessions?.length) {
    const { data } = await supabase.from('bot_sessions').select('*').eq('active_bot','BOT2').eq('status','ACTIVE').lt('last_activity', thirtyMinAgo)
    activeSessions = data;
  }

  if (!activeSessions?.length) return NextResponse.json({msg:'no bots'})

  for (const s of activeSessions) {
    const phone = s['Phone'] || s['phone']
    const last8 = phone?.replace(/\D/g,'').slice(-8)
    if (!last8) continue

    // تسكير الجلسة - رجوع لـ BOT1 - نفس المنطق
    const botId = s['Bot ID'] || s['bot_id'] || s['Phone'] || s['phone'];
    await supabase.from('bot_sessions').update({
      'Active Bot': 'BOT1',
      'Status': 'CLOSED',
      'Closed At': new Date().toISOString(),
      'Last Activity': new Date().toISOString()
    }).eq('Bot ID', botId)

    // fallback lowercase
    await supabase.from('bot_sessions').update({
      active_bot: 'BOT1',
      status: 'CLOSED',
      closed_at: new Date().toISOString(),
      last_activity: new Date().toISOString()
    }).eq('phone', phone)

    const { data: users } = await supabase.from('users').select('*').eq('Role','customer')
    let customerUsers = users;
    if (!customerUsers?.length) {
      const { data } = await supabase.from('users').select('*').eq('role','customer')
      customerUsers = data;
    }

    const user = customerUsers?.find(u => {
      const num = (u['Whatsapp Number'] || u['Whatsapp Number'] || u['Mobile'] || u['mobile'] || u['whatsapp_number'] || '').replace(/\D/g,'').slice(-8)
      return num === last8
    })
    if (!user) continue

    const customerId = user['Customer ID'] || user['customer_id'];

    const { data: deleted } = await supabase.from('cart')
     .delete()
     .eq('Customer ID', customerId)
     .eq('Checked Out','FALSE')
     .select()

    let deletedRows = deleted;
    if (!deletedRows?.length) {
      const { data } = await supabase.from('cart').delete().eq('customer_id', customerId).eq('checked_out', false).select()
      deletedRows = data;
    }

    if (deletedRows?.length && (user['Subscription ID'] || user['subscription_id'])) {
      const subId = user['Subscription ID'] || user['subscription_id'];
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
