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
    if(!sessRes.ok) return
    const sess = await sessRes.json()
    const role = String(sess.role || sess.Role || 'Admin').trim()
    setMyRole(role)
    let realName = sess.name || sess.username || sess.user || ''
    if(!realName || realName === role){
      const email = sess.email || sess.user_email || ''
      if(email){
        const { data: u } = await supabase.from('users').select('Name').eq('Email', email).maybeSingle()
        if(u) realName = u.Name
      }
    }
    setMyName(realName || sess.email || role)

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
    let allowed = menus||[]
    if(role!== 'Admin'){
      allowed = menus?.filter(m=> String(m.Role||'').split(',').map(r=>r.trim()).includes(role)) || []
    }
    const specialViews = ["Customers Pending","Pending Orders","Today Orders","Active Orders","Approved Orders","Complete Orders","Cash Pending","Cash Received","Rejected Orders","Mapping Customers"]
    const generic = allowed.filter(m=>!specialViews.includes(m.View))
    setMenuTables(generic.map(m=>{
      const rule = acs?.find(a=> String(a.menu).trim() === String(m.Menu).trim())
      const canEdit = role==='Admin' || String(rule?.can_edit).toUpperCase()==='TRUE' || rule?.can_edit===true
      return {...m, _access: canEdit? 'Read & Write' : 'Read'}
    }))
  }

  const logout = async()=>{
    await fetch('/api/admin/logout', { method:'POST', credentials:'include' })
    router.push('/admin/login')
  }

  const Card = ({label, count, href}) => (
    <Link href={href} className="group bg-[#fffef7] rounded- p-6 border border-[#ece9de] shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 flex justify-between items-center">
      <div>
        <div className="text- font-bold tracking-[0.18em] text-[#9a9a9a] uppercase">{label}</div>
        <div className="mt-3 text- font-black tracking-[-0.02em] text-[#1e1e1e] leading-none">{count}</div>
        <div className="mt-3 w-8 h-1 rounded-full bg-[#0a84ff] group-hover:w-12 transition-all"></div>
      </div>
      <div className={`w-14 h-14 rounded-full flex items-center justify-center text- font-black ${count>0?'bg-[#1e1e1e] text-white':'bg-[#f1eee2] text-[#a8a59a]'}`}>
        {count}
      </div>
    </Link>
  )

  return (
    <div className="min-h-screen bg-[#e9e7e1] p-6 md:p-8 font-[Inter,system-ui]">
      {/* Header متل الصورة */}
      <div className="max-w- mx-auto">
        <div className="bg-[#fffef7] rounded- border border-[#ece9de] shadow-[0_4px_24px_rgba(0,0,0,0.04)] px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo.png" className="w-9 h-9 rounded-full bg-[#f1eee2]" onError={e=>e.target.style.display='none'} />
            <div>
              <div className="font-black text- tracking-tight">MD MARKETPLACE</div>
              <div className="text- text-[#6b6b6b] flex items-center gap-2 mt-0.5">
                <span className="bg-[#1e1e1e] text-white px-3 py-0.5 rounded-full text- font-bold">{myRole}</span>
                <span className="font-bold text-[#1e1e1e]">{myName}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="bg-[#f1eee2] px-4 py-2 rounded-full text- font-bold hover:bg-[#e9e6d7]">تحديث</button>
            <button onClick={logout} className="bg-[#1e1e1e] text-white px-5 py-2 rounded-full text- font-bold">خروج</button>
          </div>
        </div>

        {/* Grid متل الصورة - كروت فاتحة rounded كبير */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card label="Customers Pending" count={counts.customersPending} href="/admin/customers-pending" />
          <Card label="Pending Orders" count={counts.pendingOrders} href="/admin/pending" />
          <Card label="Today Orders" count={counts.todayOrders} href="/admin/today-orders" />
          <Card label="Active Orders" count={counts.activeOrders} href="/admin/active-orders" />
          <Card label="Approved Orders" count={counts.approvedOrders} href="/admin/approved-orders" />
          <Card label="Complete Orders" count={counts.completeOrders} href="/admin/complete-orders" />
          <Card label="Cash Pending" count={counts.cashPending} href="/admin/cash-pending" />
          <Card label="Cash Received" count={counts.cashReceived} href="/admin/cash-received" />
          <Card label="Rejected Orders" count={counts.rejectedOrders} href="/admin/rejected-orders" />
          <Card label="Mapping Customers" count={0} href="/admin/mapping-customers" />
        </div>

        {/* الجداول - نفس الموديل */}
        <div className="mt-12">
          <div className="text- tracking-[0.2em] text-[#9a9a9a] font-bold mb-4 uppercase">Tables — {myRole} — ({menuTables.length})</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {menuTables.map(m=>(
              <Link key={m.supa_id} href={`/admin/${m.Menu}`} className="bg-[#fffef7] rounded- p-5 border border-[#ece9de] shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all">
                <div className="text- tracking-[0.18em] text-[#9a9a9a] font-bold uppercase">{m.Menu}</div>
                <div className="font-black text- mt-2 text-[#1e1e1e]">{m.View}</div>
                <div className="mt-4 inline-flex bg-[#1e1e1e] text-white text- px-3 py-1 rounded-full font-bold">{m._access}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
