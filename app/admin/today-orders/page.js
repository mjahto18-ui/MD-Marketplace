"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

export default function TodayOrdersPage() {
  const [orders, setOrders] = useState([])
  const [names, setNames] = useState({ customers: {}, areas: {}, drivers: {} })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  useEffect(() => { fetchOrders() }, [])

  const fetchOrders = async () => {
    const today = new Date()
    today.setHours(0,0,0,0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate()+1)

    const { data } = await supabase
    .from('order_requuest')
    .select('*')
    .gte('Request Date', today.toISOString())
    .lt('Request Date', tomorrow.toISOString())
    .order('Request Date', { ascending: false })

    setOrders(data || [])

    const [cRes, aRes, uRes] = await Promise.all([
      supabase.from('customers').select('Customer ID, Name'),
      supabase.from('areas').select('Area ID, ID, Area Name'),
      supabase.from('users').select('Related ID, Name')
    ])

    const cMap = {}; cRes.data?.forEach(c => cMap[c['Customer ID']] = c['Name'])
    const aMap = {}; aRes.data?.forEach(a => aMap[a['Area ID'] || a['ID']] = a['Area Name'])
    const dMap = {}; uRes.data?.forEach(u => { if(u['Related ID']) dMap[u['Related ID']] = u['Name'] })
    setNames({ customers: cMap, areas: aMap, drivers: dMap })
  }

  const total = orders.reduce((s,o)=>s+parseFloat(o['Total Amount']||0),0)

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">اوردرات اليوم - TODAY() - {orders.length}</h1>
      <p className="text-sm text-gray-500 mb-6">DATE([Request Date])=TODAY() - مجموع: {total.toFixed(2)} $</p>
      
      <div className="grid gap-4">
        {orders.map(order => {
          const driverName = names.drivers[order['Assigned Driver']] || 'مش محدد'
          const customerName = names.customers[order['customer ID']] || 'زبون'
          const areaName = names.areas[order['Area']] || '-'
          const time = new Date(order['Request Date']).toLocaleTimeString('ar-LB',{hour:'2-digit',minute:'2-digit'})
          return (
            <div key={order['Request ID']} className="bg-white p-4 rounded-lg shadow border-l-4 border-l-green-500 flex justify-between">
              <div>
                <div className="font-bold">#{order['Request ID']} - {customerName} <span className="text-xs text-gray-400">{time}</span></div>
                <div className="text-sm text-gray-500">{areaName} - {order['Total Amount']} - {order['Approval Status']}</div>
                <div className="text-xs mt-1">{order['Delivery Adress']} | {order['Mobile']} | <span className="bg-blue-100 px-2 py-0.5 rounded">🚚 {driverName}</span> <span className="bg-gray-100 px-2 py-0.5 rounded ml-1">{order['Delivery Status']}</span></div>
              </div>
            </div>
          )
        })}
        {orders.length === 0 && <p className="text-gray-500 text-center py-10">ما في اوردرات اليوم 👌</p>}
      </div>
    </div>
  )
}
