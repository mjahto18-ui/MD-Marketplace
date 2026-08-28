"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useParams } from "next/navigation"
import Link from "next/link"

export default function OrderDetailPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  useEffect(() => {
    fetchOrder()
  }, [id])

  const fetchOrder = async () => {
    const { data } = await supabase
    .from('order_requuest')
    .select('*')
    .eq('id', id)
    .single()
    setOrder(data)
  }

  if (!order) return <div className="p-6">Loading...</div>

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link href="/admin/active-orders" className="text-blue-600 mb-4 inline-block">
        ← Back
      </Link>

      <div className="bg-white p-6 rounded-lg shadow border">
        <h1 className="text-2xl font-bold mb-6">Order #{order.id}</h1>

        <div className="space-y-3">
          {Object.entries(order).map(([key, value]) => (
            <div key={key} className="flex justify-between border-b py-2">
              <span className="text-gray-500 text-sm">{key}</span>
              <span className="font-medium text-sm">{String(value || '-')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
