"use client"
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import BackToDashboard from "@/components/BackToDashboard"

export default function PendingOverpayPage() {
  const [all, setAll] = useState([])
  const [filter, setFilter] = useState('Pending')
  const [loading, setLoading] = useState(true)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const fetchData = async () => {
    setLoading(true)
    const { data } = await supabase.from('pending_overpay').select('*').order('Created At', { ascending: false })
    setAll(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const pendingCount = all.filter(r => r['Status'] === 'Pending').length
  const transferredCount = all.filter(r => r['Status'] === 'Transferred').length

  const filtered = all.filter(r => {
    if (filter === 'Pending') return r['Status'] === 'Pending'
    if (filter === 'Transferred') return r['Status'] === 'Transferred'
    return true
  })

  if (loading) return <div className="p-6">جاري التحميل...</div>

  return (
    <div className="p-6">
      <BackToDashboard />
      <h1 className="text-2xl font-bold mb-6">متابعة المصاري العلقانة</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div onClick={() => setFilter('Pending')} className={`cursor-pointer p-5 rounded-lg shadow border-2 ${filter==='Pending'? 'border-orange-500 bg-orange-50' : 'bg-white'}`}>
          <div className="text-sm text-gray-500">Pending</div>
          <div className="text-3xl font-bold text-orange-600">{pendingCount}</div>
          <div className="text-xs">علقانة بدها متابعة</div>
        </div>
        <div onClick={() => setFilter('Transferred')} className={`cursor-pointer p-5 rounded-lg shadow border-2 ${filter==='Transferred'? 'border-green-500 bg-green-50' : 'bg-white'}`}>
          <div className="text-sm text-gray-500">Transferred</div>
          <div className="text-3xl font-bold text-green-600">{transferredCount}</div>
          <div className="text-xs">تم حلها</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-xs uppercase">
            <tr>
              <th className="p-3">Request</th>
              <th className="p-3">الزبون</th>
              <th className="p-3">المبلغ العلقان</th>
              <th className="p-3">الحالة</th>
              <th className="p-3">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r['Pending ID']} className={`border-b border-l-4 ${r['Status']==='Pending'?'border-l-orange-400':'border-l-green-500'}`}>
                <td className="p-3 font-mono text-xs">{r['Request ID'].slice(0,10)}</td>
                <td className="p-3"><div className="font-bold">{r['Name']}</div><div className="text-xs text-gray-500">{r['Mobile']}</div></td>
                <td className="p-3"><div>Total: {r['Total Amount']}</div><div className="text-xs">Collect: {r['Collect Amount']}</div><div className="font-bold text-orange-600">Net: {r['Net']}</div></td>
                <td className="p-3"><span className={`text-xs px-2 py-1 rounded ${r['Status']==='Pending'?'bg-orange-100 text-orange-800':'bg-green-100 text-green-800'}`}>{r['Status']}</span></td>
                <td className="p-3 text-xs text-gray-400">{r['Created At']?.slice(0,16)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="p-6 text-center text-gray-500">ما في</p>}
      </div>
    </div>
  )
}
