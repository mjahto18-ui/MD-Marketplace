"use client"
export const dynamic = "force-dynamic"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import Link from "next/link"

export default function Dashboard(){
  const [counts, setCounts] = useState({})
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  useEffect(()=>{ load() },[])

  const load = async () => {
    const today = new Date().toISOString().split('T')[0]
    const [c1,c2,c3,c4,c5,c6,c7,c8,c9] = await Promise.all([
      supabase.from('customers').select('supa_id',{count:'exact',head:true}).eq('Status','Pending'),
      supabase.from('order_requuest').select('Request ID',{count:'exact',head:true}).eq('Approval Status','Pending'),
      supabase.from('order_requuest').select('Request ID',{count:'exact',head:true}).eq('Approval Status','Approved'),
      supabase.from('order_requuest').select('Request ID',{count:'exact',head:true}).gte('Request Date', today),
      supabase.from('order_requuest').select('Request ID',{count:'exact',head:true}).eq('Cash Status','Pending'),
      supabase.from('order_requuest').select('Request ID',{count:'exact',head:true}).eq('Cash Status','Received'),
      supabase.from('order_requuest').select('Request ID',{count:'exact',head:true}).eq('Approval Status','Completed'),
      supabase.from('order_requuest').select('Request ID',{count:'exact',head:true}).eq('Approval Status','Rejected'),
      supabase.from('order_requuest').select('Request ID',{count:'exact',head:true}).eq('Approval Status','Approved'),
    ])
    setCounts({
      customersPending: c1.count||0,
      pendingOrders: c2.count||0,
      activeOrders: c3.count||0,
      todayOrders: c4.count||0,
      cashPending: c5.count||0,
      cashReceived: c6.count||0,
      completeOrders: c7.count||0,
      rejectedOrders: c8.count||0,
      approvedOrders: c9.count||0,
    })
  }

  const Item = ({label, count, href, color}) => (
    <Link href={href} className={`p-5 rounded-2xl bg-white shadow border-l- ${color} flex justify-between items-center hover:scale-[1.02] transition`}>
      <div><div className="text- text-gray-400 font-bold">{label}</div><div className="text-3xl font-black">{count}</div></div>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${count>0?'bg-red-500':'bg-green-500'}`}>{count}</div>
    </Link>
  )

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-black">Dashboard</h1>
        <button onClick={load} className="bg-black text-white px-4 py-2 rounded-full">↻ تحديث</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Item label="Customers Pending" count={counts.customersPending} href="/admin/customers-pending" color="border-red-500" />
        <Item label="Pending Orders" count={counts.pendingOrders} href="/admin/pending-orders" color="border-orange-500" />
        <Item label="Today Orders" count={counts.todayOrders} href="/admin/today-orders" color="border-blue-500" />
        <Item label="Active Orders" count={counts.activeOrders} href="/admin/active-orders" color="border-green-500" />
        <Item label="Approved Orders" count={counts.approvedOrders} href="/admin/approved-orders" color="border-emerald-500" />
        <Item label="Complete Orders" count={counts.completeOrders} href="/admin/complete-orders" color="border-purple-500" />
        <Item label="Cash Pending" count={counts.cashPending} href="/admin/cash-pending" color="border-yellow-500" />
        <Item label="Cash Received" count={counts.cashReceived} href="/admin/cash-received" color="border-lime-500" />
        <Item label="Rejected Orders" count={counts.rejectedOrders} href="/admin/rejected-orders" color="border-gray-500" />
        <Item label="Mapping Customers" count={0} href="/admin/mapping-customers" color="border-black" />
      </div>
    </div>
  )
}
