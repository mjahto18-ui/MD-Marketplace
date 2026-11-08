import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export async function POST(req){
  const { requestId, price, deliveryFee, adminNote, reject } = await req.json();
  const { data: order } = await supabase.from('special_orders').select('*').eq('Request ID', requestId).single();
  if(!order) return Response.json({success:false, message:'مش موجود'}, {status:404});
  if(reject){
    await supabase.from('special_orders').update({ "Status":'Rejected', "ملاحظات الادمن": adminNote }).eq('Request ID', requestId);
    return Response.json({success:true});
  }
  const qty = order['Quantity']||1;
  await supabase.from('special_orders').update({
    "سعر القطعة": price,
    "سعر المنتجات": price*qty,
    "اجرة التوصيل": deliveryFee,
    "Total Amount": price*qty + deliveryFee,
    "ملاحظات الادمن": adminNote,
    "Status":'Approved'
  }).eq('Request ID', requestId);
  return Response.json({success:true});
}
