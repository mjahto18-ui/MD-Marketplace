"use client"
export const dynamic = "force-dynamic"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import Link from "next/link"

export default function Dashboard(){
  const [counts, setCounts] = useState({})
  const [menuTables, setMenuTables] = useState([])
  const [myRole, setMyRole] = useState('')
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  useEffect(()=>{ load() },[])

  const load = async () => {
    // هون التصحيح - من admin_session مو من auth
    const sessRes = await fetch('/api/admin/session')
    const sess = await sessRes.json()
    const role = sess.role || 'Admin'
    setMyRole(role)

    const [{data: customers}, {data: orders}, {data: menus}, {data: acs}] = await Promise.all([
      supabase.from('customers').select('*').limit(1000),
      supabase.from('order_requuest').select('*').limit(2000),
      supabase.from('menu').select('*').order('supa_id', {ascending:true}).limit(100),
      supabase.from('asceses').select('*').eq('role', role).eq('can_view', true),
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
      const allowedMenus = acs?.map(a=>a.menu) || []
      allowed = menus?.filter(m=> allowedMenus.includes(m.Menu) || allowedMenus.includes(m.menu)) || []
    }
    const generic = allowed.filter(m=>!specialViews.includes(m.View))
    const withAccess = generic.map(m=>{
      const rule = acs?.find(a=>a.menu===m.Menu || a.menu===m.menu)
      const canEdit = rule?.can_edit || role==='Admin'
      return {...m, _access: canEdit? 'Read & Write' : 'Read', _can_edit: canEdit}
    })
    setMenuTables(withAccess)
  }

  const Item = ({label, count, href, color}) => (
    <Link href={href} className={`p-5 rounded-2xl bg-white shadow border-l-4 ${color} flex justify-between items-center hover:scale-[1.02] transition`}>
      <div><div className="text- text-gray-400 font-bold tracking-widest">{label}</div><div className="text-3xl font-black mt-1">{count??'-'}</div></div>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${count>0?'bg-red-500':'bg-green-500'}`}>{count??'-'}</div>
    </Link>
  )

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-black">Dashboard <span className="text- opacity-50">({myRole})</span></h1>
        <button onClick={load} className="bg-black text-white px-4 py-2 rounded-full">↻ تحديث</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Item label="Customers Pending" count={counts.customersPending} href="/admin/customers-pending" color="border-red-500" />
        <Item label="Pending Orders" count={counts.pendingOrders} href="/admin/pending" color="border-orange-500" />
        <Item label="Today Orders" count={counts.todayOrders} href="/admin/today-orders" color="border-blue-500" />
        <Item label="Active Orders" count={counts.activeOrders} href="/admin/active-orders" color="border-green-500" />
        <Item label="Approved Orders" count={counts.approvedOrders} href="/admin/approved-orders" color="border-emerald-500" />
        <Item label="Complete Orders" count={counts.completeOrders} href="/admin/complete-orders" color="border-purple-500" />
        <Item label="Cash Pending" count={counts.cashPending} href="/admin/cash-pending" color="border-yellow-500" />
        <Item label="Cash Received" count={counts.cashReceived} href="/admin/cash-received" color="border-lime-500" />
        <Item label="Rejected Orders" count={counts.rejectedOrders} href="/admin/rejected-orders" color="border-gray-500" />
        <Item label="Mapping Customers" count={0} href="/admin/mapping-customers" color="border-black" />
      </div>

      <div className="mt-10">
        <h2 className="text- font-black mb-3 opacity-60">عرض خاص - كل الجداول من menu حسب الرول ({myRole}) - ({menuTables.length})</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {menuTables.map(m=>(
            <Link key={m.supa_id} href={`/admin/${m.Menu}`} className="bg-[#080811] text-white p-4 rounded-xl hover:scale-[1.02] transition relative">
              <div className="text- opacity-50">{m.Menu}</div>
              <div className="font-bold text-">{m.View}</div>
              <div className="text- mt-2 px-2 py-0.5 rounded-full bg-white/20 inline-block">{m._access}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
