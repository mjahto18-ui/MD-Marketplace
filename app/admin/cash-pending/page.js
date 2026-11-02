"use client"
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import BackToDashboard from "@/components/BackToDashboard"

export default function CashPendingPage() {
  const [orders, setOrders] = useState([])
  const [names, setNames] = useState({ customers: {}, areas: {}, drivers: {} })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  useEffect(() => { fetchOrders() }, [])

  const fetchOrders = async () => {
    const { data } = await supabase
   .from('order_requuest')
   .select('*')
   .eq('Final Payment Method', 'Cash')
   .eq('Cash Status', 'Pending')
   .order('Request Date', { ascending: false })

    setOrders(data || [])

    const [cRes, aRes, uRes] = await Promise.all([
      supabase.from('customers').select('*'),
      supabase.from('areas').select('*'),
      supabase.from('users').select('*')
    ])

    const cMap = {}
    cRes.data?.forEach(c => cMap[c['Customer ID']] = c['Name'])

    const aMap = {}
    aRes.data?.forEach(a => aMap[a['Area ID'] || a['ID']] = a['Area Name'])

    const dMap = {}
    uRes.data?.forEach(u => {
      const id = u['Related ID']
      if(id) dMap[id] = u['Name']
    })

    setNames({ customers: cMap, areas: aMap, drivers: dMap })
  }

  const confirmCash = async (orderId) => {
  if(!confirm('تأكيد استلام الكاش؟ ' + orderId)) return

  const { data, error } = await supabase
   .from('order_requuest')
   .update({
      'Cash Status': 'Received',
      'Approval Status': 'Completed',
      'Collected By Driver': 'TRUE',
      'Archived Date': new Date().toISOString()
    })
   .eq('Request ID', orderId)
   .select()

  if(error) alert("Error: " + error.message)
  else if(!data || data.length === 0) alert("ما لقى الاوردر! الـ ID ما تطابق")
  else {
    alert('تم ✅')
    setOrders(prev => prev.filter(o => o['Request ID']!== orderId))
  }
}

  const formatLBP = (n)=>{
    const num = Number(String(n||0).replace(/,/g,''))||0
    return new Intl.NumberFormat('en-LB').format(num) + ' ل.ل'
  }

  return (
<div className="p-6">
  <BackToDashboard />

      <h1 className="text-2xl font-bold mb-6">Cash Pending - {orders.length}</h1>
      <div className="grid gap-4">
        {orders.map(order => {
          const driverName = names.drivers[order['Assigned Driver']] || 'مش محدد'
          const customerName = names.customers[order['customer ID']] || 'زبون غير معروف'
          const areaName = names.areas[order['Area']] || '-'

          // ✅ الجديد
          const totalAmount = Number(String(order['Total Amount']||0).replace(/,/g,''))||0
          const collectedAmount = Number(String(order['Collected Amount']|| order['Collected_Amount'] || 0).replace(/,/g,''))||0
          const diff = collectedAmount - totalAmount
          const hasOverpay = collectedAmount > 0 && diff!== 0

          return (
            <div key={order['Request ID']} className="bg-white p-4 rounded-lg shadow border">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-bold">#{String(order['Request ID']).slice(0,8)} - {customerName}</div>
                  <div className="text-sm text-gray-500">
                    {areaName} - {formatLBP(totalAmount)}
                  </div>
                  <div className="text-xs mt-1 text-gray-600">
                    {order['Delivery Adress']} | {order['Mobile']} |
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded ml-2">🚚 {driverName}</span>
                  </div>
                </div>
                <button onClick={() => confirmCash(order['Request ID'])} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm shrink-0 ml-4">
                  Confirm Cash
                </button>
              </div>

              {/* ✅ العامود الجديد - Collected Amount */}
              <div className="mt-3 grid grid-cols-3 gap-3 text-sm border-t pt-3 bg-gray-50 rounded-lg p-3">
                <div className="text-center border-l">
                  <div className="text- text-gray-400 uppercase">قيمة الفاتورة</div>
                  <div className="font-bold">{formatLBP(totalAmount)}</div>
                </div>
                <div className="text-center border-l">
                  <div className="text- text-gray-400 uppercase">Collected Amount</div>
                  <div className={`font-black ${collectedAmount===0? 'text-gray-400' : diff>0? 'text-green-600' : 'text-black'}`}>
                    {collectedAmount>0? formatLBP(collectedAmount) : 'ما انحط'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text- text-gray-400 uppercase">الفرق / الزيادة</div>
                  <div className={`font-black ${diff>0? 'text-green-600' : diff<0? 'text-red-600' : 'text-gray-400'}`}>
                    {hasOverpay? (diff>0? `+${formatLBP(diff)} زيادة` : `${formatLBP(diff)} نقص`) : '-'}
                  </div>
                </div>
              </div>

              {diff>0 && (
                <div className="mt-2 bg-yellow-100 border border-yellow-300 text-yellow-800 text-xs p-2 rounded-lg flex justify-between">
                  <span>⚠️ العميل دافع زيادة {formatLBP(diff)} - لازم تاخد من السائق {formatLBP(collectedAmount)} مش بس {formatLBP(totalAmount)}</span>
                  <span className="font-black">{formatLBP(collectedAmount)}</span>
                </div>
              )}
              {diff<0 && collectedAmount>0 && (
                <div className="mt-2 bg-red-100 border border-red-300 text-red-800 text-xs p-2 rounded-lg">
                  ⚠️ السائق جامع أقل {formatLBP(Math.abs(diff))} - في نقص!
                </div>
              )}
            </div>
          )
        })}
        {orders.length === 0 && <p className="text-gray-500">ما في شي معلق 👌</p>}
      </div>
    </div>
  )
}
