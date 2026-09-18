"use client"
export const dynamic = "force-dynamic"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"

export default function AdminBank(){
  const router = useRouter()
  const [myId, setMyId] = useState('')
  const [myName, setMyName] = useState('')
  const [myRole, setMyRole] = useState('')
  const [filterId, setFilterId] = useState('c37302f0-1ab6-4d47-b6b4-38c4a7fcfbf8')
  const [target, setTarget] = useState(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  const [form, setForm] = useState({ type:'ADD', reason:'BONUS', amount:'', orderId:'', notes:'' })
  const [cashForm, setCashForm] = useState({ amount:'', method:'Cash', notes:'' })

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  useEffect(()=>{ init() },[])
  
  const init = async()=>{
    try{
      const sess = await fetch('/api/admin/me', {credentials:'include'}).then(r=>r.json())
      
      // هون الشرط - بس Admin بيقدر يفوت
      // بكرا بتصير: if(!['Admin','Accounting'].includes(sess.role)) 
      if(sess.role !== 'Admin'){
        alert('ممنوع - بس للأدمن')
        router.push('/admin')
        return
      }

      // انت بتفوت برقم تلفون - فمناخد userId مباشر من الكوكي
      setMyId(sess.userId || sess.id || '')
      setMyName(sess.name || '')
      setMyRole(sess.role || '')
    } catch(e){
      router.push('/admin/login')
    } finally{
      setChecking(false)
    }
  }

  const formatLBP = (n)=>{
    const num = Number(String(n).replace(/,/g,''))||0
    return new Intl.NumberFormat('en-US').format(num)+' ل.ل'
  }

  const search = async()=>{
    if(!filterId) return
    setLoading(true)
    const res = await fetch(`/api/wallet/me?userId=${filterId}`, {credentials:'include'}).then(r=>r.json())
    if(res.success){
      const { data: u } = await supabase.from('users').select('Role, Name').eq('User ID', filterId).maybeSingle()
      // اذا ما لقاه بالـ UUID الكامل، جرب بالـ short
      let userData = u
      if(!u){
        const { data: u2 } = await supabase.from('users').select('Role, Name').ilike('User ID', `${filterId}%`).maybeSingle()
        userData = u2
      }
      setTarget({ id:filterId, role:userData?.Role||'Driver', name:userData?.Name||'', balance:res.wallet, tx:res.transactions||[] })
    }
    setLoading(false)
  }

  const doTransfer = async()=>{
    if(!target ||!form.amount) return alert('حط المبلغ')
    const isAdd = form.type === 'ADD'
    const from = isAdd? myId : target.id
    const to = isAdd? target.id : myId

    const res = await fetch('/api/admin/wallet/transfer', {
      method:'POST', credentials:'include',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        fromUserId: from, toUserId: to, amount: form.amount,
        reason: form.reason, notes: form.notes || `${form.type} ${form.amount} - ${form.reason}`,
        orderId: form.orderId || null, triggeredBy: myId
      })
    }).then(r=>r.json())
    if(res.success){ alert('تم التحويل '+res.transferId); search(); }
    else alert(res.error)
  }

  const doCashOut = async()=>{
    if(!target ||!cashForm.amount) return alert('حط مبلغ السحب')
    const res = await fetch('/api/admin/wallet/cash-out', {
      method:'POST', credentials:'include',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        ownerId: target.id, amount: cashForm.amount, method: cashForm.method,
        notes: cashForm.notes, createdBy: myId, orderId: form.orderId || null
      })
    }).then(r=>r.json())
    if(res.success){ alert('تم السحب - رصيدو الجديد: '+formatLBP(res.newBalance)); search(); }
    else alert(res.error)
  }

  if(checking) return <div className="min-h-screen bg-[#0F0F0F] text-white p-6">عم نتأكد من الصلاحية...</div>

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#EAEAEA] p-6">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Andika:wght@400;700&display=swap');`}</style>

      <h1 className="text-3xl font-black tracking-tight" style={{fontFamily:'Andika'}}>البنك - Admin Bank</h1>
      <p className="text-white/40 text-xs mt-2 tracking-widest">انا: {myName} - {myRole} - {myId?.slice(0,8)} • محمي - بس للأدمن</p>

      <div className="bg-[#1A1A1A] border border-white/10 rounded-3xl p-5 mt-6 flex gap-3">
        <input value={filterId} onChange={e=>setFilterId(e.target.value)} placeholder="Owner User ID - سائق/تاجر/عميل" className="flex-1 p-3 rounded-xl bg-[#0F0F0F] border border-white/10 text-white placeholder:text-white/30 focus:border-[#FFD700]/50 outline-none"/>
        <button onClick={search} className="px-6 rounded-xl bg-[#FFD700] text-black font-black hover:bg-[#E6C200]">بحث</button>
      </div>

      {target && (
        <div className="bg-[#1E1E1E] text-white rounded-3xl p-6 mt-4 flex justify-between items-center border border-white/5 shadow-2xl">
          <div>
            <div className="text- opacity-40 tracking-[0.2em]">{target.role} - {target.name}</div>
            <div className="text-3xl font-black mt-2 text-[#FFD700]">{formatLBP(target.balance)}</div>
            <div className="text- text-white/30 mt-1 font-mono">{target.id}</div>
          </div>
          <div className="w-14 h-14 bg-[#FFD700]/10 border border-[#FFD700]/20 rounded-2xl flex items-center justify-center text-xl">💳</div>
        </div>
      )}

      <div className="bg-[#1A1A1A] border border-white/10 rounded-3xl p-5 mt-6">
        <div className="font-black mb-4 text-white/80 text-sm tracking-wide">تحكم - إضافة / خصم</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <select value={form.type} onChange={e=>setForm({...form, type:e.target.value})} className="p-3 rounded-xl bg-[#0F0F0F] border border-white/10 text-white">
            <option value="ADD">ADD - من عندي لعندو</option>
            <option value="DEDUCT">DEDUCT - من عندو لعندي</option>
          </select>
          <select value={form.reason} onChange={e=>setForm({...form, reason:e.target.value})} className="p-3 rounded-xl bg-[#0F0F0F] border border-white/10 text-white">
            <option value="BONUS">BONUS</option><option value="SALARY">SALARY</option><option value="ORDER_COMPLETED">ORDER_COMPLETED</option><option value="TRANSFER_TO_STORE">TRANSFER_TO_STORE</option><option value="OVERPAY">OVERPAY</option><option value="REFUND">REFUND</option>
          </select>
          <input placeholder="المبلغ 50000" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} className="p-3 rounded-xl bg-[#0F0F0F] border border-white/10 text-white placeholder:text-white/30"/>
          <input placeholder="Order ID (اختياري)" value={form.orderId} onChange={e=>setForm({...form, orderId:e.target.value})} className="p-3 rounded-xl bg-[#0F0F0F] border border-white/10 text-white placeholder:text-white/30"/>
          <input placeholder="Notes" value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} className="p-3 rounded-xl bg-[#0F0F0F] border border-white/10 text-white placeholder:text-white/30 col-span-2"/>
        </div>
        <button onClick={doTransfer} className="mt-4 w-full p-3 rounded-xl bg-white text-black font-black hover:bg-white/90">تنفيذ التحويل</button>
      </div>

      <div className="bg-[#1A1A1A] border border-[#FFD700]/20 rounded-3xl p-5 mt-6">
        <div className="font-black mb-4 text-[#FFD700]/80 text-sm tracking-wide">سحب كاش - تسليم يد</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <input placeholder="مبلغ السحب" value={cashForm.amount} onChange={e=>setCashForm({...cashForm, amount:e.target.value})} className="p-3 rounded-xl bg-[#0F0F0F] border border-white/10 text-white placeholder:text-white/30"/>
          <select value={cashForm.method} onChange={e=>setCashForm({...cashForm, method:e.target.value})} className="p-3 rounded-xl bg-[#0F0F0F] border border-white/10 text-white"><option>Cash</option><option>Whish</option><option>OMT</option><option>Bank</option></select>
          <input placeholder="نوت" value={cashForm.notes} onChange={e=>setCashForm({...cashForm, notes:e.target.value})} className="p-3 rounded-xl bg-[#0F0F0F] border border-white/10 text-white placeholder:text-white/30"/>
        </div>
        <button onClick={doCashOut} className="mt-4 w-full p-3 rounded-xl bg-[#FFD700] text-black font-black">سحب كاش</button>
      </div>

      {target && (
        <div className="bg-[#1A1A1A] border border-white/10 rounded-3xl p-5 mt-6">
          <div className="font-black mb-3 text-white/60 text-sm">آخر حركات {target.id.slice(0,8)}</div>
          {loading? <div className="text-white/40">تحميل...</div> : target.tx.map((t,i)=>(
            <div key={i} className="flex justify-between py-2.5 border-b border-white/5 text-sm">
              <div><span className={`px-2 py-1 rounded-full text- font-black ${String(t.Type).toUpperCase()==='ADD'?'bg-green-500/20 text-green-400':'bg-red-500/20 text-red-400'}`}>{t.Type}</span> <span className="ml-2">{formatLBP(t.Amount)}</span> <span className="opacity-40 ml-2">{t.Reason}</span></div>
              <div className="text-xs opacity-30">{t.Notes}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
