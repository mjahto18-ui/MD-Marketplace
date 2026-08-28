"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useParams } from "next/navigation"
import Link from "next/link"

export default function OrderDetailPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [details, setDetails] = useState([])
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  useEffect(() => {
    fetchOrder()
  }, [id])

  const fetchOrder = async () => {
    // 1. جيب الطلب الرئيسي
    const { data: orderData, error: orderError } = await supabase
     .from('order_requuest')
     .select('*')
     .eq('Request ID', id)
     .single()

    if(orderError) console.log(orderError)
    setOrder(orderData)

    // 2. جيب تفاصيل المنتجات
    const { data: detailsData } = await supabase
     .from('order_details')
     .select('*')
     .eq('Request ID', id)

    setDetails(detailsData || [])
  }

  if (!order) return <div className="p-6">Loading...</div>

  const totalWeight = details.reduce((sum, d) => sum + Number(d['Line Total'] || 0), 0)

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link href="/admin/active-orders" className="text-blue-600 mb-4 inline-block">
        ← Back
      </Link>

      <div className="bg-white p-6 rounded-lg shadow border mb-6">
        <h1 className="text-2xl font-bold mb-6">Order #{order['Request ID']}</h1>

        <div className="space-y-3">
          <div className="flex justify-between border-b py-2"><span className="text-gray-500">Customer ID</span><span className="font-medium">{order['customer ID']}</span></div>
          <div className="flex justify-between border-b py-2"><span className="text-gray-500">Approval Status</span><span className="font-medium">{order['Approval Status']}</span></div>
          <div className="flex justify-between border-b py-2"><span className="text-gray-500">Delivery Status</span><span className="font-medium">{order['Delivery Status']}</span></div>
          <div className="flex justify-between border-b py-2"><span className="text-gray-500">Address</span><span className="font-medium">{order['Delivery Adress']}</span></div>
          <div className="flex justify-between border-b py-2"><span className="text-gray-500">Total Weight</span><span className="font-bold text-blue-600">{totalWeight} kg</span></div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="font-bold mb-4">Items ({details.length})</h2>
        {details.map(d => (
          <div key={d['Detail ID']} className="flex justify-between border-b py-2 text-sm">
            <span>{d['Product ID']} x {d['Qty']}</span>
            <span>Weight: {d['Line Total']} - Store: {d['Store ID']}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
