import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export async function GET(){
  // جيب بس اللي Approval Status = Pending من Order Requuest
  const { data: orders, error } = await supabase
 .from('Order Requuest')
 .select(`
      Request ID,
      Customer ID,
      Mobile,
      Customer Latitude,
      Customer Longitude,
      Approval Status,
      Assigned Driver
    `)
 .eq('Approval Status', 'Pending')

  if(error) return Response.json({error: error.message}, {status:500})

  // جيب اسماء الزباين من Users
  const customerIds = [...new Set(orders.map(o=>o['Customer ID']))]
  
  const { data: users } = await supabase
 .from('Users')
 .select('Customer ID, Name')
 .in('Customer ID', customerIds)

  const usersMap = {}
  users?.forEach(u=>{ usersMap[u['Customer ID']] = u.Name })

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
}
