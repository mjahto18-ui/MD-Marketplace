"use client"
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

export default function RejectedPage() {
  const [orders, setOrders] = useState([])
  const [names, setNames] = useState({ customers: {}, areas: {} })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  useEffect(() => { fetchOrders() }, [])

  const fetchOrders = async () => {
    const { data } = await supabase
    .from('order_requuest')
    .select('*')
    .eq('Approval Status', 'Rejected') // هون الفرق
    .order('Request Date', { ascending: false })

    setOrders(data || [])

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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-red-600">Rejected - مرفوضة - {orders.length}</h1>
      <div className="grid gap-4">
        {orders.map(order => {
          const customerName = names.customers[order['customer ID']] || order['customer ID'] || 'زبون'
          const areaName = names.areas[order['Area']] || order['Area'] || '-'
          return (
            <div key={order['Request ID']} className="bg-white p-4 rounded-lg shadow border-l-4 border-l-red-500 flex justify-between">
              <div>
                <div className="font-bold">#{order['Request ID']} - {customerName}</div>
                <div className="text-sm text-gray-500">{areaName} - {order['Total Amount']} $</div>
                <div className="text-xs mt-1">{order['Delivery Adress']} | {order['Mobile']}</div>
                <div className="text-xs mt-1 text-red-500">سبب الرفض: {order['Admin Note'] || order['Rejection Reason'] || '-'}</div>
              </div>
            </div>
          )
        })}
        {orders.length === 0 && <p className="text-gray-500">ما في مرفوضة 👌</p>}
      </div>
    </div>
  )
}
