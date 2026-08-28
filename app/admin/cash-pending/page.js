"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

export default function CashPendingPage() {
  const [orders, setOrders] = useState([])
  const [names, setNames] = useState({ customers: {}, areas: {}, drivers: {} })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  useEffect(() => { fetchOrders() }, [])

  const fetchOrders = async () => {
    const { data } = await supabase
    .from('order_requuest')
    .select('*')
    .eq('Final Payment Method', 'Cash')
    .eq('Cash Status', 'Pending')
    .order('Request Date', { ascending: false })

    setOrders(data || [])

    const [cRes, aRes, uRes] = await Promise.all([
      supabase.from('customers').select('*'),
      supabase.from('areas').select('*'),
      supabase.from('users').select('*')
    ])

    const cMap = {}
    cRes.data?.forEach(c => cMap[c['Customer ID']] = c['Name'])

    const aMap = {}
    aRes.data?.forEach(a => aMap[a['Area ID'] || a['ID']] = a['Area Name'])

    const dMap = {}
    uRes.data?.forEach(u => {
      const id = u['Related ID']
      if(id) dMap[id] = u['Name']
    })

    setNames({ customers: cMap, areas: aMap, drivers: dMap })
  }

  const confirmCash = async (orderId) => {
  if(!confirm('تأكيد استلام الكاش؟ ' + orderId)) return
  
  console.log("بحاول حدث:", orderId, typeof orderId)
  
  const { data, error, count } = await supabase
    .from('order_requuest')
    .update({
      'Cash Status': 'Received',
      'Approval Status': 'Completed',
      'Archived Date': new Date().toISOString()
    })
    .eq('Request ID', orderId)
    .select()

  console.log("data راجع:", data)
  console.log("error راجع:", error)
  
  if(error) alert("Error: " + error.message)
  else if(!data || data.length === 0) alert("ما لقى الاوردر! الـ ID ما تطابق - جرب Number(orderId)")
  else {
    alert('تم ✅')
    setOrders(prev => prev.filter(o => o['Request ID'] !== orderId))
  }
}

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Cash Pending - {orders.length}</h1>
      <div className="grid gap-4">
        {orders.map(order => {
          const driverName = names.drivers[order['Assigned Driver']] || 'مش محدد'
          const customerName = names.customers[order['customer ID']] || 'زبون غير معروف'
          const areaName = names.areas[order['Area']] || '-'
          return (
            <div key={order['Request ID']} className="bg-white p-4 rounded-lg shadow border flex justify-between items-center">
              <div>
                <div className="font-bold">#{order['Request ID']} - {customerName}</div>
                <div className="text-sm text-gray-500">
                  {areaName} - {order['Total Amount']}
                </div>
                <div className="text-xs mt-1">
                  {order['Delivery Adress']} | {order['Mobile']} |
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded ml-2">🚚 {driverName}</span>
                </div>
              </div>
              <button onClick={() => confirmCash(order['Request ID'])} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                Confirm Cash Received
              </button>
            </div>
          )
        })}
        {orders.length === 0 && <p className="text-gray-500">ما في شي معلق 👌</p>}
      </div>
    </div>
  )
}
