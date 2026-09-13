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

    const [{data: customers}, {data: orders}, {data: menus}, {data: acs}, {data: guestlogs}] = await Promise.all([
      supabase.from('customers').select('*').limit(1000),
      supabase.from('order_requuest').select('*').limit(2000),
      supabase.from('menu').select('*').order('supa_id', {ascending:true}).limit(100),
      supabase.from('asceses').select('*').eq('role', role),
      supabase.from('guestlogs').select('*').limit(5000),
    ])

    const today = new Date().toISOString().split('T')[0]
    setCounts({
      customersPending: customers?.filter(c=>c['Status']==='Pending').length||0,
      pendingOrders: orders?.filter(o=>o['Approval Status']==='Pending').length||0,
      activeOrders: orders?.filter(o=>o['Approval Status']==='Active' || o['Approval Status']==='Approved').length||0,
      todayOrders: orders?.filter(o=>String(o['Request Date']||'').startsWith(today)).length||0,
      cashPending: orders?.filter(o=>o['Cash Status']==='Pending' && o['Final Payment Method']==='Cash').length||0,
      cashReceived: orders?.filter(o=>o['Cash Status']==='Received').length||0,
      completeOrders: orders?.filter(o=>o['Approval Status']==='Complete Orders').length||0,
      rejectedOrders: orders?.filter(o=>o['Approval Status']==='Rejected').length||0,
      approvedOrders: orders?.filter(o=>o['Approval Status']==='Approved').length||0,
      guestToday: guestlogs?.filter(g=>String(g['Log Date']||g['Date Time']||'').startsWith(today)).length||0,
      guestTotal: guestlogs?.length||0,
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
      className="group relative overflow-hidden bg-[#fdfbf7] border border-[#0A0A0A]/[0.06] rounded-3xl p-6 flex items-center justify-between shadow-sm hover:shadow-xl/5 hover:-translate-y-1 hover:border-[#0A0A0A]/10 transition-all duration-300"
    >
      <div className="absolute inset-y-0 right-0 w- bg-[#FFD700] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="flex items-center gap-5 min-w-0">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-all duration-300 ${
          count > 0
        ? 'bg-[#0A0A0A] text-[#FFD700]'
            : 'bg-white border border-[#0A0A0A]/5 text-[#0A0A0A]'
        }`}>
          <span className="text- font-black tracking-widest" style={{fontFamily:'Andika'}}>
            {count > 0? '!' : '✓'}
          </span>
        </div>

        <div className="text-right min-w-0 space-y-1">
          <div className="text- tracking-[0.18em] text-[#0A0A0A]/40 font-bold uppercase truncate" style={{fontFamily:'Andika'}}>
            {label}
          </div>
          <div className="text- font-black text-[#0A0A0A] leading-none tracking-tight" style={{fontFamily:'Andika'}}>
            {count}
          </div>
        </div>
      </div>

      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text- font-black shrink-0 shadow-sm ${
        count > 0
      ? 'bg-[#FFD700] text-[#0A0A0A]'
          : 'bg-[#0A0A0A] text-[#fdfbf7]'
      }`} style={{fontFamily:'Andika'}}>
        {count}
      </div>
    </Link>
  )

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-[#0A0A0A]">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Andika:wght@400;700&display=swap');`}</style>

      {/* HEADER - نيومينيمالزم حليبي */}
      <div className="sticky top-0 z-30 bg-[#fdfbf7]/80 backdrop-blur-xl border-b border-[#0A0A0A]/[0.06]">

        <div className="px-6 lg:px-10 py-6 flex justify-between items-center">

          <div className="flex items-center gap-5">

            <div className="w-12 h-12 rounded-2xl bg-[#0A0A0A] flex items-center justify-center shadow-sm overflow-hidden border border-[#FFD700]/30">
              <img
                src="/logo.png"
                alt="logo"
                className="w-8 h-8 object-contain"
                onError={(e)=>e.target.style.display='none'}
              />
            </div>

            <div className="text-right space-y-2">
              <div className="font-black text- tracking-[0.08em] text-[#0A0A0A]" style={{fontFamily:'Andika'}}>
                MD MARKETPLACE
              </div>

              <div className="flex items-center gap-2.5">

                <span className="inline-flex items-center rounded-full bg-white border border-[#0A0A0A]/10 px-3 py-1 text- font-black tracking-[0.14em] text-[#0A0A0A] shadow-sm" style={{fontFamily:'Andika'}}>
                  {myRole}
                </span>

                <span className="text- font-bold text-[#0A0A0A]/70" style={{fontFamily:'Andika'}}>
                  {myName} 👤
                </span>

              </div>
            </div>

          </div>

          <div className="flex items-center gap-3">

            <button
              onClick={load}
              className="h-11 px-5 rounded-2xl border border-[#0A0A0A]/10 bg-white text-[#0A0A0A] text-xs font-bold hover:bg-[#fdfbf7] hover:border-[#0A0A0A]/20 active:scale-[0.98] shadow-sm transition-all"
              style={{fontFamily:'Andika'}}
            >
              <span className="mr-1.5">↻</span>
              تحديث
            </button>

            <button
              onClick={logout}
              className="h-11 px-6 rounded-2xl bg-[#0A0A0A] text-[#fdfbf7] text-xs font-black hover:bg-black active:scale-[0.98] shadow-sm hover:shadow-xl/5 transition-all border border-[#FFD700]/20"
              style={{fontFamily:'Andika'}}
            >
              خروج
            </button>

          </div>

        </div>

      </div>

      {/* CONTENT */}
      <main className="px-6 lg:px-10 py-10 max-w- mx-auto space-y-12">

        {/* WELCOME */}
        <div className="flex items-end justify-between gap-6">

          <div className="text-right space-y-3">
            <div className="text- font-bold tracking-[0.22em] uppercase text-[#0A0A0A]/40" style={{fontFamily:'Andika'}}>
              CONTROL CENTER
            </div>

            <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-[#0A0A0A]" style={{fontFamily:'Andika'}}>
              لوحة التحكم
            </h1>

            <p className="text- text-[#0A0A0A]/60 font-medium" style={{fontFamily:'Andika'}}>
              مرحباً {myName}، إليك ملخص عمليات المنصة.
            </p>
          </div>

          <div className="hidden md:flex items-center gap-3 rounded-full bg-white border border-[#0A0A0A]/10 px-5 py-2.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#FFD700] shadow-sm animate-pulse" />
            <span className="text- font-bold tracking-widest text-[#0A0A0A]" style={{fontFamily:'Andika'}}>
              SYSTEM ONLINE
            </span>
          </div>

        </div>

        {/* MAIN STATUS CARDS */}
        <section className="space-y-6">

          <div className="flex items-center justify-between">

            <div className="text-right space-y-1">
              <h2 className="text- font-black text-[#0A0A0A]" style={{fontFamily:'Andika'}}>
                حالة العمليات
              </h2>

              <p className="text- text-[#0A0A0A]/50" style={{fontFamily:'Andika'}}>
                Orders & Customers Overview
              </p>
            </div>

            <div className="h-px flex-1 bg-[#0A0A0A]/10 mx-6" />

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">

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
            <Item label="GUEST STATS" count={counts.guestToday} href="/admin/guest-stats" />
            <Item label="BROADCAST" count={0} href="/admin/broadcasts" />

          </div>

        </section>

        {/* MENU */}
        <section className="space-y-6">

          <div className="flex items-end justify-between">

            <div className="text-right space-y-1">
              <h2 className="text- font-black text-[#0A0A0A]" style={{fontFamily:'Andika'}}>
                أدوات الإدارة
              </h2>
              <p className="text- text-[#0A0A0A]/50" style={{fontFamily:'Andika'}}>
                {myRole} · {menuTables.length} صلاحية متاحة
              </p>
            </div>

            <div className="h-px flex-1 bg-[#0A0A0A]/10 mx-6" />

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

            {menuTables.map(m=>(

              <Link
                key={m.supa_id}
                href={`/admin/${m.Menu}`}
                className="group relative overflow-hidden bg-white rounded-3xl p-6 min-h- flex flex-col justify-between border border-[#0A0A0A]/[0.06] shadow-sm hover:shadow-xl/5 hover:-translate-y-1 hover:border-[#FFD700]/40 transition-all duration-300"
              >

                <div className="absolute -top-14 -right-14 w-36 h-36 rounded-full bg-[#FFD700]/[0.06] group-hover:bg-[#FFD700]/[0.12] transition-all duration-300" />

                <div className="relative space-y-6">

                  <div className="flex items-center justify-between">

                    <span className="text- tracking-[0.18em] text-[#0A0A0A]/40 font-black uppercase" style={{fontFamily:'Andika'}}>
                      {m.Menu}
                    </span>

                    <span className="w-8 h-8 rounded-xl bg-[#fdfbf7] border border-[#0A0A0A]/5 flex items-center justify-center text-[#0A0A0A]/40 group-hover:text-[#0A0A0A] group-hover:border-[#FFD700]/40 transition-all shadow-sm">
                      →
                    </span>

                  </div>

                  <div className="font-black text- text-[#0A0A0A] leading-tight" style={{fontFamily:'Andika'}}>
                    {m.View}
                  </div>

                </div>

                <div className="relative flex items-center justify-between mt-6">

                  <span className={`inline-flex rounded-full px-3.5 py-1.5 text- font-black shadow-sm ${
                    m._access === 'Read & Write'
                 ? 'bg-[#0A0A0A] text-[#FFD700] border border-[#FFD700]/30'
                      : 'bg-[#fdfbf7] text-[#0A0A0A]/60 border border-[#0A0A0A]/10'
                  }`} style={{fontFamily:'Andika'}}>
                    {m._access}
                  </span>

                  <span className="text- text-[#0A0A0A]/30 font-bold tracking-widest" style={{fontFamily:'Andika'}}>
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
