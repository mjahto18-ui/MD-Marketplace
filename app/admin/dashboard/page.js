"use client"
export const dynamic = "force-dynamic"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import Link from "next/link"

export default function Dashboard(){
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const [counts, setCounts] = useState({})
  const [menus, setMenus] = useState([])
  const [role, setRole] = useState("Admin")

  useEffect(()=>{ init() },[])

  const init = async()=>{
    // 1. جيب الرول من الكوكيز - لغينا فحص Active من هون
    const roleFromCookie = document.cookie.split('role=')[1]?.split(';')[0] || "Admin"
    setRole(roleFromCookie)

    // 2. جيب كلشي
    const [{data: customers},{data: orders},{data: menuData},{data: accessData}] = await Promise.all([
      supabase.from('customers').select('Status').limit(1000),
      supabase.from('order_requuest').select('Approval Status, Cash Status, Final Payment Method, Request Date').limit(2000),
      supabase.from('menu').select('*').order('id'),
      supabase.from('asceses').select('*'),
    ])

    const today = new Date().toISOString().split('T')[0]
    const c = {
      "Customers Pending": customers?.filter(x=>x.Status==='Pending').length||0,
      "Pending Orders": orders?.filter(o=>o['Approval Status']==='Pending').length||0,
      "Today Orders": orders?.filter(o=>String(o['Request Date']||'').startsWith(today)).length||0,
      "Active Orders": orders?.filter(o=>['Active','Approved'].includes(o['Approval Status'])).length||0,
      "Approved Orders": orders?.filter(o=>o['Approval Status']==='Approved').length||0,
      "Complete Orders": orders?.filter(o=>o['Approval Status']==='Completed').length||0,
      "Cash Pending": orders?.filter(o=>o['Cash Status']==='Pending' && o['Final Payment Method']==='Cash').length||0,
      "Cash Received": orders?.filter(o=>o['Cash Status']==='Received').length||0,
      "Rejected Orders": orders?.filter(o=>o['Approval Status']==='Rejected').length||0,
      "Mapping Customers": "-",
      "Custom Delivery": "-",
    }
    setCounts(c)

    // 3. فلتر حسب asceses + الرول
    let filtered = menuData||[]
    if(roleFromCookie!== 'Admin' && accessData?.length){
      const allowed = accessData.filter(a=>a.Role===roleFromCookie && a.Can_View).map(a=>a.View)
      filtered = menuData.filter(m=> allowed.includes(m.View))
    }
    filtered = filtered.filter(m=> Object.keys(c).includes(m.View))
    setMenus(filtered)
  }

  const ar = { "Customers Pending":"بانتظار الموافقة","Pending Orders":"طلبات معلقة","Today Orders":"طلبات اليوم","Active Orders":"قيد التوصيل","Approved Orders":"موافق عليها","Complete Orders":"مكتملة","Cash Pending":"كاش لم يستلم","Cash Received":"كاش مستلم","Rejected Orders":"مرفوضة","Mapping Customers":"ربط العملاء","Custom Delivery":"توصيل خاص" }

  return (
    <div className="min-h-screen bg-[#FCFBF9]">
      <div className="sticky top-0 z-10 bg-[#FCFBF9]/90 backdrop-blur border-b border-[#EDE9E3]">
        <div className="max-w- mx-auto px-6 h- flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded- bg-white border border-[#EDE9E3] flex items-center justify-center p-1.5"><img src="/logo.png" alt="" className="w-full h-full object-contain"/></div>
            <div><div className="font-bold text-">MD-Marketplace • {role}</div><div className="text- text-[#9A9590]">{menus.length} عنصر مسموح</div></div>
          </div>
          <button onClick={init} className="h-8 px-4 rounded-full bg-[#1A1A1A] text-white text-">تحديث</button>
        </div>
      </div>
      <div className="max-w- mx-auto px-6 py-7">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {menus.map((m)=>(
            <Link key={m.id} href={`/admin/${m.Menu.toLowerCase()}-${m.View.toLowerCase().replace(/\s+/g,'-')}`} className="rounded- border bg-white border-[#EDE9E3] p-5 h- flex flex-col justify-between hover:shadow-[0_6px_20px_rgba(0,0,0,0.05)] hover:-translate-y- transition-all">
              <div className="flex justify-between"><span className="text- text-[#8B8681]">{ar[m.View]||m.View}</span><span className="w-2 h-2 rounded-full bg-[#1A1A1A]/15 mt-1"></span></div>
              <div><div className="text- font-semibold">{m.View}</div><div className="flex items-end justify-between mt-2"><div className="text- font-black leading-none">{counts[m.View]??0}</div><span className="text- text-[#A8A29C]">عرض ←</span></div></div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
