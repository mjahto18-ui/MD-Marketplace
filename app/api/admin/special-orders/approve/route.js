import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export async function POST(req){
  try{
    const { requestId, price, deliveryFee, adminNote, reject } = await req.json();
    if(!requestId) return Response.json({success:false, message:'ناقص ID'}, {status:400});

    const { data: order, error: fetchErr } = await supabase.from('special_orders').select('*').eq('Request ID', requestId).single();
    if(fetchErr || !order) return Response.json({success:false, message:'مش موجود'}, {status:404});

    // رفض
    if(reject){
      await supabase.from('special_orders').update({ "Status":'Rejected', "ملاحظات الادمن": adminNote }).eq('Request ID', requestId);
      return Response.json({success:true});
    }

    const qty = Number(order['Quantity'] || 1);
    const unitPrice = Number(price || 0);
    const fee = Number(deliveryFee || 0);
    const itemsCost = unitPrice * qty;
    const total = itemsCost + fee;

    // 1. النسخ على order_requuest - هون كل Triggers القديمة بتشتغل لحالها
    // trg_assign_nearest_geofence, trg_notify_admin_order, trg_notify_customer_pending...
    const { data: newOrder, error: copyError } = await supabase.from('order_requuest').insert([{
      "customer ID": order['customer ID'],
      "Area": order['Area'],
      "Note": `طلب خاص: ${order['الطلب']} | كمية: ${qty} | متجر: ${order['Store Hint'] || 'غير محدد'} | ملاحظات الزبون: ${order['ملاحظات عامة'] || 'لا يوجد'} | صورة: ${order['صورة'] || ''}`,
      "Delivery Adress": order['Delivery Adress'],
      "Delivery Fee": fee,
      "Items Cost": itemsCost,
      "Total Amount": total,
      "Mobile": order['Mobile'],
      "Customer Latitude": order['Customer Latitude'],
      "Customer Longitude": order['Customer Longitude'],
      "Total Weight": 1,
      "Approval Status": 'Pending',
      "Delivery Status": 'Pending',
      "Cash Status": 'Pending',
      "Collected By Driver": 'FALSE',
      "Free Delivery Used": 'FALSE',
      "Payment Method": 'Cash',
      "Cerated Date": new Date().toISOString(),
      "Request Date": new Date().toISOString(),
      geofence_center_id: order['geofence_center_id'],
    }]).select().single();

    if(copyError){
      console.error('copyError', copyError);
      return Response.json({success:false, message: copyError.message}, {status:500});
    }

    // 2. حدّث الطلب الخاص - صار Converted مش Approved
    const { error: updateErr } = await supabase.from('special_orders').update({
      "سعر القطعة": unitPrice,
      "سعر المنتجات": itemsCost,
      "اجرة التوصيل": fee,
      "Total Amount": total,
      "ملاحظات الادمن": adminNote,
      "Status": 'Converted',
      "converted_request_id": newOrder['Request ID'],
      "Converted At": new Date().toISOString(),
    }).eq('Request ID', requestId);

    if(updateErr) console.error('updateErr', updateErr);

    return Response.json({success:true, converted_id: newOrder['Request ID'], total});
  }catch(e){
    console.error(e);
    return Response.json({success:false, message:e.message}, {status:500});
  }
}
