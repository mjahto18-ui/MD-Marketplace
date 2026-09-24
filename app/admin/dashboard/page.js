"use client"
export const dynamic = "force-dynamic"
import { useEffect, useState, useRef } from "react"
import { createClient } from "@supabase/supabase-js"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function Dashboard(){
  const [counts, setCounts] = useState({})
  const [menuTables, setMenuTables] = useState([])
  const [myRole, setMyRole] = useState('')
  const [myName, setMyName] = useState('')
  // --- المحفظة - زدناها بدون ما نلمس شي ---
  const [myUserId, setMyUserId] = useState('')
  const [wallet, setWallet] = useState(0)
  const [walletTx, setWalletTx] = useState([])
  const [showWallet, setShowWallet] = useState(false)
  const [showBalance, setShowBalance] = useState(false)

  // === الجديد - SOS ===
  const [sosCount, setSosCount] = useState(0)
  const [sosAlarmActive, setSosAlarmActive] = useState(false)
  const [sosMuted, setSosMuted] = useState(false)
  const [audioUnlocked, setAudioUnlocked] = useState(false)
  const audioRef = useRef(null)
  const sosChannelRef = useRef(null)

  const router = useRouter()
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  useEffect(()=>{ load() },[])

  // === SOS Audio + Realtime - بالداشبورد كمان لان هي عمليات ===
  useEffect(()=>{
    audioRef.current = new Audio("/sounds/sos.mp3")
    audioRef.current.loop = true
    audioRef.current.volume = 1

    const unlock = () => {
      if (audioRef.current && !audioUnlocked) {
        audioRef.current.play().then(()=>{
          audioRef.current.pause()
          audioRef.current.currentTime = 0
          setAudioUnlocked(true)
        }).catch(()=>{})
      }
      document.removeEventListener("click", unlock)
      document.removeEventListener("touchstart", unlock)
    }
    document.addEventListener("click", unlock)
    document.addEventListener("touchstart", unlock)

    // Realtime SOS
    const channel = supabase.channel("dashboard_sos_alerts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "taxi_sos" }, (payload)=>{
        if(payload.new.status !== "open") return
        setSosCount(c=>c+1)
        if(!sosMuted && audioRef.current){
          audioRef.current.currentTime = 0
          audioRef.current.play().catch(()=>{})
          setSosAlarmActive(true)
        }
        if(navigator.vibrate) navigator.vibrate([500,200,500,200,1000])
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "taxi_sos" }, (payload)=>{
        if(payload.new.status === "closed"){
          setSosCount(c=> Math.max(0, c-1))
        }
      })
      .subscribe()
    sosChannelRef.current = channel

    return ()=>{
      document.removeEventListener("click", unlock)
      document.removeEventListener("touchstart", unlock)
      if(sosChannelRef.current) supabase.removeChannel(sosChannelRef.current)
      if(audioRef.current){ audioRef.current.pause(); audioRef.current = null }
    }
  }, [sosMuted, audioUnlocked])

  const formatLBP = (n) => {
    const num = parseFloat(String(n).replace(/,/g,''))||0
    return new Intl.NumberFormat('en-LB').format(num)+' ل.ل'
  }

  const load = async () => {
    const sessRes = await fetch('/api/admin/me', { credentials: 'include', cache: 'no-store' })
    if(!sessRes.ok) return
    const sess = await sessRes.json()

    const role = String(sess.role || sess.Role || 'Admin').trim()
    setMyRole(role)

    // جيب الاسم الحقيقي من جدول users
    let realName = sess.name || sess.username || sess.user || ''
    let uid = sess.userId || sess.user_id || sess.id || ''
    if(!realName || realName === role){
      const email = sess.email || sess.user_email || ''
      if(email){
        const { data: u } = await supabase.from('users').select('*').eq('Email', email).maybeSingle()
        if(u){
          realName = u.Name || u.User || email
          uid = u['User ID'] || u['User_ID'] || u['ID'] || u.id || uid
        }
      }
      if(!realName || realName === role){
        const { data: u2 } = await supabase.from('users').select('*').eq('Role', role).maybeSingle()
        if(u2) realName = u2.Name
      }
    }
    setMyName(realName || sess.email || role)
    if(uid){
      setMyUserId(uid)
      try{
        const w = await fetch(`/api/wallet/me?userId=${uid}`, {cache:'no-store'}).then(r=>r.json())
        if(w.success){ setWallet(w.wallet||0); setWalletTx(w.transactions||[]) }
      }catch{}
    }

    const [{data: customers}, {data: orders}, {data: menus}, {data: acs}, {data: guestlogs}, {data: protectionCases}, {data: pendingOverpay}, {data: pendingReviews}, {data: pendingProducts}, {data: sosOpen}] = await Promise.all([
      supabase.from('customers').select('*').limit(1000),
      supabase.from('order_requuest').select('*').limit(2000),
      supabase.from('menu').select('*').order('supa_id', {ascending:true}).limit(100),
      supabase.from('asceses').select('*').eq('role', role),
      supabase.from('guestlogs').select('*').limit(5000),
      // === الجداول الجديدة يلي زدناهن ===
      supabase.from('protection_cases').select('*').limit(2000),
      supabase.from('pending_overpay').select('*').limit(2000),
      supabase.from('pending_reviews').select('*').limit(2000),
      supabase.from('products').select('*').eq('Active','FALSE').limit(2000),
      supabase.from('taxi_sos').select('id').eq('status','open').limit(100),
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
      // === العدادات الجديدة ===
      protectionPending: protectionCases?.filter(c=>c['Status']==='Pending').length||0,
      protectionUnderReview: protectionCases?.filter(c=>c['Status']==='Under Review').length||0,
      protectionTotal: protectionCases?.length||0,
      overpayPending: pendingOverpay?.filter(c=>c['Status']==='Pending').length||0,
      overpayTotal: pendingOverpay?.length||0,
      pendingReviewsCount: pendingReviews?.filter(c=>c['Status']==='Pending' || c['status']==='pending').length|| pendingReviews?.length||0,
      pendingProducts: pendingProducts?.length||0,
    })
    // SOS count
    setSosCount(sosOpen?.length||0)

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
      className="group relative overflow-hidden bg-[#0F0F0F] border border-white/[0.06] rounded-3xl p-6 flex items-center justify-between shadow-sm hover:shadow-xl/5 hover:-translate-y-1 hover:border-white/[0.08] transition-all duration-300"
    >
      <div className="absolute inset-y-0 right-0 w- bg-[#FFD700] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="flex items-center gap-5 min-w-0">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-all duration-300 ${
          count > 0
      ? 'bg-[#0A0A0A] text-[#FFD700]'
            : 'bg-[#141414] border border-white/[0.06] text-white'
        }`}>
          <span className="text- font-black tracking-widest" style={{fontFamily:'Andika'}}>
            {count > 0? '!' : '✓'}
          </span>
        </div>

        <div className="text-right min-w-0 space-y-1">
          <div className="text- tracking-[0.18em] text-white/40 font-bold uppercase truncate" style={{fontFamily:'Andika'}}>
            {label}
          </div>
          <div className="text- font-black text-white leading-none tracking-tight" style={{fontFamily:'Andika'}}>
            {count}
          </div>
        </div>
      </div>

      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text- font-black shrink-0 shadow-sm ${
        count > 0
    ? 'bg-[#FFD700] text-white'
          : 'bg-[#0A0A0A] text-[#fdfbf7]'
      }`} style={{fontFamily:'Andika'}}>
        {count}
      </div>
    </Link>
  )

  // === كرت العمليات العادي - بلا عداد ===
  const OperationItem = ({label, href, icon, sub}) => (
    <Link
      href={href}
      className="group relative overflow-hidden bg-[#0F0F0F] border border-white/[0.06] rounded-3xl p-6 flex items-center justify-between shadow-sm hover:shadow-xl/5 hover:-translate-y-1 hover:border-white/[0.12] transition-all duration-300"
    >
      <div className="flex items-center gap-5 min-w-0">
        <div className="w-12 h-12 rounded-2xl bg-[#141414] border border-white/[0.06] text-white flex items-center justify-center shrink-0 text-xl">
          {icon}
        </div>
        <div className="text-right min-w-0 space-y-1">
          <div className="text-[11px] tracking-[0.18em] text-white/40 font-bold uppercase truncate" style={{fontFamily:'Andika'}}>
            OPERATIONS
          </div>
          <div className="text-[14px] font-black text-white leading-tight" style={{fontFamily:'Andika'}}>
            {label}
          </div>
          {sub && <div className="text-[11px] text-white/50" style={{fontFamily:'Andika'}}>{sub}</div>}
        </div>
      </div>
      <div className="w-10 h-10 rounded-2xl bg-[#0A0A0A] text-[#fdfbf7] flex items-center justify-center font-black shrink-0">
        →
      </div>
    </Link>
  )

  // === كرت SOS - احمر - بيرجف - مع زمور ===
  const SOSItem = () => {
    const hasAlert = sosCount > 0
    return (
      <Link
        href="/admin/taxi-sos"
        className={`group relative overflow-hidden rounded-3xl p-6 flex items-center justify-between shadow-sm transition-all duration-300 border
          ${hasAlert 
            ? 'bg-[#1a0000] border-red-500/50 hover:border-red-400 shadow-[0_0_40px_rgba(239,68,68,0.3)] animate-[shake_0.5s_ease-in-out_infinite]' 
            : 'bg-[#0F0F0F] border-white/[0.06] hover:border-red-500/30'
          } ${sosAlarmActive && hasAlert ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-black' : ''}`}
      >
        <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 10%,30%,50%,70%,90%{transform:translateX(-2px)} 20%,40%,60%,80%{transform:translateX(2px)} } @keyframes pulse-red{0%,100%{opacity:1} 50%{opacity:0.5}}`}</style>

        {hasAlert && (
          <>
            <div className="absolute inset-0 bg-red-500/10 animate-[pulse-red_1s_ease-in-out_infinite]" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-red-400 to-red-600" />
          </>
        )}

        <div className="flex items-center gap-5 min-w-0 relative">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-2xl font-black shadow-sm transition-all
            ${hasAlert ? 'bg-red-600 text-white animate-pulse' : 'bg-[#141414] border border-white/[0.06] text-white/60'}`}>
            🚨
          </div>

          <div className="text-right min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] tracking-[0.22em] font-black uppercase" style={{fontFamily:'Andika', color: hasAlert ? '#ef4444' : 'rgba(255,255,255,0.4)'}}>
                EMERGENCY
              </span>
              {hasAlert && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />}
              {hasAlert && <span className="w-2 h-2 rounded-full bg-red-500 -ml-2" />}
            </div>
            <div className="text-[15px] font-black leading-tight flex items-center gap-2" style={{fontFamily:'Andika', color: hasAlert ? '#fff' : '#fff'}}>
              SOS - طوارئ التاكسي
              {hasAlert && <span className="text-xs bg-red-600 px-2 py-0.5 rounded-full">{sosCount}</span>}
            </div>
            <div className="text-[11px] font-bold" style={{fontFamily:'Andika', color: hasAlert ? '#fca5a5' : 'rgba(255,255,255,0.5)'}}>
              {hasAlert ? `${sosCount} بلاغ مفتوح - اضغط فوراً!` : 'لا يوجد بلاغات - النظام جاهز'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 relative">
          {hasAlert && (
            <button
              onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); 
                if(audioRef.current){ 
                  if(sosAlarmActive){ audioRef.current.pause(); setSosAlarmActive(false); setSosMuted(true) }
                  else { audioRef.current.play().catch(()=>{}); setSosAlarmActive(true); setSosMuted(false) }
                }
              }}
              className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm"
            >
              {sosAlarmActive ? '🔇' : '🔊'}
            </button>
          )}
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black shrink-0 shadow-sm
            ${hasAlert ? 'bg-red-600 text-white' : 'bg-[#0A0A0A] text-[#fdfbf7]'}`} style={{fontFamily:'Andika'}}>
            {hasAlert ? sosCount : '→'}
          </div>
        </div>
      </Link>
    )
  }

  // === كرت مالي - لون مختلف للبنك والتقارير - بس Admin / Accounting ===
  const FinanceItem = ({label, count, href, icon}) => (
    <Link
      href={href}
      className="group relative overflow-hidden bg-[#0A0A0A] border border-[#FFD700]/30 rounded-3xl p-6 flex items-center justify-between shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-[#FFD700]/60 transition-all duration-300"
    >
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[#FFD700]/10 group-hover:bg-[#FFD700]/20 transition-all duration-300" />

      <div className="flex items-center gap-5 min-w-0 relative">
        <div className="w-12 h-12 rounded-2xl bg-[#FFD700] text-white flex items-center justify-center shrink-0 shadow-sm text-xl">
          {icon}
        </div>

        <div className="text-right min-w-0 space-y-1">
          <div className="text- tracking-[0.18em] text-[#FFD700]/70 font-black uppercase truncate" style={{fontFamily:'Andika'}}>
            FINANCE
          </div>
          <div className="text-sm font-black text-[#fdfbf7] leading-tight tracking-tight" style={{fontFamily:'Andika'}}>
            {label}
          </div>
          <div className="text-xs font-bold text-[#fdfbf7]/50" style={{fontFamily:'Andika'}}>
            Admin / Accounting Only
          </div>
        </div>
      </div>

      <div className="w-10 h-10 rounded-2xl bg-[#141414]/10 group-hover:bg-[#FFD700] group-hover:text-white text-[#fdfbf7] flex items-center justify-center font-black shrink-0 shadow-sm transition-all" style={{fontFamily:'Andika'}}>
        →
      </div>
    </Link>
  )

  const isFinanceRole = ['Admin','Accounting'].includes(myRole)

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Andika:wght@400;700&family=JetBrains+Mono:wght@400;500&display=swap');
        .mono{font-family:'JetBrains Mono',monospace!important}
        .gold-glow{box-shadow:0 0 40px rgba(255,215,0,0.15), 0 0 80px rgba(255,215,0,0.05), inset 0 1px 0 rgba(255,215,0,0.2)}
        .gold-glow-strong{box-shadow:0 0 60px rgba(255,215,0,0.3), 0 0 120px rgba(255,215,0,0.1), inset 0 1px 0 rgba(255,215,0,0.3)}
        .grid-pattern{background-image:radial-gradient(rgba(255,215,0,0.08) 1px, transparent 1px); background-size:24px 24px}
      `}</style>

      {/* HEADER - نيومينيمالزم حليبي */}
      <div className="sticky top-0 z-30 bg-[#0F0F0F]/80 backdrop-blur-[20px] border-b border-white/[0.06]">

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
              <div className="font-black text- tracking-[0.08em] text-white" style={{fontFamily:'Andika'}}>
                MD MARKETPLACE
              </div>

              <div className="flex items-center gap-2.5">

                <span className="inline-flex items-center rounded-full bg-[#141414] border border-white/[0.08] px-3 py-1 text- font-black tracking-[0.14em] text-white shadow-sm" style={{fontFamily:'Andika'}}>
                  {myRole}
                </span>

                <span className="text- font-bold text-white/70" style={{fontFamily:'Andika'}}>
                  {myName} 👤
                </span>

              </div>
            </div>

          </div>

          <div className="flex items-center gap-3">

            <button
              onClick={load}
              className="h-11 px-5 rounded-2xl border border-white/[0.08] bg-[#141414] text-white text-xs font-bold hover:bg-[#0F0F0F] hover:border-[#0A0A0A]/20 active:scale-[0.98] shadow-sm transition-all"
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
            <div className="text- font-bold tracking-[0.22em] uppercase text-white/40" style={{fontFamily:'Andika'}}>
              CONTROL CENTER
            </div>

            <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-white" style={{fontFamily:'Andika'}}>
              لوحة التحكم
            </h1>

            <p className="text- text-white/60 font-medium" style={{fontFamily:'Andika'}}>
              مرحباً {myName}، إليك ملخص عمليات المنصة.
            </p>
          </div>

          <div className="hidden md:flex items-center gap-3 rounded-full bg-[#141414] border border-white/[0.08] px-5 py-2.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#FFD700] shadow-sm animate-pulse" />
            <span className="text- font-bold tracking-widest text-white" style={{fontFamily:'Andika'}}>
              SYSTEM ONLINE
            </span>
          </div>

        </div>

        {/* === كرت المحفظة - ديفولت ****** مع عين - اختيار الزبون بس === */}
        <div className="bg-[#0A0A0A] text-[#fdfbf7] rounded-3xl p-6 flex items-center justify-between shadow-sm border border-[#FFD700]/20">
          <div className="flex-1">
            <div className="text-xs tracking-[0.2em] text-[#fdfbf7]/50 font-bold" style={{fontFamily:'Andika'}}>WALLET - محفظتي</div>
            <div className="text-3xl font-black mt-2 tracking-widest" style={{fontFamily:'Andika'}}>
              {showBalance ? formatLBP(wallet) : '•••••••• ل.ل'}
            </div>
            <div className="text-xs text-[#FFD700] mt-2 font-bold" style={{fontFamily:'Andika'}}>اضغط لعرض التفاصيل - مبلغ + ADD/حسم + نوت - {myUserId? String(myUserId).slice(0,8):''}</div>
            <button onClick={()=>setShowWallet(true)} className="mt-3 text-xs bg-[#141414]/10 hover:bg-[#141414]/20 px-3 py-1.5 rounded-xl">عرض التفاصيل</button>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={()=>setShowBalance(!showBalance)}
              className="h-14 px-6 rounded-2xl bg-[#FFD700] text-black font-black text-sm hover:bg-[#141414] transition-all"
              style={{fontFamily:'Andika'}}
            >
              {showBalance ? 'اخفاء' : 'اظهار'}
            </button>
            <div className="w-16 h-16 rounded-2xl bg-[#FFD700] flex items-center justify-center text-2xl">💳</div>
          </div>
        </div>

        {/* === قسم العمليات الجديد - SOS + 3 كروت === */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-right space-y-1">
              <h2 className="text- font-black text-white" style={{fontFamily:'Andika'}}>
                العمليات - الطوارئ والمكتب
              </h2>
              <p className="text- text-white/50" style={{fontFamily:'Andika'}}>
                SOS & Attendance & Payroll
              </p>
            </div>
            <div className="h-px flex-1 bg-red-500/10 mx-6" />
            <div className="text-[10px] text-white/30 tracking-widest" style={{fontFamily:'Andika'}}>
              LIVE OPERATIONS
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* SOS - كامل العرض - احمر - بيرجف - مع زمور */}
            <SOSItem />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* 3 كروت عمليات - بلا عداد - نفس قالب Item */}
            <OperationItem label="الحضور - مين بالدوام؟" href="/admin/attendance" icon="👥" sub="تحكم يدوي + تصفير جهاز" />
            <OperationItem label="الرواتب - الكود الخماسي" href="/admin/payroll" icon="💰" sub="احسب رواتب الشهر" />
            <OperationItem label="شاشة المكتب - QR" href="/admin/office-display" icon="📱" sub="عرض QR للموظفين" />
          </div>
        </section>

        {/* MAIN STATUS CARDS */}
        <section className="space-y-6">

          <div className="flex items-center justify-between">

            <div className="text-right space-y-1">
              <h2 className="text- font-black text-white" style={{fontFamily:'Andika'}}>
                حالة العمليات
              </h2>

              <p className="text- text-white/50" style={{fontFamily:'Andika'}}>
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

            {/* === الكروت الجديدة يلي طلبتا - ما انمحى شي قديم === */}
            <Item label="PROTECTION PENDING" count={counts.protectionPending} href="/admin/protection-cases" />
            <Item label="PROTECTION UNDER REVIEW" count={counts.protectionUnderReview} href="/admin/protection-cases" />
            <Item label="OVERPAY PENDING" count={counts.overpayPending} href="/admin/pending-overpay" />
            <Item label="PENDING REVIEWS" count={counts.pendingReviewsCount} href="/admin/pending-reviews" />
            <Item label="PENDING PRODUCTS" count={counts.pendingProducts} href="/admin/pending-products" />

            {/* === كروت المالية - بس Admin / Accounting - لون اسود وذهبي === */}
            {isFinanceRole && (
              <>
                <FinanceItem label="REPORTS AMOUNT - التقارير المالية" count={0} href="/admin/reports-amount" icon="📊" />
                <FinanceItem label="WALLET - إدارة البنك والمحافظ" count={0} href="/admin/wallet" icon="🏦" />
              </>
            )}

          </div>

        </section>

        {/* MENU */}
        <section className="space-y-6">

          <div className="flex items-end justify-between">

            <div className="text-right space-y-1">
              <h2 className="text- font-black text-white" style={{fontFamily:'Andika'}}>
                أدوات الإدارة
              </h2>
              <p className="text- text-white/50" style={{fontFamily:'Andika'}}>
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
                className="group relative overflow-hidden bg-[#141414] rounded-3xl p-6 min-h- flex flex-col justify-between border border-white/[0.06] shadow-sm hover:shadow-xl/5 hover:-translate-y-1 hover:border-[#FFD700]/40 transition-all duration-300"
              >

                <div className="absolute -top-14 -right-14 w-36 h-36 rounded-full bg-[#FFD700]/[0.06] group-hover:bg-[#FFD700]/[0.12] transition-all duration-300" />

                <div className="relative space-y-6">

                  <div className="flex items-center justify-between">

                    <span className="text- tracking-[0.18em] text-white/40 font-black uppercase" style={{fontFamily:'Andika'}}>
                      {m.Menu}
                    </span>

                    <span className="w-8 h-8 rounded-xl bg-[#0F0F0F] border border-white/[0.06] flex items-center justify-center text-white/40 group-hover:text-white group-hover:border-[#FFD700]/40 transition-all shadow-sm">
                      →
                    </span>

                  </div>

                  <div className="font-black text- text-white leading-tight" style={{fontFamily:'Andika'}}>
                    {m.View}
                  </div>

                </div>

                <div className="relative flex items-center justify-between mt-6">

                  <span className={`inline-flex rounded-full px-3.5 py-1.5 text- font-black shadow-sm ${
                    m._access === 'Read & Write'
               ? 'bg-[#0A0A0A] text-[#FFD700] border border-[#FFD700]/30'
                      : 'bg-[#0F0F0F] text-white/60 border border-white/[0.08]'
                  }`} style={{fontFamily:'Andika'}}>
                    {m._access}
                  </span>

                  <span className="text- text-white/30 font-bold tracking-widest" style={{fontFamily:'Andika'}}>
                    OPEN
                  </span>

                </div>

              </Link>

            ))}

          </div>

        </section>

      </main>

      {/* مودال المحفظة - مبلغ + ADD/حسم + نوت */}
      {showWallet && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl w-full max-w-md max-h- overflow-hidden flex flex-col">
            <div className="p-5 bg-[#0A0A0A] text-[#fdfbf7] flex justify-between items-center">
              <div><div className="text-xs opacity-50">محفظتي - {myUserId}</div><div className="text-2xl font-black mt-1">{formatLBP(wallet)}</div></div>
              <button onClick={()=>setShowWallet(false)} className="w-8 h-8 rounded-xl bg-[#141414]/10 flex items-center justify-center">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {walletTx.length===0 && <div className="text-center p-8 text-black/40">لا يوجد حركات</div>}
              {walletTx.map((t,i)=>{
                const amt = Number(t.Amount||0)
                const isDeduct = String(t.Type).toUpperCase()!=='ADD'
                return (
                  <div key={i} className="flex justify-between items-center p-3 border-b border-black/5">
                    <div className="flex-1">
                      <div className="flex gap-2 items-center">
                        <span className={`px-2 py-1 rounded-full text- font-black ${isDeduct?'bg-red-100 text-red-600':'bg-green-100 text-green-600'}`}>{isDeduct?'🔴 حسم':'🟢 ADD'}</span>
                        <span className={`font-black text-sm ${isDeduct?'text-red-600':'text-green-600'}`}>{isDeduct?'-':'+'}{formatLBP(amt)}</span>
                      </div>
                      <div className="text-xs mt-1 text-black/80">{t.Notes || t.Reason || '-'}</div>
                      <div className="text- opacity-40 mt-1">{t['Created At']? new Date(t['Created At']).toLocaleString('ar-LB'):''} {t['Order ID']? `| ${t['Order ID']}`:''}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
