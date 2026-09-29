"use client"
export const dynamic = "force-dynamic"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import BackToDashboard from "@/components/BackToDashboard"

export default function AdminBank(){
  const router = useRouter()
  const [myId, setMyId] = useState('')
  const [myName, setMyName] = useState('')
  const [myRole, setMyRole] = useState('')
  const [myWallet, setMyWallet] = useState(null)
  const [filterId, setFilterId] = useState('c37302f0')
  const [target, setTarget] = useState(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  const [form, setForm] = useState({ type:'ADD', reason:'BONUS', amount:'', orderId:'', notes:'' })
  const [cashForm, setCashForm] = useState({ amount:'', method:'Cash', notes:'' })

  // القسم التالت - راتب كاش بكود
  const [salaryPhone, setSalaryPhone] = useState('')
  const [salaryAmount, setSalaryAmount] = useState('')
  const [salaryCode, setSalaryCode] = useState('')
  const [foundUsers, setFoundUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [salaryResult, setSalaryResult] = useState(null)

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  useEffect(()=>{ init() },[])

  const init = async()=>{
    try{
      const sess = await fetch('/api/admin/me', {credentials:'include'}).then(r=>r.json())
      const role = String(sess.role || sess.Role || "").trim()
      if(!['Admin','Accounting','Assistant Admin'].includes(role)){
        alert('ممنوع - بس للادمن والمحاسب')
        router.push('/admin')
        return
      }
      const id = sess.userId || sess.id || ''
      setMyId(id)
      setMyName(sess.name || '')
      setMyRole(role)
      if(id){ fetchMyWallet(id) }
    } catch(e){
      router.push('/admin/login')
    } finally{
      setChecking(false)
    }
  }

  const fetchMyWallet = async(id)=>{
    const res = await fetch(`/api/wallet/me?userId=${id}`, {credentials:'include'}).then(r=>r.json())
    if(res.success) setMyWallet(res.wallet)
  }

  const formatLBP = (n)=>{
    const num = Number(String(n).replace(/,/g,''))||0
    return new Intl.NumberFormat('en-US').format(num)+' ل.ل'
  }

  const search = async()=>{
    if(!filterId) return
    setLoading(true)
    try{
      const res = await fetch(`/api/wallet/me?userId=${filterId}`, {credentials:'include'}).then(r=>r.json())
      const { data: cash } = await supabase.from('cash_payouts').select('*').ilike('Owner User ID', `${filterId}%`).order('Created At', {ascending:false}).limit(20)
      if(res.success){
        const { data: u } = await supabase.from('users').select('Role, Name').eq('User ID', filterId).maybeSingle()
        let userData = u
        if(!u){
          const { data: u2 } = await supabase.from('users').select('Role, Name').ilike('User ID', `${filterId}%`).maybeSingle()
          userData = u2
        }
        setTarget({ id:filterId, role:userData?.Role||'Driver', name:userData?.Name||'', balance:res.wallet, tx:res.transactions||[], cash: cash||[] })
      }
    }catch(e){ console.error(e) }
    setLoading(false)
  }

  const doTransfer = async()=>{
    if(!target ||!form.amount) return alert('حط المبلغ')
    const ok = confirm(`بدك تحول ${formatLBP(form.amount)} ${form.type === 'ADD'? 'لـ' : 'من'} ${target.name || target.id.slice(0,8)} ؟\nالسبب: ${form.reason}`)
    if(!ok) return
    const isAdd = form.type === 'ADD'
    const from = isAdd? myId : target.id
    const to = isAdd? target.id : myId
    const res = await fetch('/api/admin/wallet/transfer', {
      method:'POST', credentials:'include', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ fromUserId: from, toUserId: to, amount: form.amount, reason: form.reason, notes: form.notes || `${form.type} ${form.amount} - ${form.reason}`, orderId: form.orderId || null, triggeredBy: myId })
    }).then(r=>r.json())
    if(res.success){ alert('تم التحويل '+res.transferId); setForm({ type:'ADD', reason:'BONUS', amount:'', orderId:'', notes:'' }); fetchMyWallet(myId); search(); } else alert(res.error)
  }

  const doCashOut = async()=>{
    if(!target ||!cashForm.amount) return alert('حط مبلغ السحب')
    const ok = confirm(`تأكيد سحب كاش ${formatLBP(cashForm.amount)} لـ ${target.name}? تسليم يد - ${cashForm.method}`)
    if(!ok) return
    const res = await fetch('/api/admin/wallet/cash-out', {
      method:'POST', credentials:'include', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ownerId: target.id, amount: cashForm.amount, method: cashForm.method, notes: cashForm.notes, createdBy: myId, orderId: form.orderId || null })
    }).then(r=>r.json())
    if(res.success){ alert('تم السحب - رصيدو الجديد: '+formatLBP(res.newBalance)); setCashForm({ amount:'', method:'Cash', notes:'' }); fetchMyWallet(myId); search(); } else alert(res.error)
  }

  // === دوال القسم التالت ===
  const lookupByPhone = async()=>{
    if(!salaryPhone) return alert('حط رقم التلفون')
    setLookupLoading(true)
    setFoundUsers([])
    setSelectedUser(null)
    setSalaryResult(null)
    try{
      const res = await fetch(`/api/admin/wallet/payroll-cash-out?phone=${encodeURIComponent(salaryPhone)}`, {credentials:'include'}).then(r=>r.json())
      if(res.success && res.users && res.users.length>0){
        setFoundUsers(res.users)
        if(res.users.length === 1) setSelectedUser(res.users[0])
      } else {
        alert(res.error || 'ما لقينا حدا بهاد الرقم')
      }
    }catch(e){ alert('خطأ اتصال') }
    setLookupLoading(false)
  }

  const doSalaryCashOut = async()=>{
    if(!selectedUser) return alert('اختار الموظف أول')
    if(!salaryAmount) return alert('حط المبلغ')
    if(!salaryCode || salaryCode.length !== 5) return alert('الكود لازم 5 أرقام')
    
    const ok = confirm(`تأكيد دفع راتب كاش؟\nالموظف: ${selectedUser.name}\nالمبلغ: ${formatLBP(salaryAmount)}\nالكود: ${salaryCode}\nرصيده الحالي: ${formatLBP(selectedUser.balance)}\n\nهل أنت متأكد أن الكود مطابق للي مع الموظف؟`)
    if(!ok) return

    setVerifyLoading(true)
    try{
      const res = await fetch('/api/admin/wallet/payroll-cash-out', {
        method:'POST', credentials:'include', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ phone: salaryPhone, code: salaryCode, amount: salaryAmount, createdBy: myId })
      }).then(r=>r.json())

      if(res.success){
        setSalaryResult(res)
        alert(`✅ ${res.message}\nرصيدو الجديد: ${formatLBP(res.newBalance)}`)
        // تحديث الرصيد المختار
        setSelectedUser(prev=>({...prev, balance: res.newBalance}))
        setSalaryAmount('')
        setSalaryCode('')
      } else {
        alert(`❌ ${res.error}`)
      }
    }catch(e){ alert('خطأ اتصال') }
    setVerifyLoading(false)
  }

  if(checking) return <div className="min-h-screen bg-[#0F0F0F] text-white p-6">عم نتأكد من الصلاحية...</div>

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#EAEAEA] p-6">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Andika:wght@400;700&display=swap');`}</style>
      <BackToDashboard />
      <h1 className="text-3xl font-black tracking-tight mt-4" style={{fontFamily:'Andika'}}>البنك - Admin Bank</h1>
      <p className="text-white/40 text-xs mt-2 tracking-widest">انا: {myName} - {myRole} - {myId?.slice(0,8)}</p>

      <div className="bg-gradient-to-br from-[#FFD700]/20 to-[#1A1A1A] border border-[#FFD700]/30 rounded-3xl p-5 mt-6 flex justify-between items-center">
        <div>
          <div className="text- text-[#FFD700]/70 tracking-widest">محفظتي - WALLET ME</div>
          <div className="text-2xl font-black mt-1 text-white">{myWallet!== null? formatLBP(myWallet) : '...'}</div>
        </div>
        <button onClick={()=>fetchMyWallet(myId)} className="bg-white/10 px-3 py-2 rounded-xl">تحديث</button>
      </div>

      <div className="bg-[#1A1A1A] border border-white/10 rounded-3xl p-5 mt-4 flex gap-3">
        <input value={filterId} onChange={e=>setFilterId(e.target.value)} placeholder="Owner User ID" className="flex-1 p-3 rounded-xl bg-[#0F0F0F] border border-white/10 text-white outline-none"/>
        <button onClick={search} className="px-6 rounded-xl bg-[#FFD700] text-black font-black">بحث</button>
      </div>

      {target && (
        <div className="bg-[#1E1E1E] text-white rounded-3xl p-6 mt-4 flex justify-between items-center border border-white/5">
          <div>
            <div className="opacity-40 tracking-[0.2em] text-xs">{target.role} - {target.name}</div>
            <div className="text-3xl font-black mt-2 text-[#FFD700]">{formatLBP(target.balance)}</div>
            <div className="text-white/30 mt-1 font-mono text-xs">{target.id}...</div>
          </div>
          <div className="w-14 h-14 bg-[#FFD700]/10 border border-[#FFD700]/20 rounded-2xl flex items-center justify-center text-xl">💳</div>
        </div>
      )}

      <div className="bg-[#1A1A1A] border border-white/10 rounded-3xl p-5 mt-6">
        <div className="font-black mb-4 text-white/80 text-sm">1- تحكم - إضافة / خصم (محفظة لمحفظة)</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <select value={form.type} onChange={e=>setForm({...form, type:e.target.value})} className="p-3 rounded-xl bg-[#0F0F0F] border border-white/10 text-white"><option value="ADD">ADD - من عندي لعندو</option><option value="DEDUCT">DEDUCT - من عندو لعندي</option></select>
          <select value={form.reason} onChange={e=>setForm({...form, reason:e.target.value})} className="p-3 rounded-xl bg-[#0F0F0F] border border-white/10 text-white"><option value="BONUS">BONUS</option><option value="SALARY">SALARY</option><option value="ORDER_COMPLETED">ORDER_COMPLETED</option><option value="TRANSFER_TO_STORE">TRANSFER_TO_STORE</option><option value="OVERPAY">OVERPAY</option><option value="REFUND">REFUND</option></select>
          <input placeholder="المبلغ" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} className="p-3 rounded-xl bg-[#0F0F0F] border border-white/10 text-white"/>
          <input placeholder="Order ID" value={form.orderId} onChange={e=>setForm({...form, orderId:e.target.value})} className="p-3 rounded-xl bg-[#0F0F0F] border border-white/10 text-white"/>
          <input placeholder="Notes" value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} className="p-3 rounded-xl bg-[#0F0F0F] border border-white/10 text-white col-span-2"/>
        </div>
        <button onClick={doTransfer} className="mt-4 w-full p-3 rounded-xl bg-white text-black font-black">تنفيذ التحويل</button>
      </div>

      <div className="bg-[#1A1A1A] border border-[#FFD700]/20 rounded-3xl p-5 mt-6">
        <div className="font-black mb-4 text-[#FFD700]/80 text-sm">2- سحب كاش - تسليم يد (بدون كود)</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <input placeholder="مبلغ السحب" value={cashForm.amount} onChange={e=>setCashForm({...cashForm, amount:e.target.value})} className="p-3 rounded-xl bg-[#0F0F0F] border border-white/10 text-white"/>
          <select value={cashForm.method} onChange={e=>setCashForm({...cashForm, method:e.target.value})} className="p-3 rounded-xl bg-[#0F0F0F] border border-white/10 text-white"><option>Cash</option><option>Whish</option><option>OMT</option><option>Bank</option></select>
          <input placeholder="نوت" value={cashForm.notes} onChange={e=>setCashForm({...cashForm, notes:e.target.value})} className="p-3 rounded-xl bg-[#0F0F0F] border border-white/10 text-white"/>
        </div>
        <button onClick={doCashOut} className="mt-4 w-full p-3 rounded-xl bg-[#FFD700] text-black font-black">سحب كاش</button>
      </div>

      {/* === القسم التالت الجديد - راتب كاش بالكود 5 أرقام === */}
      <div className="bg-[#1A1A1A] border border-[#8b5cf6]/40 rounded-3xl p-5 mt-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/20 blur-[30px] rounded-full"></div>
        <div className="font-black mb-4 text-purple-300 text-sm flex items-center gap-2 relative z-10">
          <span className="bg-purple-600 text-white px-2 py-1 rounded text-[10px]">جديد</span>
          3- دفع راتب كاش بكود 5 أرقام (users + payroll_runs + cash_payouts) - مع فحص الرصيد
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 relative z-10">
          <div className="md:col-span-5 flex gap-2">
            <input placeholder="رقم التلفون 03xxxxxx" value={salaryPhone} onChange={e=>setSalaryPhone(e.target.value)} className="flex-1 p-3 rounded-xl bg-[#0F0F0F] border border-purple-500/30 text-white placeholder:text-white/30 focus:border-purple-500 outline-none"/>
            <button onClick={lookupByPhone} disabled={lookupLoading} className="px-4 rounded-xl bg-purple-600 text-white font-black disabled:opacity-50">{lookupLoading ? '...' : 'بحث'}</button>
          </div>
          <input placeholder="المبلغ - جزئي مسموح" value={salaryAmount} onChange={e=>setSalaryAmount(e.target.value)} className="md:col-span-3 p-3 rounded-xl bg-[#0F0F0F] border border-white/10 text-white placeholder:text-white/30"/>
          <input placeholder="كود 5 أرقام" value={salaryCode} onChange={e=>setSalaryCode(e.target.value)} maxLength={5} className="md:col-span-4 p-3 rounded-xl bg-[#0F0F0F] border border-white/10 text-white tracking-[0.4em] font-black text-center placeholder:tracking-normal"/>
        </div>

        {foundUsers.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-2 relative z-10">
            {foundUsers.map(u=>(
              <button key={u.userId} onClick={()=>setSelectedUser(u)} className={`px-3 py-2 rounded-xl text-xs font-bold border ${selectedUser?.userId===u.userId ? 'bg-purple-600 border-purple-500 text-white' : 'bg-white/5 border-white/10 text-white/60'}`}>
                {u.name} - {u.mobile} - {formatLBP(u.balance)}
              </button>
            ))}
          </div>
        )}

        {selectedUser && (
          <div className="mt-4 bg-[#0F0F0F] border border-green-500/30 rounded-2xl p-4 flex justify-between items-center relative z-10">
            <div>
              <div className="text-green-400 text-[11px]">✅ تم التعرف - الاسم واليوزر ايدي</div>
              <div className="font-black text-white mt-1">{selectedUser.name} - {selectedUser.role}</div>
              <div className="text-xs text-white/40 font-mono mt-1">ID: {selectedUser.userId} | {selectedUser.mobile}</div>
              <div className="text-sm text-[#FFD700] mt-1">رصيد المحفظة: {formatLBP(selectedUser.balance)} {selectedUser.balance < Number(salaryAmount||0) ? '⚠️ غير كافي' : '✅ كافي'}</div>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center text-xl">👤</div>
          </div>
        )}

        <button onClick={doSalaryCashOut} disabled={verifyLoading || !selectedUser} className="mt-4 w-full p-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black disabled:opacity-40 shadow-lg shadow-purple-600/20 relative z-10">
          {verifyLoading ? 'جاري التحقق من الكود والرصيد...' : '🔐 تحقق من الكود 5 أرقام وادفع كاش'}
        </button>

        <div className="mt-3 text-[11px] text-white/30 leading-4 relative z-10">
          الآلية: 1) التلفون → users → User ID + Name + Balance | 2) User ID → employees.user_id → employee_id | 3) employee_id + secret_code_5 → payroll_runs | 4) فحص الرصيد: إذا المبلغ أكبر من الرصيد (حتى بعد تنزيل الراتب) يرفض | 5) إذا طابق: DEDUCT من wallet_transactions + سجل ب cash_payouts + تحديث payroll_runs لـ claimed إذا دفع كامل.
        </div>

        {salaryResult && (
          <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-sm relative z-10">
            <div className="text-green-400 font-bold">{salaryResult.isPartial ? 'تم دفع جزئي!' : 'تم دفع كامل!'}</div>
            <div className="text-white/70 mt-1">الموظف: {salaryResult.employee} - شهر: {salaryResult.month} - {formatLBP(salaryResult.amount)} / {formatLBP(salaryResult.payrollAmount)}</div>
            <div className="text-white/50 text-xs mt-1">Payout: {salaryResult.payoutId?.slice(0,8)} | Transfer: {salaryResult.transferId?.slice(0,8)} | جديد: {formatLBP(salaryResult.newBalance)}</div>
          </div>
        )}
      </div>

      {target && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-[#1A1A1A] border border-white/10 rounded-3xl p-5">
            <div className="font-black mb-3 text-white/60 text-sm">آخر تحويلات المحفظة</div>
            {loading? <div className="text-white/40">تحميل...</div> : target.tx.slice(0,20).map((t,i)=>(
              <div key={i} className="flex justify-between py-2 border-b border-white/5 text-xs">
                <div><span className={`px-2 py-1 rounded-full font-black ${String(t.Type).toUpperCase()==='ADD'?'bg-green-500/20 text-green-400':'bg-red-500/20 text-red-400'}`}>{t.Type}</span> {formatLBP(t.Amount)} - {t.Reason}</div>
                <div className="opacity-30 truncate">{t.Notes}</div>
              </div>
            ))}
          </div>
          <div className="bg-[#1A1A1A] border border-[#FFD700]/10 rounded-3xl p-5">
            <div className="font-black mb-3 text-[#FFD700]/60 text-sm">آخر سحوبات الكاش ({target.cash?.length||0})</div>
            {target.cash?.length? target.cash.map((c,i)=>(
              <div key={i} className="flex justify-between py-2 border-b border-white/5 text-xs">
                <div className="text-[#FFD700]">{formatLBP(c.Amount)} - {c.Method} - {c.Status}</div>
                <div className="opacity-30">{c.Notes} - {new Date(c['Created At']).toLocaleTimeString('ar-LB')}</div>
              </div>
            )) : <div className="text-white/20 text-xs">ما في سحوبات</div>}
          </div>
        </div>
      )}
    </div>
  )
}
