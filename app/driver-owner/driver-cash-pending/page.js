"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

export default function DriverCashPendingPage() {
  const [orders, setOrders] = useState([])
  const [totalCash, setTotalCash] = useState(0)
  const [names, setNames] = useState({ customers: {}, areas: {} })
  const [driverId, setDriverId] = useState(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  useEffect(() => {
    getDriverId()
  }, [])

  const getDriverId = async () => {
    setLoading(true)
    // 1. جرب من localStorage اول شي
    let id = localStorage.getItem('driverId')

    // 2. اذا مافي - جيبو من الـ Auth session
    if (!id) {
      const { data: { session } } = await supabase.auth.getSession()
      const userPhone = session?.user?.phone || session?.user?.user_metadata?.phone || session?.user?.email

      if (userPhone) {
        // LOOKUP من Mobile -> Related ID
        const { data: userData } = await supabase
          .from('users')
          .select('Related ID, Mobile')
          .or(`Mobile.eq.${userPhone},User ID.eq.${userPhone},Email.eq.${userPhone}`)
          .single()
        
        if (userData) id = userData['Related ID']
      }
    }

    // 3. اذا لسا مافي - جرب تجيب الـ user من جدول users حسب الـ current user
    if (!id) {
       // هون اذا عندك context للـ user - غيرها حسب عندك
       const currentUserMobile = localStorage.getItem('userMobile') || localStorage.getItem('phone')
       if(currentUserMobile) {
         const { data } = await supabase.from('users').select('Related ID').eq('Mobile', currentUserMobile).single()
         if(data) id = data['Related ID']
       }
    }

    if (id) {
      setDriverId(id)
      localStorage.setItem('driverId', id) // احفظو مشان المرة الجاي
      fetchOrders(id)
    }
    setLoading(false)
  }

  const fetchOrders = async (id) => {
    const { data } = await supabase
      .from('order_requuest')
      .select('*')
      .eq('Assigned Driver', id)
      .eq('Final Payment Method', 'Cash')
      .eq('Cash Status', 'Pending')
      .order('Request Date', { ascending: false })

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

  if (loading) return <div className="p-6">عم حمل بيانات السائق...</div>
  
  if (!driverId) return (
    <div className="p-6">
      <p className="text-red-500">ما لقيت الـ Driver ID - تأكد انك عامل login كـ driver ورقم الموبايل موجود بجدول users</p>
      <p className="text-xs mt-2">localStorage driverId = {localStorage.getItem('driverId') || 'فاضي'}</p>
    </div>
  )

  return (
    <div className="p-6">
      <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-red-700">عليك دفع - Cash Due</h1>
          <p className="text-sm text-red-600">{orders.length} طلبات - Driver: {driverId}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-red-700">{totalCash} $</div>
        </div>
      </div>
      <div className="grid gap-4">
        {orders.map(order => {
          const customerName = names.customers[order['customer ID']] || 'زبون'
          return (
            <div key={order['Request ID']} className="bg-white p-4 rounded-lg shadow border border-l-4 border-l-red-500">
              <div className="flex justify-between">
                <div className="font-bold">#{order['Request ID']} - {customerName}</div>
                <div className="font-bold text-red-600">{order['Total Amount']} $</div>
              </div>
              <div className="text-sm text-gray-500 mt-1">{order['Delivery Adress']} | {order['Mobile']}</div>
            </div>
          )
        })}
        {orders.length === 0 && <p className="text-center py-10 text-gray-500">ما عليك شي 👌</p>}
      </div>
    </div>
  )
}
