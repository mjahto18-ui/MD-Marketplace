import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(req){
  try {
    const { requestID, driverId } = await req.json()

    if(!requestID || !driverId) return Response.json({error:'missing data'}, {status:400})

    // 1- جيب معلومات الطلب مشان نجيب Customer ID
    const { data: order } = await supabase
      .from('order_requuest')
      .select(`"Request ID", "customer ID", "Approval Status"`)
      .eq('"Request ID"', requestID)
      .single()

    if(!order) return Response.json({error:'Order not found'}, {status:404})

    // 2- حدث الطلب لـ Approved + السائق
    const { error: updateError } = await supabase
      .from('order_requuest')
      .update({
        "Approval Status": "Approved",
        "Assigned Driver": driverId,
        "Approved By": "Admin",
        "Request Date": new Date().toISOString()
      })
      .eq('"Request ID"', requestID)

    if(updateError) return Response.json({error: updateError.message}, {status:500})

    // 3- جيب اسم السائق
    const { data: driver } = await supabase
      .from('drivers')
      .select(`"Driver Name", "Mobile"`)
      .eq('"Driver ID"', driverId)
      .single()

    // 4- بعت رسالة للزبون عبر push_queue (OneSignal رح يلتقطها من عندك)
    const customerID = order['customer ID']
    
    if(customerID){
      await supabase.from('push_queue').insert({
        "Customer ID": customerID,
        "Title": "تم قبول طلبك",
        "Message": `السائق ${driver?.['Driver Name'] || driverId} في الطريق اليك - ${driver?.['Mobile'] || ''}`,
        "Status": "Pending",
        "Code": "ORDER_APPROVED"
      })

      // 5- بعت Webhook كمان (اذا عندك بوت)
      await supabase.from('webhook').insert({
        "Customer ID": customerID,
        "Title": "Order Approved",
        "Message": `تم تعيين السائق ${driver?.['Driver Name']} للطلب ${requestID}`,
        "Date": new Date().toISOString()
      })
    }

    return Response.json({success:true, message: `تم تعيين ${driver?.['Driver Name']} للطلب ${requestID}`})

  } catch(e){
    return Response.json({error: e.message}, {status:500})
  }
}
