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

  // كرت مربع بلا زوايا - خط جديد
  const Box = ({label, count, href}) => (
    <Link href={href} className="bg-white border-l- border-[#111] px-6 py-7 flex justify-between items-end hover:bg-[#111] hover:text-white group transition-all duration-200">
      <div>
        <div className="font-mono text- tracking-[0.22em] opacity-50 font-bold">{label}</div>
        <div className="mt-4 font-black text- leading-[0.85] tracking-[-0.04em]">{count}</div>
      </div>
      <div className={`font-mono text- font-bold px-2 py-1 ${count>0? 'bg-[#ff2e1f] text-white group-hover:bg-white group-hover:text-black' : 'bg-black text-white group-hover:bg-white group-hover:text-black'}`}>
        {count>0? 'NEW' : '0'}
      </div>
    </Link>
  )

  return (
    <div className="min-h-screen bg-[#d6d3cc] p-4 md:p-10">
      <div className="max-w- mx-auto bg-[#fdfcf6] rounded- shadow-[0_20px_80px_rgba(0,0,0,0.08)] overflow-hidden border border-white">

        {/* Header */}
        <div className="px-8 py-6 flex justify-between items-center border-b border-[#ece9de]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-black text-">MD</div>
            <div>
              <div className="font-black text- tracking-[-0.02em] leading-none">MD MARKETPLACE</div>
              <div className="font-mono text- mt-1 flex gap-2 items-center">
                <span className="bg-black text-white px-2 py-0.5">{myRole}</span>
                <span className="font-bold">{myName}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 font-mono">
            <button onClick={load} className="border border-black px-4 py-2 text- font-bold hover:bg-black hover:text-white">REFRESH</button>
            <button onClick={logout} className="bg-black text-white px-5 py-2 text- font-bold">LOGOUT</button>
          </div>
        </div>

        {/* Title */}
        <div className="px-8 pt-10 pb-6">
          <h2 className="text- font-black leading-[0.85] tracking-[-0.04em]"><span className="text-[#0a5cff]">DASHBOARD</span> OVERVIEW</h2>
          <p className="font-mono text- mt-3 opacity-60">live counts to manage your marketplace operations</p>
          <div className="mt-4 w-14 h- bg-[#0a5cff]"></div>
        </div>

        {/* Grid مربع بلا زوايا */}
        <div className="px-3 pb-3">
          <div className="grid grid-cols-1 md:grid-cols-3 bg-[#ece9de] gap- border border-[#ece9de]">
            <Box label="CUSTOMERS PENDING" count={counts.customersPending} href="/admin/customers-pending" />
            <Box label="PENDING ORDERS" count={counts.pendingOrders} href="/admin/pending" />
            <Box label="TODAY ORDERS" count={counts.todayOrders} href="/admin/today-orders" />
            <Box label="ACTIVE ORDERS" count={counts.activeOrders} href="/admin/active-orders" />
            <Box label="APPROVED ORDERS" count={counts.approvedOrders} href="/admin/approved-orders" />
            <Box label="COMPLETE ORDERS" count={counts.completeOrders} href="/admin/complete-orders" />
            <Box label="CASH PENDING" count={counts.cashPending} href="/admin/cash-pending" />
            <Box label="CASH RECEIVED" count={counts.cashReceived} href="/admin/cash-received" />
            <Box label="REJECTED ORDERS" count={counts.rejectedOrders} href="/admin/rejected-orders" />
            <Box label="MAPPING CUSTOMERS" count={0} href="/admin/mapping-customers" />
          </div>
        </div>

        {/* Tables */}
        <div className="px-8 py-8 bg-[#f5f3ed]">
          <div className="font-mono text- tracking-[0.2em] opacity-50 font-bold mb-4">TABLES — {myRole} ({menuTables.length})</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap- bg-black border border-black">
            {menuTables.map(m=>(
              <Link key={m.supa_id} href={`/admin/${m.Menu}`} className="bg-[#1a1a1a] text-white p-6 hover:bg-white hover:text-black transition-colors">
                <div className="font-mono text- opacity-40">{m.Menu}</div>
                <div className="font-black text- mt-2 leading-tight">{m.View}</div>
                <div className="mt-4 font-mono text- border border-white/20 inline-block px-2 py-1">{m._access}</div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
