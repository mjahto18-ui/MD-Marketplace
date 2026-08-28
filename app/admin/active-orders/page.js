'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ActiveOrdersPage() {
  const [orders, setOrders] = useState([]) // <-- هون كان الغلط

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('order_requuest')
      .select('*')
      .neq('Delivery Status', 'Delivered')
      .order('created_at', { ascending: false })
    
    setOrders(data || [])
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Active Orders</h1>
      <div className="grid gap-4">
        {orders.map((order) => (
          <Link 
            key={order.id} 
            href={`/admin/active-orders/${order.id}`}
            className="bg-white p-4 rounded-lg shadow hover:shadow-md border"
          >
            <div className="flex justify-between">
              <span>#{order.id} - {order['Customer Name']}</span>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                {order['Delivery Status']}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">{order['Address']}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
