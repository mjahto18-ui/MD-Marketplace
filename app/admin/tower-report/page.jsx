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
  const [selectedManager, setSelectedManager] = useState("")
  const [sourceType, setSourceType] = useState("all") // all / taxi / cart / bot
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  const searchCenters = async () => {
    const { data } = await supabase.from('geofence_centers').select('*').ilike('name', `%${qCenter}%`).limit(20)
    setCenters(data||[])
  }

  const loadManagers = async (centerId) => {
    setSelectedCenter(centerId)
    const { data } = await supabase.from('geofence_center_managers').select('*, manager:manager_user_id(email)').eq('geofence_center_id', centerId).eq('is_active', true)
    setManagers(data||[])
  }

  const generate = async () => {
    if(!selectedCenter) return alert("اختار برج")
    setLoading(true)
    let query = supabase.from('geofence_archive').select('*').eq('geofence_center_id', selectedCenter)
    if(selectedManager) query = query.eq('manager_user_id', selectedManager)
    if(sourceType !== 'all') query = query.eq('source_type', sourceType)
    if(from) query = query.gte('order_date', new Date(from).toISOString())
    if(to){ const d=new Date(to); d.setHours(23,59,59,999); query=query.lte('order_date', d.toISOString()) }
    
    const { data } = await query.order('order_date', {ascending:false}).limit(1000)
    
    const totalOrders = data?.length||0
    const totalAmount = data?.reduce((s,r)=> s + Number(r.order_total_calc||0),0)||0
    const totalCommission = data?.reduce((s,r)=> s + Number(r.platform_commission_calc||0),0)||0
    const totalManager = data?.reduce((s,r)=> s + Number(r.manager_commission||0),0)||0

    setReport({ rows: data||[], summary:{ totalOrders, totalAmount, totalCommission, totalManager } })
    setLoading(false)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <BackToDashboard />
      <h1 className="text-2xl font-black mb-6">كشف حساب مسؤولين الابراج - geofence_archive</h1>

      <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-wrap gap-3 mb-6 items-end">
        <div className="flex gap-2">
          <input value={qCenter} onChange={e=> setQCenter(e.target.value)} placeholder="اسم البرج" className="border p-2 rounded-lg w-48" />
          <button onClick={searchCenters} className="bg-black text-white px-4 rounded-lg">بحث برج</button>
        </div>

        <select value={selectedCenter} onChange={e=> loadManagers(e.target.value)} className="border p-2 rounded-lg min-w-">
          <option value="">اختار البرج</option>
          {centers.map(c=> <option key={c.id} value={c.id}>{c.name} - {c.id.slice(0,6)}</option>)}
        </select>

        <select value={selectedManager} onChange={e=> setSelectedManager(e.target.value)} className="border p-2 rounded-lg">
          <option value="">كل المسؤولين</option>
          {managers.map(m=> <option key={m.manager_user_id} value={m.manager_user_id}>{m.manager_user_id.slice(0,8)} - {m.service_type}</option>)}
        </select>

        <select value={sourceType} onChange={e=> setSourceType(e.target.value)} className="border p-2 rounded-lg">
          <option value="all">كل الخدمات</option>
          <option value="taxi">taxi فقط</option>
          <option value="cart">cart / ماركت فقط</option>
          <option value="bot">bot</option>
        </select>

        <div className="flex items-center gap-1"><span className="text-sm font-bold">من:</span><input type="date" value={from} onChange={e=> setFrom(e.target.value)} className="border p-2 rounded-lg" /></div>
        <div className="flex items-center gap-1"><span className="text-sm font-bold">الى:</span><input type="date" value={to} onChange={e=> setTo(e.target.value)} className="border p-2 rounded-lg" /></div>
        
        <button onClick={generate} className="bg-yellow-400 px-6 py-2 rounded-full font-black">توليد الكشف</button>
      </div>

      {loading && <div className="text-center py-10">جاري التحميل...</div>}

      {report && (
        <>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border"><div className="text-xs text-gray-400">عدد الاوردرات ({sourceType})</div><div className="font-black text-xl">{report.summary.totalOrders}</div></div>
            <div className="bg-white p-4 rounded-xl border"><div className="text-xs text-gray-400">اجمالي المبالغ</div><div className="font-black">{report.summary.totalAmount.toLocaleString()} ل.ل</div></div>
            <div className="bg-white p-4 rounded-xl border"><div className="text-xs text-gray-400">عمولتنا</div><div className="font-bold text-red-600">{report.summary.totalCommission.toLocaleString()}</div></div>
            <div className="bg-black text-white p-4 rounded-xl"><div className="text-xs">حصة المسؤول 30%</div><div className="font-black text-xl text-yellow-400">{report.summary.totalManager.toLocaleString()} ل.ل</div></div>
          </div>

          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-400"><tr><th className="p-2">#</th><th className="p-2">التاريخ order_date</th><th className="p-2">source_type</th><th className="p-2">رقم الاوردر</th><th className="p-2">الزبون</th><th className="p-2">المبلغ</th><th className="p-2">عمولتنا</th><th className="p-2">حصة المسؤول 30%</th></tr></thead>
              <tbody>
                {report.rows.map((r,i)=>(
                  <tr key={r.id} className="border-b">
                    <td className="p-2 bg-gray-50 text-center font-bold">{i+1}</td>
                    <td className="p-2 text-xs">{new Date(r.order_date).toLocaleString('en-GB')}</td>
                    <td className="p-2"><span className={`px-2 py-1 rounded-full text-xs ${r.source_type==='taxi'?'bg-blue-100 text-blue-700':'bg-green-100 text-green-700'}`}>{r.source_type}</span></td>
                    <td className="p-2 font-mono text-xs">{String(r.source_order_id).slice(0,8)}</td>
                    <td className="p-2">{r.customer_name||r.customer_phone||'-'}</td>
                    <td className="p-2">{Number(r.order_total_calc||0).toLocaleString()}</td>
                    <td className="p-2 text-red-500">{Number(r.platform_commission_calc||0).toLocaleString()}</td>
                    <td className="p-2 font-bold bg-yellow-50">{Number(r.manager_commission||0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-black text-white font-black"><tr><td colSpan={5} className="p-3">المجموع اخر الفاتورة:</td><td className="p-3">{report.summary.totalAmount.toLocaleString()}</td><td className="p-3 text-red-400">{report.summary.totalCommission.toLocaleString()}</td><td className="p-3 text-yellow-400">{report.summary.totalManager.toLocaleString()}</td></tr></tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
