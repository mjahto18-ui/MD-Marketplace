export const dynamic = "force-dynamic";
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(){
  const { data: orders, error } = await supabase
    .from('order_requuest')
    .select(`"Request ID", "customer ID", "Mobile", "Customer Latitude", "Customer Longitude", "Approval Status", "Assigned Driver", "Delivery Adress", "Items Cost", "Delivery Fee", "Total Amount", "Note", "Order Area", "Admin Note", "Area", "Cerated Date"`)
    .eq('"Approval Status"', 'Pending')

  if(error) return Response.json({error: error.message, details: error}, {status:500})
  if(!orders || orders.length===0) return Response.json([])

  const customerIds = [...new Set(orders.map(o=>o['customer ID']).filter(Boolean))]
  const areaCodes = [...new Set(orders.map(o=>o['Area']).filter(Boolean))]
  
  let customerMap = {}
  let areaMap = {}

  if(customerIds.length>0){
    const { data: customers } = await supabase
      .from('customers')
      .select(`"Customer ID", "Name"`)
      .in('"Customer ID"', customerIds)
    customers?.forEach(c=>{ customerMap[c['Customer ID']] = c['Name'] })
  }

  if(areaCodes.length>0){
    const { data: areas } = await supabase
      .from('areas')
      .select(`"Area ID", "Area Name"`)
      .in('"Area ID"', areaCodes)
    areas?.forEach(a=>{ areaMap[a['Area ID']] = a['Area Name'] })
  }

  const result = orders.map(o=>({
    requestID: o['Request ID'],
    customerID: o['customer ID'],
    customerName: customerMap[o['customer ID']] || 'زبون',
    mobile: o['Mobile'],
    customerLat: parseFloat(o['Customer Latitude']),
    customerLng: parseFloat(o['Customer Longitude']),
    approvalStatus: o['Approval Status'],
    assignedDriver: o['Assigned Driver'],
    deliveryAddress: o['Delivery Adress'],
    itemsCost: o['Items Cost'],
    deliveryFee: o['Delivery Fee'],
    totalAmount: o['Total Amount'],
    note: o['Note'],
    orderArea: o['Order Area'],
    adminNote: o['Admin Note'],
    areaCode: o['Area'],
    areaName: areaMap[o['Area']] || o['Area'] || '',
    createdDate: o['Cerated Date'],
    raw: o
  }))

  return Response.json(result)
}
