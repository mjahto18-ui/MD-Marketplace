"use client"
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import BackToDashboard from "@/components/BackToDashboard"

export default function ProtectionPage() {
  const [allCases, setAllCases] = useState([])
  const [filter, setFilter] = useState('Pending') // Pending | Under Review | Others
  const [loading, setLoading] = useState(true)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const fetchCases = async () => {
    setLoading(true)
    const { data } = await supabase.from('protection_cases').select('*').order('Created Date', { ascending: false })
    setAllCases(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchCases() }, [])

  const pendingCount = allCases.filter(c => c['Status'] === 'Pending').length
  const underReviewCount = allCases.filter(c => c['Status'] === 'Under Review').length
  const othersCount = allCases.filter(c =>!['Pending','Under Review'].includes(c['Status'])).length

  const filteredCases = allCases.filter(c => {
    if (filter === 'Pending') return c['Status'] === 'Pending'
    if (filter === 'Under Review') return c['Status'] === 'Under Review'
    if (filter === 'Others') return!['Pending','Under Review'].includes(c['Status'])
    return true
  })

  const getBorderColor = (status) => {
    if (status === 'Pending') return 'border-l-yellow-400'
    if (status === 'Under Review') return 'border-l-yellow-600'
    if (status === 'Waiting Customer' || status === 'Waiting Store') return 'border-l-blue-500'
    if (status === 'Approved_Case' || status === 'Refunded') return 'border-l-green-500'
    if (status === 'Rejected_Case') return 'border-l-red-500'
    if (status === 'Closed') return 'border-l-gray-400'
    return 'border-l-gray-200'
  }

  const getStatusBadge = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Under Review': 'bg-yellow-200 text-yellow-900',
      'Waiting Customer': 'bg-blue-100 text-blue-800',
      'Waiting Store': 'bg-blue-100 text-blue-800',
      'Approved_Case': 'bg-green-100 text-green-800',
      'Refunded': 'bg-green-100 text-green-800',
      'Rejected_Case': 'bg-red-100 text-red-800',
      'Closed': 'bg-gray-200 text-gray-700'
    }
    return colors[status] || 'bg-gray-100'
  }

  const makeUnderReview = async (caseId) => {
    await supabase.from('protection_cases').update({ Status: 'Under Review' }).eq('Case ID', caseId)
    setAllCases(prev => prev.map(c => c['Case ID'] === caseId? {...c, Status: 'Under Review' } : c))
  }

  if (loading) return <div className="p-6">جاري التحميل...</div>

  return (
    <div className="p-6">
      <BackToDashboard />
      <h1 className="text-2xl font-bold mb-6">Protection Cases</h1>

      {/* البوكسات فوق */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div onClick={() => setFilter('Pending')} className={`cursor-pointer p-4 rounded-lg shadow border-2 ${filter==='Pending'? 'border-yellow-500 bg-yellow-50' : 'bg-white border-transparent'} `}>
          <div className="text-sm text-gray-500">Pending</div>
          <div className="text-3xl font-bold">{pendingCount}</div>
          <div className="text-xs mt-1">حالات جديدة بدها استلام</div>
        </div>
        <div onClick={() => setFilter('Under Review')} className={`cursor-pointer p-4 rounded-lg shadow border-2 ${filter==='Under Review'? 'border-yellow-700 bg-yellow-50' : 'bg-white border-transparent'} `}>
          <div className="text-sm text-gray-500">Under Review</div>
          <div className="text-3xl font-bold">{underReviewCount}</div>
          <div className="text-xs mt-1">شغلي الحالي</div>
        </div>
        <div onClick={() => setFilter('Others')} className={`cursor-pointer p-4 rounded-lg shadow border-2 ${filter==='Others'? 'border-blue-500 bg-blue-50' : 'bg-white border-transparent'} `}>
          <div className="text-sm text-gray-500">باقي الحالات</div>
          <div className="text-3xl font-bold">{othersCount}</div>
          <div className="text-xs mt-1">Waiting / Approved / Closed</div>
        </div>
      </div>

      {/* الليستة */}
      <div className="grid gap-3">
        {filteredCases.map(c => (
          <div key={c['Case ID']} className={`bg-white p-4 rounded-lg shadow border border-l-4 ${getBorderColor(c['Status'])} flex justify-between items-center`}>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">#{c['Order ID']?.slice(0,8) || '-'}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${getStatusBadge(c['Status'])}`}>{c['Status']}</span>
                {c['Decision'] && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{c['Decision']}</span>}
                {c['Responsible'] && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{c['Responsible']}</span>}
              </div>
              <div className="text-sm mt-1 text-gray-700 truncate max-w-">{c['Description'] || 'بدون وصف'}</div>
              <div className="text-xs text-gray-400 mt-1">
                Case: {c['Case ID'].slice(0,8)} | Customer: {c['Customer ID']?.slice(0,6)} | Refund: {c['Refund Amount'] || '0'}
                <span className="ml-3">
                  {c['Photo 1'] && <a href={c['Photo 1']} target="_blank" className="text-blue-600 underline mr-2">P1</a>}
                  {c['Photo 2'] && <a href={c['Photo 2']} target="_blank" className="text-blue-600 underline mr-2">P2</a>}
                  {c['Photo 3'] && <a href={c['Photo 3']} target="_blank" className="text-blue-600 underline mr-2">P3</a>}
                  {c['Video'] && <a href={c['Video']} target="_blank" className="text-red-600 underline">Video</a>}
                </span>
              </div>
            </div>
            <div>
              {c['Status'] === 'Pending' && (
                <button onClick={() => makeUnderReview(c['Case ID'])} className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm px-4 py-2 rounded font-bold">
                  استلام
                </button>
              )}
              {c['Status']!== 'Pending' && (
                <div className="text-xs text-gray-500">{c['Created Date']?.slice(0,10) || ''}</div>
              )}
            </div>
          </div>
        ))}
        {filteredCases.length === 0 && <p className="text-center text-gray-500 py-10">ما في حالات بهالفلتر</p>}
      </div>
    </div>
  )
}
