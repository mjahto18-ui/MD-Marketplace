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
    <Link
      href={href}
      className="group relative overflow-hidden bg-white border border-slate-200/80 rounded-2xl p-5 flex items-center justify-between shadow-[0_2px_12px_rgba(15,23,42,0.04)] hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(15,23,42,0.09)] hover:border-slate-300 transition-all duration-200"
    >
      <div className="absolute inset-y-0 right-0 w-1 bg-slate-900 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-center gap-4 min-w-0">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
          count > 0
            ? 'bg-red-50 text-red-600'
            : 'bg-slate-100 text-slate-500'
        }`}>
          <span className="text-lg font-black">
            {count > 0 ? '!' : '✓'}
          </span>
        </div>

        <div className="text-right min-w-0">
          <div className="text-[11px] tracking-[0.12em] text-slate-400 font-bold uppercase truncate">
            {label}
          </div>
          <div className="text-[28px] font-black text-slate-900 mt-1 leading-none tracking-tight">
            {count}
          </div>
        </div>
      </div>

      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
        count > 0
          ? 'bg-red-600 text-white'
          : 'bg-slate-100 text-slate-500'
      }`}>
        {count}
      </div>
    </Link>
  )

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-900">

      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200/80">

        <div className="px-6 lg:px-10 py-4 flex justify-between items-center">

          <div className="flex items-center gap-4">

            <div className="w-11 h-11 rounded-2xl bg-slate-950 flex items-center justify-center shadow-lg shadow-slate-900/10 overflow-hidden">
              <img
                src="/logo.png"
                alt="logo"
                className="w-8 h-8 object-contain"
                onError={(e)=>e.target.style.display='none'}
              />
            </div>

            <div className="text-right">
              <div className="font-black text-[15px] tracking-[0.04em] text-slate-950">
                MD MARKETPLACE
              </div>

              <div className="flex items-center gap-2 mt-1.5">

                <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-[10px] font-black tracking-[0.12em] text-slate-600">
                  {myRole}
                </span>

                <span className="text-[12px] font-bold text-slate-500">
                  {myName} 👤
                </span>

              </div>
            </div>

          </div>

          <div className="flex items-center gap-2">

            <button
              onClick={load}
              className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all"
            >
              <span className="mr-1.5">↻</span>
              تحديث
            </button>

            <button
              onClick={logout}
              className="h-10 px-5 rounded-xl bg-slate-950 text-white text-xs font-black hover:bg-slate-800 active:scale-[0.98] shadow-lg shadow-slate-900/10 transition-all"
            >
              خروج
            </button>

          </div>

        </div>

      </div>


      {/* CONTENT */}
      <main className="px-5 lg:px-10 py-8 max-w-[1600px] mx-auto">

        {/* WELCOME */}
        <div className="mb-8 flex items-end justify-between gap-4">

          <div className="text-right">
            <div className="text-[11px] font-bold tracking-[0.16em] uppercase text-slate-400 mb-2">
              CONTROL CENTER
            </div>

            <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-950">
              لوحة التحكم
            </h1>

            <p className="text-sm text-slate-500 font-medium mt-2">
              مرحباً {myName}، إليك ملخص عمليات المنصة.
            </p>
          </div>

          <div className="hidden md:flex items-center gap-2 rounded-full bg-white border border-slate-200 px-4 py-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-500">
              SYSTEM ONLINE
            </span>
          </div>

        </div>


        {/* MAIN STATUS CARDS */}
        <section>

          <div className="flex items-center justify-between mb-4">

            <div className="text-right">
              <h2 className="text-sm font-black text-slate-900">
                حالة العمليات
              </h2>

              <p className="text-[11px] text-slate-400 mt-1">
                Orders & Customers Overview
              </p>
            </div>

            <div className="h-px flex-1 bg-slate-200 mx-5" />

          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">

            <Item
              label="CUSTOMERS PENDING"
              count={counts.customersPending}
              href="/admin/customers-pending"
            />

            <Item
              label="PENDING ORDERS"
              count={counts.pendingOrders}
              href="/admin/pending"
            />

            <Item
              label="TODAY ORDERS"
              count={counts.todayOrders}
              href="/admin/today-orders"
            />

            <Item
              label="ACTIVE ORDERS"
              count={counts.activeOrders}
              href="/admin/active-orders"
            />

            <Item
              label="APPROVED ORDERS"
              count={counts.approvedOrders}
              href="/admin/approved-orders"
            />

            <Item
              label="COMPLETE ORDERS"
              count={counts.completeOrders}
              href="/admin/complete-orders"
            />

            <Item
              label="CASH PENDING"
              count={counts.cashPending}
              href="/admin/cash-pending"
            />

            <Item
              label="CASH RECEIVED"
              count={counts.cashReceived}
              href="/admin/cash-received"
            />

            <Item
              label="REJECTED ORDERS"
              count={counts.rejectedOrders}
              href="/admin/rejected-orders"
            />

            <Item
              label="MAPPING CUSTOMERS"
              count={0}
              href="/admin/mapping-customers"
            />

          </div>

        </section>


        {/* MENU */}
        <section className="mt-12">

          <div className="flex items-end justify-between mb-4">

            <div className="text-right">

              <h2 className="text-sm font-black text-slate-900">
                أدوات الإدارة
              </h2>

              <p className="text-[11px] text-slate-400 mt-1">
                {myRole} · {menuTables.length} صلاحية متاحة
              </p>

            </div>

            <div className="h-px flex-1 bg-slate-200 mx-5" />

          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

            {menuTables.map(m=>(

              <Link
                key={m.supa_id}
                href={`/admin/${m.Menu}`}
                className="group relative overflow-hidden bg-slate-950 rounded-2xl p-5 min-h-[150px] flex flex-col justify-between border border-slate-800 hover:-translate-y-1 hover:bg-slate-900 hover:shadow-[0_18px_40px_rgba(15,23,42,0.18)] transition-all duration-200"
              >

                <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-white/[0.04] group-hover:bg-white/[0.07] transition-all" />

                <div className="relative">

                  <div className="flex items-center justify-between">

                    <span className="text-[10px] tracking-[0.16em] text-white/35 font-black uppercase">
                      {m.Menu}
                    </span>

                    <span className="w-8 h-8 rounded-lg bg-white/[0.07] flex items-center justify-center text-white/50 group-hover:text-white group-hover:bg-white/[0.12] transition-all">
                      →
                    </span>

                  </div>

                  <div className="font-black text-[17px] text-white mt-5 leading-tight">
                    {m.View}
                  </div>

                </div>


                <div className="relative flex items-center justify-between mt-5">

                  <span className={`inline-flex rounded-lg px-3 py-1.5 text-[10px] font-black ${
                    m._access === 'Read & Write'
                      ? 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/10'
                      : 'bg-white/[0.07] text-white/50 border border-white/[0.06]'
                  }`}>
                    {m._access}
                  </span>

                  <span className="text-[10px] text-white/25 font-bold tracking-wider">
                    OPEN
                  </span>

                </div>

              </Link>

            ))}

          </div>

        </section>

      </main>

    </div>
  )
}
