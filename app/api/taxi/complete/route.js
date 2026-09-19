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

    const { data: order } = await supabase.from('taxi_orders').select('*').eq('id', order_id).single();
    if (!order) return Response.json({ error: 'order not found' }, { status: 404 });
    if (order.taxi_id !== taxi_id) return Response.json({ error: 'not your order' }, { status: 403 });
    if (!order.is_code_verified) return Response.json({ error: 'لازم تأكد الكود أولا' }, { status: 400 });

    const { data: updated, error } = await supabase.from('taxi_orders').update({
      status: 'completed',
      taxi_status: 'idle',
      amount_received: parseInt(amount_received) || order.total_amount,
      admin_notes: driver_note || null,
      actual_end_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq('id', order_id).select().single();

    if (error) throw error;

    // رجع السايق Available
    await supabase.from('taxi_drivers').update({ is_online: true }).eq('Taxi_ID', taxi_id);

    return Response.json({ success: true, order: updated });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
