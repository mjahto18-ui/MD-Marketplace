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
    const { order_id, taxi_id, code } = await req.json();

    if (!order_id || !taxi_id || !code) return Response.json({ error: 'order_id, taxi_id, code required' }, { status: 400 });

    const { data: order, error: fetchErr } = await supabase.from('taxi_orders').select('*').eq('id', order_id).single();
    if (fetchErr) throw fetchErr;
    if (order.taxi_id !== taxi_id) return Response.json({ error: 'not your order' }, { status: 403 });
    if (order.is_code_verified) return Response.json({ success: true, message: 'already verified' });

    if (String(order.secret_code) !== String(code).trim()) {
      return Response.json({ error: 'الكود غلط - تأكد من الزبونة' }, { status: 400 });
    }

    // ما منخصم هون - التريغر هو اللي بيخصم بالآخر مثل ما اتفقنا
    // بس منتحقق من الكود ومنحدث الحالة
    const { data: updated, error: updateErr } = await supabase.from('taxi_orders').update({
      is_code_verified: true,
      code_verified_at: new Date().toISOString(),
      status: 'in_progress',
      taxi_status: 'with_customer',
      updated_at: new Date().toISOString()
    }).eq('id', order_id).select().single();

    if (updateErr) throw updateErr;

    return Response.json({ success: true, order: updated, message: 'الكود صحيح - الرحلة انطلقت - الخصم سيتم عبر التريغر' });

  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
