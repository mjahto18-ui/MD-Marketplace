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

    // جيب الاسم الحقيقي من جدول users
    let realName = sess.name || sess.username || sess.user || ''
    if(!realName || realName === role){
      const email = sess.email || sess.user_email || ''
      if(email){
        const { data: u } = await supabase.from('users').select('Name, Email, User').eq('Email', email).maybeSingle()
        if(u) realName = u.Name || u.User || email
      }
      if(!realName || realName === role){
        const { data: u2 } = await supabase.from('users').select('Name').eq('Role', role).maybeSingle()
        if(u2) realName = u2.Name
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
      return {...m, _access: canEdit? 'Read & Write' : 'Read'}
    })
    setMenuTables(withAccess)
  }

  const logout = async()=>{
    await fetch('/api/admin/logout', { method:'POST', credentials:'include' })
    router.push('/admin/login')
  }

  const Item = ({label, count, href}) => (
    <Link href={href} className="group bg-white border border-[#e8e5db] p-5 flex justify-between items-center hover:bg-[#fdfcf8] hover:border-[#2d2a1a] transition-all duration-200">
      <div className="text-right flex-1">
        <div className="text- tracking-[0.2em] text-[#9a968a] font-bold">{label}</div>
        <div className="text- font-black text-[#1c1a14] mt-1 leading-none">{count}</div>
      </div>
      <div className={`w- h- flex items-center justify-center text- font-black ${count>0?'bg-[#e6392e] text-white':'bg-[#2d3325] text-[#e8e6d9]'}`}>
        {count}
      </div>
    </Link>
  )

  return (
    <div className="min-h-screen bg-[#f4f2eb] p-0">
      {/* HEADER - مربع بلا حروف */}
      <div className="bg-white border-b border-[#e8e5db] px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="logo" className="w-8 h-8 object-contain" onError={(e)=>e.target.style.display='none'} />
          <div className="text-right">
            <div className="font-black text- text-[#1c1a14] tracking-tight">MD MARKETPLACE</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-[#2d2a1a] text-white text- px-2.5 py-1 font-bold tracking-widest">{myRole}</span>
              <span className="text- font-bold text-[#1c1a14]">{myName} 👤</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="border border-[#2d2a1a] px-4 py-2 text- font-bold hover:bg-[#2d2a1a] hover:text-white transition">تحديث</button>
          <button onClick={logout} className="bg-[#2d2a1a] text-white px-5 py-2 text- font-black hover:bg-black transition">خروج</button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap- bg-[#e8e5db] border border-[#e8e5db]">
          <Item label="CUSTOMERS PENDING" count={counts.customersPending} href="/admin/customers-pending" />
          <Item label="PENDING ORDERS" count={counts.pendingOrders} href="/admin/pending" />
          <Item label="TODAY ORDERS" count={counts.todayOrders} href="/admin/today-orders" />
          <Item label="ACTIVE ORDERS" count={counts.activeOrders} href="/admin/active-orders" />
          <Item label="APPROVED ORDERS" count={counts.approvedOrders} href="/admin/approved-orders" />
          <Item label="COMPLETE ORDERS" count={counts.completeOrders} href="/admin/complete-orders" />
          <Item label="CASH PENDING" count={counts.cashPending} href="/admin/cash-pending" />
          <Item label="CASH RECEIVED" count={counts.cashReceived} href="/admin/cash-received" />
          <Item label="REJECTED ORDERS" count={counts.rejectedOrders} href="/admin/rejected-orders" />
          <Item label="MAPPING CUSTOMERS" count={0} href="/admin/mapping-customers" />
        </div>

        <div className="mt-10">
          <div className="text- tracking-[0.2em] text-[#9a968a] font-bold mb-3">عرض خاص — {myRole} — ({menuTables.length})</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap- bg-[#d8d2be] border border-[#d8d2be]">
            {menuTables.map(m=>(
              <Link key={m.supa_id} href={`/admin/${m.Menu}`} className="bg-[#3e3b2f] text-[#f6f3e8] p-5 hover:bg-[#4a4739] transition-colors group">
                <div className="text- tracking-[0.18em] opacity-50 font-bold">{m.Menu}</div>
                <div className="font-bold text- mt-1">{m.View}</div>
                <div className="mt-3">
                  <span className="bg-[#f6f3e8] text-[#3e3b2f] text- px-3 py-1 font-black">{m._access}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
