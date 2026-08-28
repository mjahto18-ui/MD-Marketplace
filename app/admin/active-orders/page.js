"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import Link from "next/link"

export default function ActiveOrdersPage() {
  const [orders, setOrders] = useState([])
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('order_requuest')
      .select('*')
      .neq('Delivery Status', 'Delivered')
      .order('Request Date', { ascending: false })
    
    if(error) console.log("ERROR:", error)
    setOrders(data || [])
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Active Orders</h1>
      <div className="grid gap-4">
        {orders.map((order) => (
          <Link 
            key={order['Request ID']} 
            href={`/admin/active-orders/${order['Request ID']}`}
            className="bg-white p-4 rounded-lg shadow hover:shadow-md border"
          >
            <div className="flex justify-between">
              <span>#{order['Request ID']} - {order['customer ID']}</span>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                {order['Delivery Status'] || order['Approval Status']}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {order['Delivery Adress']} - {order['Area']} - {order['Total Amount']}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
