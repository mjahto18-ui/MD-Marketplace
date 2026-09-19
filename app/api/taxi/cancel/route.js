export const dynamic = "force-dynamic";
import { createClient } from "@supabase/supabase-js";
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}
export async function POST(req){
  try{
    const supabase = getSupabase();
    const { order_id } = await req.json();
    if(!order_id) return Response.json({error:'order_id required'},{status:400});
    const { data: order } = await supabase.from('taxi_orders').select('status').eq('id',order_id).single();
    if(!order) return Response.json({error:'not found'},{status:404});
    if(['completed','cancelled'].includes(order.status)) return Response.json({success:true});

    const { data, error } = await supabase.from('taxi_orders').update({
      status: 'cancelled',
      admin_notes: `cancelled_by_customer at ${new Date().toISOString()} - was ${order.status}`,
      updated_at: new Date().toISOString()
    }).eq('id',order_id).select().single();
    if(error) throw error;
    return Response.json({success:true, order:data});
  }catch(e){ return Response.json({error:e.message},{status:500}); }
}
