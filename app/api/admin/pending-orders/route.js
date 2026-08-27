import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(){
  // order_requuest كلها صغيرة + customer ID بحرف صغير!
  const { data: orders, error } = await supabase
    .from('order_requuest')
    .select(`"Request ID", "customer ID", "Mobile", "Customer Latitude", "Customer Longitude", "Approval Status", "Assigned Driver"`)
    .eq('"Approval Status"', 'Pending')

  if(error) return Response.json({error: error.message, details: error}, {status:500})
  if(!orders || orders.length===0) return Response.json([])

  const customerIds = [...new Set(orders.map(o=>o['customer ID']).filter(Boolean))]
  
  let map = {}
  if(customerIds.length>0){
    const { data: customers } = await supabase
      .from('customers')
      .select(`"Customer ID", "Name"`)
      .in('"Customer ID"', customerIds)
    customers?.forEach(c=>{ map[c['Customer ID']] = c['Name'] })
  }

  const result = orders.map(o=>({
    requestID: o['Request ID'],
    customerID: o['customer ID'],
    customerName: map[o['customer ID']] || 'زبون',
    mobile: o['Mobile'],
    customerLat: parseFloat(o['Customer Latitude']),
    customerLng: parseFloat(o['Customer Longitude']),
    approvalStatus: o['Approval Status'],
    assignedDriver: o['Assigned Driver']
  }))

  return Response.json(result)
}
