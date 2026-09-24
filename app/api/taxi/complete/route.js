export const dynamic = "force-dynamic";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

export async function POST(req) {
  try {
    const supabase = getSupabase();
    const { order_id, taxi_id, amount_received, driver_note } = await req.json();

    if (!order_id || !taxi_id) return Response.json({ error: 'order_id & taxi_id required' }, { status: 400 });

    // INT - لازم يحط مبلغ
    if (!amount_received && amount_received !== 0) {
      return Response.json({ error: 'لازم تحط المبلغ المستلم' }, { status: 400 });
    }

    const amt = parseInt(String(amount_received).replace(/[^0-9]/g, ''));
    if (isNaN(amt) || amt <= 0) {
      return Response.json({ error: 'المبلغ غير صحيح' }, { status: 400 });
    }

    const { data: order } = await supabase.from('taxi_orders').select('*').eq('id', order_id).single();
    if (!order) return Response.json({ error: 'order not found' }, { status: 404 });
    if (order.taxi_id !== taxi_id) return Response.json({ error: 'not your order' }, { status: 403 });
    if (!order.is_code_verified) return Response.json({ error: 'لازم تأكد الكود أولا' }, { status: 400 });

    if (order.status === 'completed') return Response.json({ error: 'الطلب منتهي سابقا' }, { status: 400 });

    const total = parseInt(order.total_amount);
    
    // المبلغ المستلم ما لازم يكون اقل من المطلوب
    if (amt < total) {
      return Response.json({ error: `المبلغ ناقص - المطلوب ${total.toLocaleString()} وانت حاطط ${amt.toLocaleString()}` }, { status: 400 });
    }

    const overpay = amt - total;

    // جيب رصيد السواق
    const { data: driver } = await supabase.from('taxi_drivers').select('user_id').eq('Taxi_ID', taxi_id).single();
    // اذا ما لقيت user_id بالجدول، جيبو من users
    let driverUserId = driver?.user_id;
    if (!driverUserId) {
      const { data: u } = await supabase.from('users').select('"User ID"').eq('Taxi_ID', taxi_id).single();
      driverUserId = u?.["User ID"];
    }

    if (driverUserId) {
      const { data: txs } = await supabase.from('wallet_transactions').select('"Type","Amount"').eq('Owner User ID', driverUserId);
      let balance = 0;
      (txs || []).forEach(t => {
        balance += t.Type === 'ADD' ? Number(t.Amount) : -Number(t.Amount);
      });

      // هون الحماية يلي بدك ياها
      if (overpay > 0 && overpay > balance) {
        return Response.json({ 
          error: `رصيدك ${balance.toLocaleString()} ما بيغطي الزيادة ${overpay.toLocaleString()} - الزبون عطا ${amt.toLocaleString()} والمطلوب ${total.toLocaleString()}. خليه يعطيك عالقد او ارجعله الفرق كاش`,
          driver_balance: balance,
          overpay: overpay
        }, { status: 400 });
      }

      // حماية اضافية: اذا الزيادة اكتر من 500 الف، شك
      if (overpay > 500000) {
        return Response.json({ 
          error: `الزيادة كبيرة ${overpay.toLocaleString()} - لازم موافقة ادمن. تواصل مع الادمن`,
          overpay: overpay
        }, { status: 400 });
      }
    }

    const { data: updated, error } = await supabase.from('taxi_orders').update({
      status: 'completed',
      taxi_status: 'idle',
      amount_received: amt,
      admin_notes: driver_note || null,
      actual_end_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq('id', order_id).select().single();

    if (error) throw error;

    await supabase.from('taxi_drivers').update({ is_online: true }).eq('Taxi_ID', taxi_id);

    return Response.json({ success: true, order: updated });
  } catch (e) {
    // اذا التريغر وقفها
    if (e.message.includes('DRIVER_BALANCE_INSUFFICIENT')) {
      return Response.json({ error: 'رصيدك ما بيغطي الزيادة - راجع رسالة الخطأ' }, { status: 400 });
    }
    return Response.json({ error: e.message }, { status: 500 });
  }
}
