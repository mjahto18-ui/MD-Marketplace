"use client"
export const dynamic = "force-dynamic"
import { useEffect, useState, useMemo } from "react"
import { createClient } from "@supabase/supabase-js"
import Link from "next/link"

export default function Dashboard(){
  const [counts, setCounts] = useState({})
  const [menus, setMenus] = useState([])
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  useEffect(()=>{ load() },[])

  const load = async () => {
    const [{data: customers}, {data: orders}, {data: menuData}] = await Promise.all([
      supabase.from('customers').select('*').limit(1000),
      supabase.from('order_requuest').select('*').limit(2000),
      supabase.from('menu').select('*').order('id')
    ])
    if(menuData) setMenus(menuData)
    const today = new Date().toISOString().split('T')[0]
    setCounts({
      customersPending: customers?.filter(c=>c['Status']==='Pending').length||0,
      pendingOrders: orders?.filter(o=>o['Approval Status']==='Pending').length||0,
      activeOrders: orders?.filter(o=>['Active','Approved'].includes(o['Approval Status'])).length||0,
      todayOrders: orders?.filter(o=>String(o['Request Date']||'').startsWith(today)).length||0,
      cashPending: orders?.filter(o=>o['Cash Status']==='Pending' && o['Final Payment Method']==='Cash').length||0,
      cashReceived: orders?.filter(o=>o['Cash Status']==='Received').length||0,
      completeOrders: orders?.filter(o=>o['Approval Status']==='Completed').length||0,
      rejectedOrders: orders?.filter(o=>o['Approval Status']==='Rejected').length||0,
      approvedOrders: orders?.filter(o=>o['Approval Status']==='Approved').length||0,
    })
  }

  const cardList = useMemo(()=>[
    { view: "Customers Pending", label: "بانتظار الموافقة", en: "Customers Pending", count: counts.customersPending, href: "/admin/customers-pending", style: "bg-[#F8F5F0] border-[#EDE7DE]" },
    { view: "Pending Orders", label: "طلبات معلقة", en: "Pending Orders", count: counts.pendingOrders, href: "/admin/pending", style: "bg-[#F9F4EE] border-[#EDE2D3]" },
    { view: "Today Orders", label: "طلبات اليوم", en: "Today Orders", count: counts.todayOrders, href: "/admin/today-orders", style: "bg-[#F2F4F1] border-[#DEE4DC]" },
    { view: "Active Orders", label: "قيد التوصيل", en: "Active Orders", count: counts.activeOrders, href: "/admin/active-orders", style: "bg-[#EFF3EF] border-[#D6DDD8]" },
    { view: "Approved Orders", label: "موافق عليها", en: "Approved Orders", count: counts.approvedOrders, href: "/admin/approved-orders", style: "bg-[#F2F5F3] border-[#DDE3DF]" },
    { view: "Complete Orders", label: "مكتملة", en: "Complete Orders", count: counts.completeOrders, href: "/admin/complete-orders", style: "bg-[#F5F2F4] border-[#E6DFE2]" },
    { view: "Cash Pending", label: "كاش لم يستلم", en: "Cash Pending", count: counts.cashPending, href: "/admin/cash-pending", style: "bg-[#FBF2F1] border-[#EDD9D7]" },
    { view: "Cash Received", label: "كاش مستلم", en: "Cash Received", count: counts.cashReceived, href: "/admin/cash-received", style: "bg-[#F8F3EF] border-[#E8DDD2]" },
    { view: "Rejected Orders", label: "مرفوضة", en: "Rejected Orders", count: counts.rejectedOrders, href: "/admin/rejected-orders", style: "bg-[#F6F5F3] border-[#E6E2DE]" },
    { view: "Mapping Customers", label: "ربط العملاء", en: "Mapping Customers", count: "-", href: "/admin/mapping-customers", style: "bg-[#F2F2F2] border-[#E0E0E0]" },
  ],[counts])

  // كل الجداول من جدول menu
  const allTables = menus.filter(m =>!cardList.find(c=>c.view===m.View))

  return (
    <div className="min-h-screen bg-[#FCFBF9]">
      {/* Header صغير ومرتب */}
      <div className="sticky top-0 z-10 bg-[#FCFBF9]/80 backdrop-blur border-b border-[#EDE9E3]">
        <div className="max-w- mx-auto px-6 h- flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded- bg-white border border-[#EDE9E3] flex items-center justify-center p-1.5 shadow-sm">
              <img src="/logo.png" alt="logo" className="w-full h-full object-contain" />
            </div>
            <div className="leading-tight">
              <div className="font-bold text- text-[#1A1A1A]">MD-Marketplace</div>
              <div className="text- text-[#9A9590]">نظرة يومية • {new Date().toLocaleDateString('ar-LB')}</div>
            </div>
          </div>
          <button onClick={load} className="h-9 px-4 rounded-full bg-[#1A1A1A] text-white text-">تحديث</button>
        </div>
      </div>

      <div className="max-w- mx-auto px-6 py-8">
        {/* كروت الداشبورد - برمة ناعمة */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cardList.map((c,i)=>(
            <Link key={i} href={c.href} className={`rounded- border ${c.style} p-5 h- flex flex-col justify-between hover:shadow-sm hover:-translate-y- transition-all`}>
              <div className="flex justify-between">
                <div className="text- text-[#8B8681]">{c.label}</div>
                <div className="w-2 h-2 rounded-full bg-[#1A1A1A]/20 mt-1"></div>
              </div>
              <div>
                <div className="text- font-semibold text-[#2A2A2A]">{c.en}</div>
                <div className="flex items-end justify-between mt-2">
                  <div className="text- font-black leading-none text-[#1A1A1A]">{c.count}</div>
                  <div className="text- text-[#A8A29C]">عرض ←</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* هون بتشوف جداول menu اللي عملناهن */}
        <div className="mt-10">
          <h2 className="text- font-bold text-[#1A1A1A] mb-3">كل الجداول من جدول menu ({menus.length})</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {allTables.map((m)=>(
              <div key={m.id} className="rounded- bg-white border border-[#EDE9E3] px-3 py-2.5">
                <div className="text- text-[#9A9590] truncate">{m.Menu}</div>
                <div className="text- font-medium text-[#1A1A1A] truncate">{m.View}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
