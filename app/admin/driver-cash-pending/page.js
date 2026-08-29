"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

export default function DriverCashPendingPage() {
  const [orders, setOrders] = useState([])
  const [totalCash, setTotalCash] = useState(0)
  const [names, setNames] = useState({ customers: {}, areas: {} })
  const [driverId, setDriverId] = useState(null)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  useEffect(() => {
    const id = localStorage.getItem('driverId')
    if (id) setDriverId(id)
  }, [])

  useEffect(() => {
    if (driverId) fetchOrders(driverId)
  }, [driverId])

  const fetchOrders = async (id) => {
    const { data } = await supabase
     .from('order_requuest')
     .select('*')
     .eq('Assigned Driver', id) // هون عم نستعمل id يلي جاي كـ param مش من الـ state
     .eq('Final Payment Method', 'Cash')
     .eq('Cash Status', 'Pending')
     .order('Request Date', { ascending: false })

    setOrders(data || [])

    const total = data?.reduce((sum, o) => sum + (parseFloat(o['Total Amount']) || 0), 0) || 0
    setTotalCash(total)

    const [cRes, aRes] = await Promise.all([
      supabase.from('customers').select('Customer ID, Name'),
      supabase.from('areas').select('Area ID, ID, Area Name')
    ])

    const cMap = {}
    cRes.data?.forEach(c => cMap[c['Customer ID']] = c['Name'])
    const aMap = {}
    aRes.data?.forEach(a => aMap[a['Area ID'] || a['ID']] = a['Area Name'])

    setNames({ customers: cMap, areas: aMap })
  }

  if (!driverId) return <div className="p-6">عم حمل بيانات السائق...</div>

  return (
    <div className="p-6">
      <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-red-700">عليك دفع - Cash Due</h1>
          <p className="text-sm text-red-600">{orders.length} طلبات معلقة - Driver: {driverId}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-red-700">{totalCash} $</div>
          <div className="text-xs text-gray-500">المجموع الكلي</div>
        </div>
      </div>

      <div className="grid gap-4">
        {orders.map(order => {
          const customerName = names.customers[order['customer ID']] || 'زبون غير معروف'
          const areaName = names.areas[order['Area']] || '-'
          return (
            <div key={order['Request ID']} className="bg-white p-4 rounded-lg shadow border border-l-4 border-l-red-500">
              <div className="flex justify-between">
                <div className="font-bold">#{order['Request ID']} - {customerName}</div>
                <div className="font-bold text-red-600">{order['Total Amount']} $</div>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {areaName} - {order['Delivery Adress']} | {order['Mobile']}
              </div>
              <div className="text-xs mt-2 text-orange-600 bg-orange-50 px-2 py-1 rounded inline-block">
                ⏳ Cash Pending - لازم تسلم المصاري
              </div>
            </div>
          )
        })}
        {orders.length === 0 && <p className="text-gray-500 text-center py-10">ما عليك شي 👌 كلشي مدفوع</p>}
      </div>
    </div>
  )
}
