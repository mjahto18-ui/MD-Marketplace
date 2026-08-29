"use client"
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import Link from "next/link"

export default function ActiveOrdersPage() {
  const [orders, setOrders] = useState([])
  const [areas, setAreas] = useState({})
  const [customers, setCustomers] = useState({})
  const [drivers, setDrivers] = useState({})

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  useEffect(() => { fetchOrders() }, [])

  const fetchOrders = async () => {
    const { data: ordersData, error } = await supabase
     .from('order_requuest')
     .select('*')
     .neq('Delivery Status', 'Delivered')
     .order('Request Date', { ascending: false })

    if(error) console.log("ERROR:", error)
    if(!ordersData) return

    const [areasRes, customersRes, usersRes] = await Promise.all([
      supabase.from('areas').select('*'),
      supabase.from('customers').select('*'),
      supabase.from('users').select('*')
    ])

    const areasMap = {}
    areasRes.data?.forEach(a => {
      areasMap[a['Area ID'] || a['id']] = a['Area Name'] || a['Name']
    })

    const customersMap = {}
    customersRes.data?.forEach(c => {
      customersMap[c['Customer ID'] || c['id']] = c['Name'] || c['Customer Name']
    })

    const driversMap = {}
usersRes.data?.forEach(u => {
  const id = u['Related ID']
  if(id) driversMap[id] = u['Name']
})

    setAreas(areasMap)
    setCustomers(customersMap)
    setDrivers(driversMap)
    setOrders(ordersData || [])
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Active Orders - {orders.length}</h1>
      <div className="grid gap-4">
        {orders.map((order) => {
          const areaName = areas[order['Area']] || '-'
          const customerName = customers[order['customer ID']] || 'زبون غير معروف'
          // هون المهم: اذا ما لقا السائق ما بيعرض الكود ابدا
          const driverName = drivers[order['Assigned Driver']] || 'مش محدد'

          return (
            <Link
              key={order['Request ID']}
              href={`/admin/active-orders/${order['Request ID']}`}
              className="bg-white p-4 rounded-lg shadow hover:shadow-md border"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold">#{order['Request ID']} - {customerName}</span>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                  {order['Delivery Status'] || order['Approval Status']}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {order['Delivery Adress']} - {areaName} - {order['Total Amount']}
              </p>
              <p className="text-xs mt-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">🚚 {driverName}</span>
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
