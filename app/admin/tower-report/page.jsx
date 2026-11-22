"use client"
export const dynamic = "force-dynamic";
import { useState } from "react"
import { createClient } from "@supabase/supabase-js"
import BackToDashboard from "@/components/BackToDashboard"

export default function TowerReportPage() {
  const [centers, setCenters] = useState([])
  const [managers, setManagers] = useState([])
  const [qCenter, setQCenter] = useState("")
  const [selectedCenter, setSelectedCenter] = useState("")
  const [selectedCenterName, setSelectedCenterName] = useState("")
  const [selectedManager, setSelectedManager] = useState("")
  const [sourceType, setSourceType] = useState("all")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)

  // --- الجديد: الدفعات ---
  const [payouts, setPayouts] = useState([])
  const [payAmount, setPayAmount] = useState("")
  const [payNotes, setPayNotes] = useState("")
  const [paying, setPaying] = useState(false)

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  const searchCenters = async () => {
    const { data } = await supabase.from('geofence_centers').select('*').ilike('name', `%${qCenter}%`).limit(20)
    setCenters(data||[])
  }

  const loadManagers = async (centerId) => {
    setSelectedCenter(centerId)
    const center = centers.find(c=> c.id===centerId)
    setSelectedCenterName(center?.name || "")
    
    const { data: mgrs } = await supabase.from('geofence_center_managers').select('*').eq('geofence_center_id', centerId).eq('is_active', true)
    if(!mgrs?.length){ setManagers([]); return }
    
    const ids = mgrs.map(m=> m.manager_user_id)
    let usersMap = {}
    try {
      const { data: users } = await supabase.from('users').select('*').in('id', ids)
      users?.forEach(u=> usersMap[u.id] = u.Name || u.full_name || u.name || u.email)
    } catch {}
    try {
      const { data: users2 } = await supabase.from('profiles').select('id, full_name').in('id', ids)
      users2?.forEach(u=> { if(!usersMap[u.id]) usersMap[u.id] = u.full_name })
    } catch {}

    setManagers(mgrs.map(m=> ({ ...m, manager_name: usersMap[m.manager_user_id] || m.manager_user_id.slice(0,8) })))
  }

  const generate = async () => {
    if(!selectedCenter) return alert("اختار برج")
    setLoading(true)
    let query = supabase.from('geofence_archive').select('*').eq('geofence_center_id', selectedCenter)
    if(selectedManager) query = query.eq('manager_user_id', selectedManager)
    if(sourceType !== 'all') query = query.eq('source_type', sourceType)
    if(from) query = query.gte('order_date', new Date(from).toISOString())
    if(to){ const d=new Date(to); d.setHours(23,59,59,999); query=query.lte('order_date', d.toISOString()) }
    const { data } = await query.order('order_date', {ascending:false}).limit(2000)
    const totalOrders = data?.length||0
    const totalAmount = data?.reduce((s,r)=> s + Number(r.order_total_calc||0),0)||0
    const totalCommission = data?.reduce((s,r)=> s + Number(r.platform_commission_calc||0),0)||0
    const totalManager = data?.reduce((s,r)=> s + Number(r.manager_commission||0),0)||0

    // --- الجديد: جيب الدفعات تبع نفس البرج + المسؤول + نفس الفترة ---
    let payoutQuery = supabase.from('tower_manager_payouts').select('*').eq('geofence_center_id', selectedCenter)
    if(selectedManager) payoutQuery = payoutQuery.eq('manager_user_id', selectedManager)
    // الدفعة بتنحسب على الفترة يلي دفعت عنها - مش على تاريخ الدفع
    // يعني اذا اخترت من 1-11 الى 30-11 - بيجيب الدفعات يلي period تبعن جوات هالفترة
    if(from) payoutQuery = payoutQuery.gte('period_start', new Date(from).toISOString())
    if(to){ const d=new Date(to); d.setHours(23,59,59,999); payoutQuery = payoutQuery.lte('period_end', d.toISOString()) }
    const { data: payoutsData } = await payoutQuery.order('paid_at', {ascending:false})
    setPayouts(payoutsData || [])

    const totalPaid = (payoutsData||[]).reduce((s,r)=> s + Number(r.amount_paid||0),0)||0
    const remaining = totalManager - totalPaid

    setReport({ rows: data||[], summary:{ totalOrders, totalAmount, totalCommission, totalManager, totalPaid, remaining } })
    setPayAmount(String(remaining > 0 ? remaining : 0))
    setLoading(false)
  }

  // --- الجديد: تنفيذ الدفع ---
  const doPay = async () => {
    if(!selectedCenter || !selectedManager) return alert("اختار برج ومسؤول اول")
    if(!payAmount || Number(payAmount) <= 0) return alert("حط المبلغ")
    if(!from || !to) return alert("اختار من / الى - مشان نعرف عن اي فترة عم تدفع")
    const mgrName = managers.find(m=> m.manager_user_id===selectedManager)?.manager_name || 'المسؤول'
    if(!confirm(`متأكد بدك تدفع ${Number(payAmount).toLocaleString()} لـ ${mgrName} ؟\nعن فترة ${from} الى ${to}`)) return

    setPaying(true)
    const { error } = await supabase.from('tower_manager_payouts').insert([{
      manager_user_id: selectedManager,
      geofence_center_id: selectedCenter,
      period_start: new Date(from).toISOString(),
      period_end: (()=>{ const d=new Date(to); d.setHours(23,59,59,999); return d.toISOString() })(),
      total_commission: report?.summary?.totalManager || 0,
      amount_paid: Number(payAmount),
      paid_by: 'Admin',
      notes: payNotes || `دفعة ${from} الى ${to}`
    }])
    setPaying(false)
    if(error) return alert("خطأ: " + error.message)
    alert("تم الدفع - تصفرت المحفظة لهالفترة")
    setPayNotes("")
    generate()
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <BackToDashboard />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black">كشف {selectedCenterName || 'الابراج'} - {selectedCenter.slice(0,6)}</h1>
        {report && <button onClick={()=> window.print()} className="bg-black text-white px-6 py-2 rounded-full print:hidden">طباعة</button>}
      </div>

      <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-wrap gap-3 mb-6 items-end print:hidden">
        <div className="flex gap-2">
          <input value={qCenter} onChange={e=> setQCenter(e.target.value)} placeholder="اسم البرج / كود البرج" className="border p-2 rounded-lg w-48" />
          <button onClick={searchCenters} className="bg-black text-white px-4 rounded-lg">بحث</button>
        </div>

        <select value={selectedCenter} onChange={e=> loadManagers(e.target.value)} className="border p-2 rounded-lg min-w-">
          <option value="">اختار البرج - ID البرج</option>
          {centers.map(c=> <option key={c.id} value={c.id}>{c.name} | ID:{c.id.slice(0,6)} | كود:{c.code||'-'}</option>)}
        </select>

        <select value={selectedManager} onChange={e=> setSelectedManager(e.target.value)} className="border p-2 rounded-lg min-w-">
          <option value="">كل المسؤولين - اسم صاحب البرج</option>
          {managers.map(m=> <option key={m.manager_user_id} value={m.manager_user_id}>{m.manager_name} | {m.service_type} | {m.manager_user_id.slice(0,6)}</option>)}
        </select>

        <select value={sourceType} onChange={e=> setSourceType(e.target.value)} className="border p-2 rounded-lg">
          <option value="all">الكل</option>
          <option value="taxi">taxi فقط</option>
          <option value="cart">cart فقط</option>
          <option value="bot">bot</option>
        </select>

        <div className="flex items-center gap-1"><span className="text-sm font-bold">من:</span><input type="date" value={from} onChange={e=> setFrom(e.target.value)} className="border p-2 rounded-lg" /></div>
        <div className="flex items-center gap-1"><span className="text-sm font-bold">الى:</span><input type="date" value={to} onChange={e=> setTo(e.target.value)} className="border p-2 rounded-lg" /></div>
        <button onClick={generate} disabled={loading} className="bg-yellow-400 px-6 py-2 rounded-full font-black disabled:opacity-50">{loading ? 'جاري...' : 'توليد'}</button>
      </div>

      {report && (
        <>
          {/* --- الكروت - صارو 5 - ضفنا اندفع + باقي --- */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border"><div className="text-xs">عدد ({sourceType}) للبرج {selectedCenterName}</div><div className="font-black text-xl">{report.summary.totalOrders}</div><div className="text-">ID: {selectedCenter.slice(0,8)}</div></div>
            <div className="bg-white p-4 rounded-xl border"><div className="text-xs">اجمالي</div><div className="font-black">{report.summary.totalAmount.toLocaleString()}</div></div>
            <div className="bg-black text-white p-4 rounded-xl"><div className="text-xs">اشتغل - حصة {managers.find(m=> m.manager_user_id===selectedManager)?.manager_name || 'المسؤول'} 30%</div><div className="font-black text-xl text-yellow-400">{report.summary.totalManager.toLocaleString()}</div></div>
            <div className="bg-white p-4 rounded-xl border"><div className="text-xs">اندفعلو قبل - بنفس الفترة</div><div className="font-bold text-green-600 text-xl">{report.summary.totalPaid.toLocaleString()}</div></div>
            <div className="bg-yellow-400 p-4 rounded-xl"><div className="text-xs">باقيلو - هيدا يلي بدك تدفعو</div><div className="font-black text-xl">{report.summary.remaining.toLocaleString()}</div></div>
          </div>

          {/* --- فورم الدفع --- */}
          {selectedManager && (
            <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-wrap gap-3 mb-6 items-end print:hidden">
              <div><span className="text-sm font-bold">المبلغ للدفع:</span><input type="number" value={payAmount} onChange={e=> setPayAmount(e.target.value)} className="border p-2 rounded-lg w-40 mr-2" /></div>
              <div><span className="text-sm font-bold">ملاحظة:</span><input value={payNotes} onChange={e=> setPayNotes(e.target.value)} placeholder="كاش / تحويل" className="border p-2 rounded-lg w-48 mr-2" /></div>
              <button onClick={doPay} disabled={paying || Number(payAmount) <= 0} className="bg-green-600 text-white px-6 py-2 rounded-full font-black disabled:opacity-50">{paying ? 'جاري الدفع...' : 'تأكيد الدفع - تصفير'}</button>
              <span className="text-xs text-gray-500">بس تدفع - بينزل سطر بسجل الدفعات - والباقي بيصير 0 - بس الطلبات ما بينمحو</span>
            </div>
          )}

          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr><th className="p-2">#</th><th className="p-2">التاريخ</th><th className="p-2">البرج + ID</th><th className="p-2">صاحب البرج</th><th className="p-2">النوع</th><th className="p-2">رقم الاوردر</th><th className="p-2">الزبون</th><th className="p-2">المبلغ</th><th className="p-2">حصة المسؤول</th></tr></thead>
              <tbody>
                {report.rows.map((r,i)=>(
                  <tr key={r.id} className="border-b">
                    <td className="p-2 bg-gray-50 text-center font-bold">{i+1}</td>
                    <td className="p-2 text-xs">{new Date(r.order_date).toLocaleString('en-GB')}</td>
                    <td className="p-2 text-xs">{selectedCenterName} - {r.geofence_center_id.slice(0,6)}</td>
                    <td className="p-2 font-bold">{managers.find(m=> m.manager_user_id===r.manager_user_id)?.manager_name || r.manager_user_id.slice(0,8)}</td>
                    <td className="p-2"><span className={`px-2 py-1 rounded-full text-xs ${r.source_type==='taxi'?'bg-blue-100 text-blue-700':'bg-green-100 text-green-700'}`}>{r.source_type}</span></td>
                    <td className="p-2 font-mono text-xs">{r.source_order_id}</td>
                    <td className="p-2">{r.customer_name||r.customer_phone||'-'}</td>
                    <td className="p-2">{Number(r.order_total_calc||0).toLocaleString()}</td>
                    <td className="p-2 font-bold bg-yellow-50">{Number(r.manager_commission||0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-black text-white font-black"><tr><td colSpan={7} className="p-3">المجموع اخر الفاتورة - {selectedCenterName} - من {from} الى {to}</td><td className="p-3">{report.summary.totalAmount.toLocaleString()}</td><td className="p-3 text-yellow-400">{report.summary.totalManager.toLocaleString()}</td></tr></tfoot>
            </table>
          </div>

          {/* --- سجل الدفعات --- */}
          {payouts.length > 0 && (
            <div className="bg-white rounded-xl border overflow-hidden mt-6">
              <div className="p-3 font-black bg-gray-50">سجل الدفعات - هيدا يلي بيخلي المحفظة تصفر بلا محي</div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr><th className="p-2">تاريخ الدفع</th><th className="p-2">من</th><th className="p-2">الى</th><th className="p-2">اجمالي الفترة</th><th className="p-2">المبلغ المدفوع</th><th className="p-2">ملاحظة</th></tr></thead>
                <tbody>
                  {payouts.map(p=>(
                    <tr key={p.id} className="border-b">
                      <td className="p-2">{new Date(p.paid_at).toLocaleString('en-GB')}</td>
                      <td className="p-2">{p.period_start ? new Date(p.period_start).toLocaleDateString('en-GB') : '-'}</td>
                      <td className="p-2">{p.period_end ? new Date(p.period_end).toLocaleDateString('en-GB') : '-'}</td>
                      <td className="p-2">{Number(p.total_commission||0).toLocaleString()}</td>
                      <td className="p-2 font-bold text-green-600">{Number(p.amount_paid||0).toLocaleString()}</td>
                      <td className="p-2">{p.notes||'-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
