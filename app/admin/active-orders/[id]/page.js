"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useParams } from "next/navigation"
import Link from "next/link"

export default function OrderDetailPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [details, setDetails] = useState([])
  const [names, setNames] = useState({ customers: {}, products: {}, stores: {}, areas: {} })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  useEffect(() => {
    fetchOrder()
  }, [id])

  const fetchOrder = async () => {
    const { data: orderData } = await supabase
    .from('order_requuest')
    .select('*')
    .eq('Request ID', id)
    .single()
    setOrder(orderData)

    const { data: detailsData } = await supabase
    .from('order_details')
    .select('*')
    .eq('Request ID', id)
    setDetails(detailsData || [])

    // جيب كل الجداول مرة وحدة
    const [customersRes, productsRes, storesRes, areasRes] = await Promise.all([
      supabase.from('customers').select('*'),
      supabase.from('products').select('*'),
      supabase.from('stores').select('*'),
      supabase.from('areas').select('*')
    ])

    const map = (data, idKeys, nameKeys) => {
      const m = {}
      data?.forEach(r => {
        const idVal = idKeys.map(k => r[k]).find(v => v)
        const nameVal = nameKeys.map(k => r[k]).find(v => v)
        if(idVal) m[idVal] = nameVal
      })
      return m
    }

    setNames({
      customers: map(customersRes.data, ['Customer ID', 'ID', 'id'], ['Name', 'Customer Name']),
      products: map(productsRes.data, ['Product ID', 'ID', 'Barcode', 'id'], ['Products Name', 'Product Name', 'Name']),
      stores: map(storesRes.data, ['Store ID', 'ID', 'id'], ['Store Name', 'Name']),
      areas: map(areasRes.data, ['Area ID', 'ID', 'id'], ['Area Name', 'Name'])
    })
  }

  if (!order) return <div className="p-6">Loading...</div>

  const totalWeight = details.reduce((sum, d) => sum + Number(d['Line Total'] || 0), 0)
  const customerName = names.customers[order['customer ID']] || order['customer ID']
  const areaName = names.areas[order['Area']] || order['Area']

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link href="/admin/active-orders" className="text-blue-600 mb-4 inline-block">← Back</Link>

      <div className="bg-white p-6 rounded-lg shadow border mb-6">
        <h1 className="text-2xl font-bold mb-2">Order #{order['Request ID']}</h1>
        <p className="text-gray-500 mb-6">{customerName} - {areaName}</p>

        <div className="space-y-3">
          <div className="flex justify-between border-b py-2"><span className="text-gray-500">Customer</span><span className="font-medium">{customerName}</span></div>
          <div className="flex justify-between border-b py-2"><span className="text-gray-500">Approval</span><span className="font-medium">{order['Approval Status']}</span></div>
          <div className="flex justify-between border-b py-2"><span className="text-gray-500">Delivery Status</span><span className="font-medium">{order['Delivery Status']}</span></div>
          <div className="flex justify-between border-b py-2"><span className="text-gray-500">Address</span><span className="font-medium">{order['Delivery Adress']}</span></div>
          <div className="flex justify-between border-b py-2"><span className="text-gray-500">Mobile</span><span className="font-medium">{order['Mobile']}</span></div>
          <div className="flex justify-between border-b py-2"><span className="text-gray-500">Total Weight</span><span className="font-bold text-blue-600">{totalWeight} kg</span></div>
          <div className="flex justify-between border-b py-2"><span className="text-gray-500">Total Amount</span><span className="font-bold">{order['Total Amount']}</span></div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="font-bold mb-4">Items ({details.length})</h2>
        {details.map(d => {
          const productName = names.products[d['Product ID']] || d['Product ID']
          const storeName = names.stores[d['Store ID']] || d['Store ID']
          return (
            <div key={d['Detail ID']} className="flex justify-between border-b py-3 text-sm">
              <div>
                <div className="font-medium">{productName}</div>
                <div className="text-gray-500">Qty: {d['Qty']} x {d['Unit Price']} - {storeName}</div>
              </div>
              <div className="text-right">
                <div>{d['Line Total']} kg</div>
                <div className="text-xs text-gray-500">{d['Store ID']}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
