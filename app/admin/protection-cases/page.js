"use client"
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import BackToDashboard from "@/components/BackToDashboard"

const STATUS_OPTIONS = ['Pending','Under Review','Waiting Customer','Waiting Store','Approved_Case','Rejected_Case','Refunded','Closed']
const DECISION_OPTIONS = ['Full Refund','Partail Refund','Replace Product','Rejected Case']
const RESPONSIBLE_OPTIONS = ['Store','Driver','Company','Shared']

export default function ProtectionPage() {
  const [allCases, setAllCases] = useState([])
  const [filter, setFilter] = useState('Pending')
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [edit, setEdit] = useState({})

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

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
    if (status?.includes('Waiting')) return 'border-l-blue-500'
    if (status === 'Approved_Case' || status === 'Refunded') return 'border-l-green-500'
    if (status === 'Rejected_Case') return 'border-l-red-500'
    return 'border-l-gray-400'
  }

  const openEdit = (c) => {
    setSelectedId(c['Case ID'])
    setEdit({
      Status: c['Status'],
      Decision: c['Decision'] || '',
      Responsible: c['Responsible'] || '',
      'Refund Amount': c['Refund Amount'] || '',
      'Admin Note': c['Admin Note'] || ''
    })
  }

  const saveEdit = async () => {
    const { error } = await supabase.from('protection_cases').update(edit).eq('Case ID', selectedId)
    if(!error){
      setAllCases(prev => prev.map(c => c['Case ID'] === selectedId? {...c,...edit} : c))
      setSelectedId(null)
    } else alert(error.message)
  }

  const makeUnderReview = async (caseId) => {
    await supabase.from('protection_cases').update({ Status: 'Under Review' }).eq('Case ID', caseId)
    setAllCases(prev => prev.map(c => c['Case ID'] === caseId? {...c, Status: 'Under Review'} : c))
  }

  if (loading) return <div className="p-6">جاري التحميل...</div>

  return (
    <div className="p-6">
      <BackToDashboard />
      <h1 className="text-2xl font-bold mb-6">Protection Cases</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div onClick={() => setFilter('Pending')} className={`cursor-pointer p-4 rounded-lg shadow border-2 ${filter==='Pending'? 'border-yellow-500 bg-yellow-50' : 'bg-white'}`}>
          <div className="text-sm text-gray-500">Pending</div><div className="text-3xl font-bold">{pendingCount}</div>
        </div>
        <div onClick={() => setFilter('Under Review')} className={`cursor-pointer p-4 rounded-lg shadow border-2 ${filter==='Under Review'? 'border-yellow-700 bg-yellow-50' : 'bg-white'}`}>
          <div className="text-sm text-gray-500">Under Review</div><div className="text-3xl font-bold">{underReviewCount}</div>
        </div>
        <div onClick={() => setFilter('Others')} className={`cursor-pointer p-4 rounded-lg shadow border-2 ${filter==='Others'? 'border-blue-500 bg-blue-50' : 'bg-white'}`}>
          <div className="text-sm text-gray-500">باقي الحالات</div><div className="text-3xl font-bold">{othersCount}</div>
        </div>
      </div>

      <div className="grid gap-3">
        {filteredCases.map(c => (
          <div key={c['Case ID']}>
            <div className={`bg-white p-4 rounded-lg shadow border border-l-4 ${getBorderColor(c['Status'])} flex justify-between items-center cursor-pointer`} onClick={() => openEdit(c)}>
              <div>
                <div className="font-bold text-sm">#{c['Order ID'] || c['Case ID'].slice(0,8)} - {c['Status']} {c['Decision']? `| ${c['Decision']}`:''}</div>
                <div className="text-sm text-gray-600 truncate max-w-">{c['Description'] || 'بدون وصف'}</div>
                <div className="text-xs text-gray-400 mt-1">Refund: {c['Refund Amount'] || 0} | Resp: {c['Responsible'] || '-'} | {c['Photo 1'] && 'P1'} {c['Photo 2'] && 'P2'} {c['Video'] && 'Video'}</div>
              </div>
              <div className="flex gap-2">
                {c['Status'] === 'Pending' && <button onClick={(e)=>{e.stopPropagation(); makeUnderReview(c['Case ID'])}} className="bg-yellow-500 text-white text-xs px-3 py-1 rounded">استلام</button>}
                <span className="text-xs text-gray-400">تعديل ✏️</span>
              </div>
            </div>

            {/* بوكس التعديل */}
            {selectedId === c['Case ID'] && (
              <div className="bg-gray-50 border p-4 rounded-b-lg mt-1 grid grid-cols-2 md:grid-cols-5 gap-3">
                <div><label className="text-xs">Status</label><select value={edit.Status} onChange={e=>setEdit({...edit, Status: e.target.value})} className="w-full border rounded p-2 text-sm">{STATUS_OPTIONS.map(o=><option key={o} value={o}>{o}</option>)}</select></div>
                <div><label className="text-xs">Decision</label><select value={edit.Decision} onChange={e=>setEdit({...edit, Decision: e.target.value})} className="w-full border rounded p-2 text-sm"><option value="">- اختر -</option>{DECISION_OPTIONS.map(o=><option key={o} value={o}>{o}</option>)}</select></div>
                <div><label className="text-xs">Responsible</label><select value={edit.Responsible} onChange={e=>setEdit({...edit, Responsible: e.target.value})} className="w-full border rounded p-2 text-sm"><option value="">- اختر -</option>{RESPONSIBLE_OPTIONS.map(o=><option key={o} value={o}>{o}</option>)}</select></div>
                <div><label className="text-xs">Refund Amount</label><input value={edit['Refund Amount']} onChange={e=>setEdit({...edit, 'Refund Amount': e.target.value})} className="w-full border rounded p-2 text-sm" placeholder="0" /></div>
                <div className="col-span-2 md:col-span-1"><label className="text-xs">Admin Note</label><input value={edit['Admin Note']} onChange={e=>setEdit({...edit, 'Admin Note': e.target.value})} className="w-full border rounded p-2 text-sm" placeholder="ملاحظة" /></div>
                <div className="col-span-2 md:col-span-5 flex gap-2 justify-end mt-2">
                  <button onClick={()=>setSelectedId(null)} className="bg-gray-300 px-4 py-2 rounded text-sm">الغاء</button>
                  <button onClick={saveEdit} className="bg-green-600 text-white px-6 py-2 rounded text-sm font-bold">حفظ التعديل</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
