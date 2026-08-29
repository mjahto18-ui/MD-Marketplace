"use client"
import { useEffect, useState } from "react"

export default function CashPending({ driverId, supabase, formatLBP }) {
  const [orders, setOrders] = useState([])
  const [totalCash, setTotalCash] = useState(0)
  const [names, setNames] = useState({ customers: {}, areas: {} })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!driverId || !supabase) return
    fetchOrders(driverId)
  }, [driverId, supabase])

  const fetchOrders = async (id) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('order_requuest')
      .select('*')
      .eq('Assigned Driver', id)
      .eq('Final Payment Method', 'Cash')
      .eq('Cash Status', 'Pending')
      .order('Request Date', { ascending: false })

    if (!error) {
      setOrders(data || [])
      setTotalCash(data?.reduce((sum, o) => sum + (parseFloat(o['Total Amount']) || 0), 0) || 0)

      const [cRes, aRes] = await Promise.all([
        supabase.from('customers').select('Customer ID, Name'),
        supabase.from('areas').select('Area ID, ID, Area Name')
      ])
      const cMap = {}; cRes.data?.forEach(c => cMap[c['Customer ID']] = c['Name'])
      const aMap = {}; aRes.data?.forEach(a => aMap[a['Area ID'] || a['ID']] = a['Area Name'])
      setNames({ customers: cMap, areas: aMap })
    }
    setLoading(false)
  }

  if (loading) return <div className="p-6 text-white">عم حمل الكاش...</div>

  return (
    <div className="p-1">
      <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-red-700">عليك دفع - Cash Due</h1>
          <p className="text-sm text-red-600">{orders.length} طلبات - Driver: {driverId}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-red-700">{formatLBP ? formatLBP(totalCash) : totalCash + ' $'}</div>
        </div>
      </div>
      <div className="grid gap-4">
        {orders.map(order => {
          const customerName = names.customers[order['customer ID']] || 'زبون'
          return (
            <div key={order['Request ID']} className="bg-white p-4 rounded-lg shadow border-l-4 border-l-red-500">
              <div className="flex justify-between">
                <div className="font-bold text-black">#{order['Request ID']} - {customerName}</div>
                <div className="font-bold text-red-600">{formatLBP ? formatLBP(order['Total Amount']) : order['Total Amount'] + ' $'}</div>
              </div>
              <div className="text-sm text-gray-500 mt-1">{order['Delivery Adress']} | {order['Mobile']}</div>
            </div>
          )
        })}
        {orders.length === 0 && <p className="text-center py-10 text-gray-400">ما عليك شي 👌</p>}
      </div>
    </div>
  )
}
