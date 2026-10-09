"use client"
export const dynamic = "force-dynamic";
import { useState } from "react"
import { createClient } from "@supabase/supabase-js"
import BackToDashboard from "@/components/BackToDashboard"

export default function MerchantReportPage() {
  const [q, setQ] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [stores, setStores] = useState([])
  const [selectedStore, setSelectedStore] = useState(null)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  const searchStores = async () => {
    if(!q) return
    const { data } = await supabase.from('stores').select('*').or(`"Store ID".ilike.%${q}%,"Store Name".ilike.%${q}%`).limit(20)
    setStores(data||[])
  }

  const generateReport = async (storeId) => {
    if(!storeId) return
    setLoading(true)
    setSelectedStore(storeId)
    
    // 1. جيب كل order_details لهالمتجر
    let detailsQuery = supabase.from('order_details').select('*').eq('Store ID', storeId)
    const { data: details } = await detailsQuery
    if(!details?.length){ setReport({details:[], orders:[], summary:{}}); setLoading(false); return }

    const requestIds = [...new Set(details.map(d=> d['Request ID']))]

    // 2. جيب رؤوس الفواتير من order_requuest + orders_history
    let ordersQuery = supabase.from('order_requuest').select('*').in('Request ID', requestIds)
    if(from) ordersQuery = ordersQuery.gte('Request Date', new Date(from).toISOString())
    if(to) ordersQuery = ordersQuery.lte('Request Date', new Date(to).toISOString() + 'T23:59:59')
    
    const { data: orders } = await ordersQuery.order('Request Date', {ascending:false})
    
    // فلترة التفاصيل حسب الفواتير يلي لقيناها بعد التاريخ
    const validRequestIds = new Set((orders||[]).map(o=> o['Request ID']))
    const filteredDetails = details.filter(d=> validRequestIds.has(d['Request ID']))

    // 3. جيب اسماء المنتجات
    const productIds = [...new Set(filteredDetails.map(d=> d['Product ID']))]
    const { data: products } = await supabase.from('products').select('*').in('Product ID', productIds)
    const pMap = {}; products?.forEach(p=> pMap[p['Product ID']] = p['Products Name'] || p['Product Name'])

    // 4. احسب الملخص
    const totalSales = filteredDetails.reduce((s,d)=> s + (Number(String(d['Line Total']).replace(/,/g,''))||0), 0)
    const totalCommission = filteredDetails.reduce((s,d)=> s + (Number(String(d['Commission Amount']).replace(/,/g,''))||0), 0)
    const totalQty = filteredDetails.reduce((s,d)=> s + (Number(d['Qty'])||0), 0)
    const net = totalSales - totalCommission

    setReport({
      details: filteredDetails,
      orders: orders||[],
      products: pMap,
      summary: { totalSales, totalCommission, net, totalQty, count: orders?.length||0 }
    })
    setLoading(false)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      <BackToDashboard />
      <h1 className="text-2xl font-black mb-6">كشف حساب التاجر - من order_details</h1>

      {/* بحث */}
      <div className="bg-white p-4 rounded-xl border shadow-sm flex gap-3 mb-6">
        <input value={q} onChange={e=> setQ(e.target.value)} placeholder="كود التاجر / Store ID / اسم المتجر" className="flex-1 border p-2 rounded-lg" />
        <button onClick={searchStores} className="bg-black text-white px-6 rounded-lg">بحث</button>
        <input type="date" value={from} onChange={e=> setFrom(e.target.value)} className="border p-2 rounded-lg" />
        <input type="date" value={to} onChange={e=> setTo(e.target.value)} className="border p-2 rounded-lg" />
      </div>

      {stores.length>0 && (
        <div className="bg-white p-3 rounded-xl border mb-6 grid grid-cols-4 gap-2">
          {stores.map(s=> (
            <button key={s['Store ID']} onClick={()=> generateReport(s['Store ID'])} className={`p-3 rounded-lg border text-right hover:bg-yellow-50 ${selectedStore===s['Store ID']?'bg-yellow-400 font-bold':''}`}>
              <div className="font-bold">{s['Store Name']}</div>
              <div className="text-xs text-gray-500">{s['Store ID']}</div>
            </button>
          ))}
        </div>
      )}

      {loading && <div className="text-center py-10">جاري التحميل...</div>}

      {report && (
        <>
          {/* ملخص */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border"><div className="text-xs text-gray-400">عدد الفواتير</div><div className="font-black text-xl">{report.summary.count}</div></div>
            <div className="bg-white p-4 rounded-xl border"><div className="text-xs text-gray-400">اجمالي المبيعات</div><div className="font-black text-xl">{report.summary.totalSales.toLocaleString()} ل.ل</div></div>
            <div className="bg-white p-4 rounded-xl border"><div className="text-xs text-gray-400">عمولتنا</div><div className="font-bold text-red-600">{report.summary.totalCommission.toLocaleString()} ل.ل</div></div>
            <div className="bg-black text-white p-4 rounded-xl"><div className="text-xs text-gray-400">الصافي للتاجر</div><div className="font-black text-xl text-yellow-400">{report.summary.net.toLocaleString()} ل.ل</div></div>
          </div>

          {/* تفاصيل */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-400"><tr><th className="p-3 text-right">التاريخ من Request Date</th><th className="p-3">رقم الطلب</th><th className="p-3">المنتج</th><th className="p-3">الكمية</th><th className="p-3">المجموع</th><th className="p-3">العمولة</th><th className="p-3">الصافي</th></tr></thead>
              <tbody>
                {report.details.map((d,i)=>{
                  const order = report.orders.find(o=> o['Request ID']===d['Request ID'])
                  const pName = report.products[d['Product ID']]||d['Product ID']
                  const lineTotal = Number(String(d['Line Total']).replace(/,/g,''))||0
                  const comm = Number(String(d['Commission Amount']).replace(/,/g,''))||0
                  return (
                    <tr key={i} className="border-b">
                      <td className="p-2 text-xs">{order?.['Request Date']?.slice(0,10) || order?.['Cerated Date'] || '-'}</td>
                      <td className="p-2 font-mono text-xs">{String(d['Request ID']).slice(0,8)}</td>
                      <td className="p-2">{pName}</td>
                      <td className="p-2 text-center">{d['Qty']}</td>
                      <td className="p-2">{lineTotal.toLocaleString()}</td>
                      <td className="p-2 text-red-500">{comm.toLocaleString()}</td>
                      <td className="p-2 font-bold">{(lineTotal-comm).toLocaleString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <button onClick={()=> window.print()} className="mt-4 bg-yellow-400 px-6 py-2 rounded-full font-black">طباعة كشف الحساب</button>
        </>
      )}
    </div>
  )
}
