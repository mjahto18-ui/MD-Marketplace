import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export async function GET(){
  const { data } = await supabase.from('special_orders').select('*').eq('Status','Pending').order('Cerated Date', {ascending:false});
  const orders = (data||[]).map(o=>({
    requestID: o['Request ID'],
    customerName: o['Customer Name'],
    mobile: o['Mobile'],
    areaCode: o['Area'],
    areaName: o['Area'],
    deliveryAddress: o['Delivery Adress'],
    orderText: o['الطلب'],
    storeHint: o['Store Hint'],
    quantity: o['Quantity'],
    note: o['ملاحظات عامة'],
    imageUrl: o['صورة'],
    distanceKm: o['Distance KM'],
    unitPrice: o['سعر القطعة'],
    deliveryFee: o['اجرة التوصيل'],
    adminNote: o['ملاحظات الادمن'],
    status: o['Status'],
  }));
  return Response.json({ orders });
}
