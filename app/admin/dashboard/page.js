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
    const [{data: customers}, {data: orders}] = await Promise.all([
      supabase.from('customers').select('*').limit(1000),
      supabase.from('order_requuest').select('*').limit(2000),
    ])
    const today = new Date().toISOString().split('T')[0]
    setCounts({
      customersPending: customers?.filter(c=>c['Status']==='Pending').length||0,
      pendingOrders: orders?.filter(o=>o['Approval Status']==='Pending').length||0,
      activeOrders: orders?.filter(o=>o['Approval Status']==='Active' || o['Approval Status']==='Approved').length||0,
      todayOrders: orders?.filter(o=>String(o['Request Date']||'').startsWith(today)).length||0,
      cashPending: orders?.filter(o=>o['Cash Status']==='Pending' && o['Final Payment Method']==='Cash').length||0,
      cashReceived: orders?.filter(o=>o['Cash Status']==='Received').length||0,
      completeOrders: orders?.filter(o=>o['Approval Status']==='Completed').length||0,
      rejectedOrders: orders?.filter(o=>o['Approval Status']==='Rejected').length||0,
      approvedOrders: orders?.filter(o=>o['Approval Status']==='Approved').length||0,
    })
  }

  const cards = [
    { label: "Customers Pending", count: counts.customersPending, href: "/admin/customers-pending", sub: "A-A • بانتظار الموافقة", dot: "bg-[#C2B8A3]", bg: "bg-[#F6F2EB]" },
    { label: "Pending Orders", count: counts.pendingOrders, href: "/admin/pending", sub: "A-A • طلبات معلقة", dot: "bg-[#D9C5B2]", bg: "bg-[#FBF6EF]" },
    { label: "Today Orders", count: counts.todayOrders, href: "/admin/today-orders", sub: "A-A • طلبات اليوم", dot: "bg-[#A8B5A2]", bg: "bg-[#F0F3EE]" },
    { label: "Active Orders", count: counts.activeOrders, href: "/admin/active-orders", sub: "A-A • قيد التوصيل", dot: "bg-[#8FA998]", bg: "bg-[#EEF3F0]" },
    { label: "Approved Orders", count: counts.approvedOrders, href: "/admin/approved-orders", sub: "A-A • موافق عليها", dot: "bg-[#B8C4BB]", bg: "bg-[#F2F5F1]" },
    { label: "Complete Orders", count: counts.completeOrders, href: "/admin/complete-orders", sub: "A • مكتملة", dot: "bg-[#9A8C98]", bg: "bg-[#F5F1F3]" },
    { label: "Cash Pending", count: counts.cashPending, href: "/admin/cash-pending", sub: "A-AL • كاش لم يستلم", dot: "bg-[#C9ADA7]", bg: "bg-[#F9F1F0]" },
    { label: "Cash Received", count: counts.cashReceived, href: "/admin/cash-received", sub: "A-AL • كاش مستلم", dot: "bg-[#B5A89A]", bg: "bg-[#F7F3EF]" },
    { label: "Rejected Orders", count: counts.rejectedOrders, href: "/admin/rejected-orders", sub: "A • مرفوضة", dot: "bg-[#BCB8B1]", bg: "bg-[#F6F5F3]" },
    { label: "Mapping Customers", count: "-", href: "/admin/mapping-customers", sub: "A-A • ربط العملاء", dot: "bg-[#222222]", bg: "bg-[#F2F2F2]" },
  ]

  return (
    <div className="min-h-screen bg-[#FCFBF9] p-4 md:p-8">
      {/* Header */}
      <div className="max-w- mx-auto flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w- h- rounded- bg-white shadow-sm border border-[#EDE9E3] flex items-center justify-center p-2">
            <img src="/logo.png" alt="logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text- font-[800] tracking-[-0.02em] text-[#1A1A1A]">Dashboard</h1>
            <p className="text- text-[#9A9590] tracking-wide mt-[-2px]">نظرة يومية • {new Date().toLocaleDateString('ar-EG')}</p>
          </div>
        </div>
        <button onClick={load} className="h- px-5 rounded-full bg-[#1A1A1A] text-white text- font-medium hover:bg-black transition">تحديث ↻</button>
      </div>

      {/* Grid */}
      <div className="max-w- mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map((c,i)=>(
          <Link key={i} href={c.href} className={`group relative rounded- border border-[#EDE9E3] ${c.bg} p-5 flex flex-col justify-between h- hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y- transition-all`}>
            <div className="flex justify-between items-start">
              <div>
                <div className="text- font-[700] tracking-[0.14em] text-[#8C8883] uppercase">{c.sub}</div>
                <div className="text- font-[700] text-[#1F1F] mt-1.5 leading-tight">{c.label}</div>
              </div>
              <div className={`w-2.5 h-2.5 rounded-full ${c.dot} mt-1.5`}></div>
            </div>
            <div className="flex items-end justify-between mt-4">
              <div className="text- font-[900] tracking-[-0.03em] text-[#1A1A1A] leading-none">{c.count?? 0}</div>
              <div className="text- text-[#A8A29C] font-medium group-hover:text-[#1A1A1A] transition">عرض ←</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="max-w- mx-auto mt-8 text- text-[#B8B3AE]">A = Admin فقط • A-A = Admin + Assistant Admin • A-AL = Admin + Accounting • Delete محصور فيك انت فقط</div>
    </div>
  )
}
