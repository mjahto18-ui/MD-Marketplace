"use client"
export const dynamic = "force-dynamic"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function Dashboard(){
  const [counts, setCounts] = useState({})
  const [menuTables, setMenuTables] = useState([])
  const [myRole, setMyRole] = useState('')
  const [myName, setMyName] = useState('')
  const router = useRouter()
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  useEffect(()=>{ load() },[])

  const load = async () => {
    const sessRes = await fetch('/api/admin/me', { credentials: 'include', cache: 'no-store' })
    if(!sessRes.ok){ console.log('ME FAIL', sessRes.status); return }
    const sess = await sessRes.json()
    const role = String(sess.role || sess.Role || 'Admin').trim()
    const name = String(sess.name || sess.username || sess.email || sess.user || 'Admin').trim()
    setMyRole(role)
    setMyName(name)

    const [{data: customers}, {data: orders}, {data: menus}, {data: acs}] = await Promise.all([
      supabase.from('customers').select('*').limit(1000),
      supabase.from('order_requuest').select('*').limit(2000),
      supabase.from('menu').select('*').order('supa_id', {ascending:true}).limit(100),
      supabase.from('asceses').select('*').eq('role', role),
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

    const specialViews = ["Customers Pending","Pending Orders","Today Orders","Active Orders","Approved Orders","Complete Orders","Cash Pending","Cash Received","Rejected Orders","Mapping Customers"]
    let allowed = menus||[]
    if(role!== 'Admin'){
      allowed = menus?.filter(m=> {
        const roles = String(m.Role||'').split(',').map(r=>r.trim())
        return roles.includes(role)
      }) || []
    }
    const generic = allowed.filter(m=>!specialViews.includes(m.View))
    const withAccess = generic.map(m=>{
      const rule = acs?.find(a=> String(a.menu).trim() === String(m.Menu).trim())
      const canEdit = role==='Admin' || String(rule?.can_edit).toUpperCase()==='TRUE' || rule?.can_edit===true
      return {...m, _access: canEdit? 'Read & Write' : 'Read', _can_edit: canEdit}
    })
    setMenuTables(withAccess)
  }

  const logout = async()=>{
    await fetch('/api/admin/logout', { method:'POST', credentials:'include' })
    router.push('/admin/login')
  }

  const Item = ({label, count, href, color}) => (
    <Link href={href} className={`p-5 rounded- bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] border-l- ${color} flex justify-between items-center hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y- transition-all duration-300`}>
      <div><div className="text- text-gray-400 font-black tracking-[0.18em] uppercase">{label}</div><div className="text- font-black mt-1 tracking-tight text-[#1a1c16]">{count??'-'}</div></div>
      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-black text- shadow-inner ${count>0?'bg-[#ff3b30]':'bg-[#2d3a2e]'}`}>{count??'-'}</div>
    </Link>
  )

  return (
    <div className="p-6 bg-[#f6f5f1] min-h-screen font-sans">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8 bg-white p-4 rounded- shadow-sm border border-[#ece9e1]">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="logo" className="w-9 h-9 rounded-full object-contain bg-[#f6f5f1] p-1 border" onError={(e)=>e.target.style.display='none'} />
          <div>
            <h1 className="text- font-black tracking-tight text-[#1a1c16] leading-none">MD Marketplace</h1>
            <div className="text- text-[#7a7a6a] mt-1 flex items-center gap-2">
              <span className="bg-[#2d2a1a] text-[#e8e6c5] px-2.5 py-0.5 rounded-full font-bold">{myRole}</span>
              <span className="font-bold text-[#1a1c16]">👤 {myName}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="bg-white border border-[#e0ddd3] text-[#2d2a1a] px-4 py-2 rounded-full text- font-bold hover:bg-[#f6f5f1]">↻ تحديث</button>
          <button onClick={logout} className="bg-[#2d2a1a] text-[#f6f5f1] px-5 py-2 rounded-full text- font-black hover:bg-black transition">خروج</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Item label="Customers Pending" count={counts.customersPending} href="/admin/customers-pending" color="border-[#c9a86a]" />
        <Item label="Pending Orders" count={counts.pendingOrders} href="/admin/pending" color="border-[#d97706]" />
        <Item label="Today Orders" count={counts.todayOrders} href="/admin/today-orders" color="border-[#2a6b8a]" />
        <Item label="Active Orders" count={counts.activeOrders} href="/admin/active-orders" color="border-[#4a6741]" />
        <Item label="Approved Orders" count={counts.approvedOrders} href="/admin/approved-orders" color="border-[#6b8f5e]" />
        <Item label="Complete Orders" count={counts.completeOrders} href="/admin/complete-orders" color="border-[#8b7a9e]" />
        <Item label="Cash Pending" count={counts.cashPending} href="/admin/cash-pending" color="border-[#b89a2d]" />
        <Item label="Cash Received" count={counts.cashReceived} href="/admin/cash-received" color="border-[#7a9a3a]" />
        <Item label="Rejected Orders" count={counts.rejectedOrders} href="/admin/rejected-orders" color="border-[#9a9a96]" />
        <Item label="Mapping Customers" count={0} href="/admin/mapping-customers" color="border-[#2d2a1a]" />
      </div>

      <div className="mt-10">
        <h2 className="text- font-black mb-3 tracking-[0.15em] uppercase text-[#7a7a6a]">عرض خاص — {myRole} — ({menuTables.length}) جدول</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {menuTables.map(m=>(
            <Link key={m.supa_id} href={`/admin/${m.Menu}`} className="bg-[#2d2a1a] text-[#f5f3e8] p- rounded- hover:bg-[#3d3a2e] hover:-translate-y- hover:shadow-xl transition-all duration-300 relative border border-[#423f2e]">
              <div className="text- tracking-[0.15em] uppercase opacity-60 font-bold">{m.Menu}</div>
              <div className="font-black text- mt-1 tracking-tight">{m.View}</div>
              <div className="text- mt-3 px-2.5 py-1 rounded-full bg-[#f5f3e8] text-[#2d2a1a] inline-block font-black">{m._access}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
