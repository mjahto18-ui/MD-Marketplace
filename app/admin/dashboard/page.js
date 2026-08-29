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
  const [debug, setDebug] = useState("")

  useEffect(()=>{ init() },[])

  const init = async()=>{
    // جيب الرول
    let currentRole = "Admin"
    try{
      const raw = document.cookie.split('admin_session=')[1]?.split(';')[0]
      if(raw){
        const parsed = JSON.parse(decodeURIComponent(raw))
        if(parsed.role) currentRole = parsed.role
      }
    }catch{}
    if(!currentRole || currentRole==="Admin"){
      const r = document.cookie.split('role=')[1]?.split(';')[0]
      if(r) currentRole = r
    }
    setRole(currentRole)
    setDebug(`Role: ${currentRole} | Cookies: ${document.cookie.slice(0,100)}`)

    // جيب كلشي
    const [{data: customers},{data: orders},{data: menuData},{data: accessData}] = await Promise.all([
      supabase.from('customers').select('Status').limit(1000),
      supabase.from('order_requuest').select('Approval Status, Cash Status, Final Payment Method, Request Date').limit(2000),
      supabase.from('menu').select('*').order('id'),
      supabase.from('asceses').select('*'),
    ])

    if(!menuData || menuData.length===0){
      setDebug(prev=> prev + ` | menu فاضي!`)
    }

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
    }
    setCounts(c)

    let filtered = menuData||[]
    // اذا مش ادمن فلتر حسب asceses
    if(currentRole!=='Admin' && accessData?.length){
      const allowed = accessData.filter(a=>a.Role===currentRole && (a.Can_View===true || String(a.Can_View).toLowerCase()==='true')).map(a=>a.View)
      if(allowed.length) filtered = menuData.filter(m=> allowed.includes(m.View))
    }
    setMenus(filtered)
    setDebug(prev=> prev + ` | menu: ${menuData?.length} | filtered: ${filtered.length}`)
  }

  const ar = { "Customers Pending":"بانتظار الموافقة","Pending Orders":"طلبات معلقة","Today Orders":"طلبات اليوم","Active Orders":"قيد التوصيل","Approved Orders":"موافق عليها","Complete Orders":"مكتملة","Cash Pending":"كاش لم يستلم","Cash Received":"كاش مستلم","Rejected Orders":"مرفوضة" }

  return (
    <div className="min-h-screen bg-[#080811] text-white">
      <div className="sticky top-0 z-10 bg-[#0e0e1e] border-b border-white/10">
        <div className="max-w- mx-auto px-6 h- flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded- bg-white flex items-center justify-center"><img src="/logo.png" alt="" className="w-8 h-8 object-contain"/></div>
            <div><div className="font-bold text-">MD-Marketplace • {role}</div><div className="text- opacity-50">{debug}</div></div>
          </div>
          <div className="flex gap-2">
            <Link href="/admin" className="h-8 px-4 rounded-full bg-white text-black text- flex items-center font-bold">📋 كل الجداول</Link>
            <button onClick={init} className="h-8 px-4 rounded-full bg-white/10 text-white text-">تحديث</button>
          </div>
        </div>
      </div>

      <div className="max-w- mx-auto px-6 py-7">
        {menus.length===0? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <div className="font-bold">ما في كروت - شوف جدول menu فاضي ولا لا</div>
            <div className="text- opacity-70 mt-2">{debug}</div>
            <div className="mt-4 text-">روح على /admin وافتح جدول menu وضيف View = Customers Pending, Menu = orders</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {menus.map((m)=>(
              <Link key={m.id || m.View} href={`/admin/${(m.Menu||'').toLowerCase()}-${m.View.toLowerCase().replace(/\s+/g,'-')}`} className="rounded- bg-white text-black p-5 h- flex flex-col justify-between hover:scale-[1.02] transition-all">
                <div className="flex justify-between"><span className="text- text-[#8B8681]">{ar[m.View]||m.View} • {m.Menu}</span><span className="w-2 h-2 rounded-full bg-black/15 mt-1"></span></div>
                <div><div className="text- font-semibold">{m.View}</div><div className="flex items-end justify-between mt-2"><div className="text- font-black leading-none">{counts[m.View]??'-'}</div><span className="text- bg-black text-white px-3 py-1 rounded-full">عرض ←</span></div></div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
