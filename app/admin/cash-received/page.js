"use client"
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

export default function CashReceivedPage() {
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
   .eq('Cash Status', 'Received') // هون الفرق الوحيد
   .order('Archived Date', { ascending: false }) // ترتيب حسب تاريخ الاستلام

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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Cash Received - {orders.length}</h1>
      <div className="grid gap-4">
        {orders.map(order => {
          const driverName = names.drivers[order['Assigned Driver']] || 'مش محدد'
          const customerName = names.customers[order['customer ID']] || 'زبون غير معروف'
          const areaName = names.areas[order['Area']] || '-'
          return (
            <div key={order['Request ID']} className="bg-white p-4 rounded-lg shadow border flex justify-between items-center border-l-4 border-l-green-500">
              <div>
                <div className="font-bold">#{order['Request ID']} - {customerName}</div>
                <div className="text-sm text-gray-500">
                  {areaName} - {order['Total Amount']}
                </div>
                <div className="text-xs mt-1">
                  {order['Delivery Adress']} | {order['Mobile']} |
                  <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded ml-2">🚚 {driverName}</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded ml-2">
                    {order['Archived Date']? new Date(order['Archived Date']).toLocaleDateString() : ''}
                  </span>
                </div>
              </div>
              <div className="text-green-600 font-bold text-sm">
                ✅ تم الاستلام
              </div>
            </div>
          )
        })}
        {orders.length === 0 && <p className="text-gray-500">ما في كاش مستلم بعد</p>}
      </div>
    </div>
  )
}
