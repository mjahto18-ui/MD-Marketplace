import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(){
  try {
    const { data: orders, error } = await supabase
      .from('Order Requuest')
      .select(`"Request ID", "Customer ID", "Mobile", "Customer Latitude", "Customer Longitude", "Approval Status", "Assigned Driver"`)
      .eq('"Approval Status"', 'Pending')

    if(error){
      return Response.json({error: error.message, details: error}, {status:500})
    }

    if(!orders || orders.length === 0) return Response.json([])

    const customerIds = [...new Set(orders.map(o=>o['Customer ID']).filter(Boolean))]
    
    let usersMap = {}
    if(customerIds.length > 0){
      const { data: users } = await supabase
        .from('Users')
        .select(`"Customer ID", "Name"`)
        .in('"Customer ID"', customerIds)
      
      users?.forEach(u=>{ usersMap[u['Customer ID']] = u['Name'] })
    }

    const result = orders.map(o=>({
      requestID: o['Request ID'],
      customerID: o['Customer ID'],
      customerName: usersMap[o['Customer ID']] || 'زبون',
      mobile: o['Mobile'],
      customerLat: o['Customer Latitude'],
      customerLng: o['Customer Longitude'],
      approvalStatus: o['Approval Status'],
      assignedDriver: o['Assigned Driver']
    }))

    return Response.json(result)
  } catch(e){
    return Response.json({error: e.message}, {status:500})
  }
}
