"use client"
export const dynamic = "force-dynamic"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

export default function AdminBank(){
  const [myId, setMyId] = useState('')
  const [myName, setMyName] = useState('')
  const [filterId, setFilterId] = useState('c37302f0-1ab6-4d47-b6b4-38c4a7fcfbf8')
  const [target, setTarget] = useState(null) // { role, balance, tx }
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({ type:'ADD', reason:'BONUS', amount:'', orderId:'', notes:'' })
  const [cashForm, setCashForm] = useState({ amount:'', method:'Cash', notes:'' })

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  useEffect(()=>{ init() },[])
  const init = async()=>{
    const sess = await fetch('/api/admin/me', {credentials:'include'}).then(r=>r.json())
    const email = sess.email
    const { data: u } = await supabase.from('users').select('*').eq('Email', email).maybeSingle()
    if(u){
      setMyId(u['User ID'] || u['ID'])
      setMyName(u.Name)
    }
  }

  const formatLBP = (n)=>{
    const num = Number(String(n).replace(/,/g,''))||0
    return new Intl.NumberFormat('en-LB').format(num)+' ل.ل'
  }

  const search = async()=>{
    if(!filterId) return
    setLoading(true)
    const res = await fetch(`/api/wallet/me?userId=${filterId}`).then(r=>r.json())
    if(res.success){
      const { data: u } = await supabase.from('users').select('Role, Name').eq('User ID', filterId).maybeSingle()
      setTarget({ id:filterId, role:u?.Role||'Driver', name:u?.Name||'', balance:res.wallet, tx:res.transactions||[] })
    }
    setLoading(false)
  }

  const doTransfer = async()=>{
    if(!target ||!form.amount) return alert('حط المبلغ')
    const isAdd = form.type === 'ADD'
    // ADD = مني لعندو, DEDUCT = من عندو لعندي
    const from = isAdd? myId : target.id
    const to = isAdd? target.id : myId

    const res = await fetch('/api/admin/wallet/transfer', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        fromUserId: from,
        toUserId: to,
        amount: form.amount,
        reason: form.reason,
        notes: form.notes || `${form.type} ${form.amount} - ${form.reason} - ${form.orderId||''}`,
        orderId: form.orderId || null,
        triggeredBy: myId
      })
    }).then(r=>r.json())
    if(res.success){ alert('تم التحويل '+res.transferId); search(); }
    else alert(res.error)
  }

  const doCashOut = async()=>{
    if(!target ||!cashForm.amount) return alert('حط مبلغ السحب')
    const res = await fetch('/api/admin/wallet/cash-out', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        ownerId: target.id,
        amount: cashForm.amount,
        method: cashForm.method,
        notes: cashForm.notes || `سحب كاش ${cashForm.amount} - تسليم يد`,
        createdBy: myId,
        orderId: form.orderId || null
      })
    }).then(r=>r.json())
    if(res.success){ alert('تم السحب - رصيدو الجديد: '+formatLBP(res.newBalance)); search(); }
    else alert(res.error)
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-[#0A0A0A] p-6">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Andika:wght@400;700&display=swap');`}</style>

      <h1 className="text-3xl font-black" style={{fontFamily:'Andika'}}>البنك - Admin Wallet</h1>
      <p className="text-black/50 text-sm mt-1">انا: {myName} - {myId?.slice(0,8)}</p>

      {/* فلتر */}
      <div className="bg-white border border-black/10 rounded-3xl p-5 mt-6 flex gap-3">
        <input value={filterId} onChange={e=>setFilterId(e.target.value)} placeholder="Owner User ID - سائق/تاجر/عميل" className="flex-1 p-3 rounded-xl border border-black/10"/>
        <button onClick={search} className="px-6 rounded-xl bg-black text-white font-black">بحث</button>
      </div>

      {target && (
        <div className="bg-[#0A0A0A] text-white rounded-3xl p-6 mt-4 flex justify-between items-center border border-[#FFD700]/20">
          <div>
            <div className="text-xs opacity-50 tracking-widest">{target.role} - {target.name}</div>
            <div className="text-3xl font-black mt-2">{formatLBP(target.balance)}</div>
            <div className="text-xs text-[#FFD700] mt-1">{target.id}</div>
          </div>
          <div className="w-14 h-14 bg-[#FFD700] rounded-2xl flex items-center justify-center text-xl">💳</div>
        </div>
      )}

      {/* قسم ADD / DEDUCT */}
      <div className="bg-white border border-black/10 rounded-3xl p-5 mt-6">
        <div className="font-black mb-3">تحكم - إضافة / خصم (مبلغ + ADD/حسم + نوت)</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <select value={form.type} onChange={e=>setForm({...form, type:e.target.value})} className="p-3 rounded-xl border">
            <option value="ADD">ADD - إضافة عندو - من عندي</option>
            <option value="DEDUCT">DEDUCT - خصم من عندو + عندي</option>
          </select>
          <select value={form.reason} onChange={e=>setForm({...form, reason:e.target.value})} className="p-3 rounded-xl border">
            <option value="BONUS">BONUS</option>
            <option value="SALARY">SALARY</option>
            <option value="ORDER_COMPLETED">ORDER_COMPLETED</option>
            <option value="TRANSFER_TO_STORE">TRANSFER_TO_STORE</option>
            <option value="OVERPAY">OVERPAY</option>
            <option value="REFUND">REFUND</option>
          </select>
          <input placeholder="المبلغ 50000" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} className="p-3 rounded-xl border"/>
          <input placeholder="Order ID (اختياري) e9f77251" value={form.orderId} onChange={e=>setForm({...form, orderId:e.target.value})} className="p-3 rounded-xl border"/>
          <input placeholder="Notes - مبلغ + ADD/حسم + سبب" value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} className="p-3 rounded-xl border col-span-2"/>
        </div>
        <button onClick={doTransfer} className="mt-4 w-full p-3 rounded-xl bg-black text-white font-black">تنفيذ التحويل</button>
        <p className="text- opacity-50 mt-2">ADD = Owner +Amount (Target) / DEDUCT منك - DEDUCT = العكس - نفس Transfer ID</p>
      </div>

      {/* قسم سحب كاش */}
      <div className="bg-[#fffbe6] border border-[#FFD700]/30 rounded-3xl p-5 mt-6">
        <div className="font-black mb-3">سحب كاش - تعطيه بإيدو - بيسحب من محفظتو وبيكب ع cash_payouts</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <input placeholder="مبلغ السحب" value={cashForm.amount} onChange={e=>setCashForm({...cashForm, amount:e.target.value})} className="p-3 rounded-xl border"/>
          <select value={cashForm.method} onChange={e=>setCashForm({...cashForm, method:e.target.value})} className="p-3 rounded-xl border">
            <option>Cash</option><option>Whish</option><option>OMT</option><option>Bank</option>
          </select>
          <input placeholder="نوت - سحب كاش عن..." value={cashForm.notes} onChange={e=>setCashForm({...cashForm, notes:e.target.value})} className="p-3 rounded-xl border"/>
        </div>
        <button onClick={doCashOut} className="mt-4 w-full p-3 rounded-xl bg-[#FFD700] text-black font-black">سحب كاش - CASH_OUT + cash_payouts</button>
      </div>

      {/* الحركات */}
      {target && (
        <div className="bg-white border border-black/10 rounded-3xl p-5 mt-6">
          <div className="font-black mb-3">آخر حركات {target.id.slice(0,8)} - مبلغ + ADD/حسم + نوت</div>
          {loading? <div>تحميل...</div> : target.tx.map((t,i)=>(
            <div key={i} className="flex justify-between py-2 border-b border-black/5 text-sm">
              <div><span className={`px-2 py-1 rounded-full text-xs font-black ${String(t.Type).toUpperCase()==='ADD'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{t.Type}</span> {formatLBP(t.Amount)} - {t.Reason}</div>
              <div className="text-xs opacity-60">{t.Notes}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
