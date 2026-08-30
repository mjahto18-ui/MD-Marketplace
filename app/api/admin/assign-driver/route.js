export const dynamic = "force-dynamic";
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url) throw new Error("SUPABASE_URL missing in env");
  return createClient(url, key);
}

export async function POST(req){
  try {
    const supabase = getSupabase();
    const { requestID, driverId } = await req.json()
    if(!requestID || !driverId) return Response.json({error:'missing data'}, {status:400})

    const { data: order } = await supabase
      .from('order_requuest')
      .select('*')
      .eq('Request ID', requestID)
      .single()

    if(!order) return Response.json({error:'Order not found '+requestID}, {status:404})

    const { error: updateError } = await supabase
      .from('order_requuest')
      .update({
        'Approval Status': 'Approved',
        'Assigned Driver': driverId,
        'Approved By': 'Admin'
      })
      .eq('Request ID', requestID)

    if(updateError) return Response.json({error: updateError.message}, {status:500})

    const { data: driver } = await supabase
      .from('drivers')
      .select('*')
      .eq('Driver ID', driverId)
      .single()

    const customerID = order['customer ID'] || order['Customer ID']
    
    if(customerID){
      await supabase.from('push_queue').insert({
        'Customer ID': customerID,
        'Title': 'تم قبول طلبك',
        'Message': `السائق ${driver?.['Driver Name'] || driverId} في الطريق اليك`,
        'Status': 'Pending',
        'Code': 'ORDER_APPROVED'
      })
    }

    return Response.json({success:true, message: `تم تعيين ${driver?.['Driver Name']}`})

  } catch(e){
    return Response.json({error: e.message}, {status:500})
  }
}
