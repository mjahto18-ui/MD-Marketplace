"use client"
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import BackToDashboard from "@/components/BackToDashboard"

export default function PendingReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [names, setNames] = useState({ customers: {}, stores: {}, drivers: {} })
  const [loading, setLoading] = useState(true)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const fetchReviews = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('Status', 'Pending')
      .order('Created At', { ascending: false })

    setReviews(data || [])

    const [cRes, sRes, dRes] = await Promise.all([
      supabase.from('customers').select('*'),
      supabase.from('stores').select('*'),
      supabase.from('drivers').select('*')
    ])

    const cMap = {}
    cRes.data?.forEach(c => cMap[c['Customer ID']] = c['Name'])
    const sMap = {}
    sRes.data?.forEach(s => sMap[s['Store ID']] = s['Store Name'] || s['Name'])
    const dMap = {}
    dRes.data?.forEach(d => dMap[d['Driver ID']] = d['Name'])

    setNames({ customers: cMap, stores: sMap, drivers: dMap })
    setLoading(false)
  }

  useEffect(() => { fetchReviews() }, [])

  const updateStatus = async (reviewId, newStatus) => {
    const { error } = await supabase
      .from('reviews')
      .update({ Status: newStatus })
      .eq('Review ID', reviewId)

    if (!error) {
      setReviews(prev => prev.filter(r => r['Review ID'] !== reviewId))
    } else {
      alert('Error: ' + error.message)
    }
  }

  const updateComment = async (reviewId, newComment) => {
    await supabase.from('reviews').update({ Comment: newComment }).eq('Review ID', reviewId)
  }

  if (loading) return <div className="p-6">جاري التحميل...</div>

  return (
    <div className="p-6">
      <BackToDashboard />
      <h1 className="text-2xl font-bold mb-6">Pending Reviews - {reviews.length}</h1>

      <div className="grid gap-4">
        {reviews.map(review => {
          const customerName = names.customers[review['Customer ID']] || review['Customer ID'] || '-'
          const storeName = names.stores[review['Store ID']] || review['Store ID'] || '-'
          const driverName = names.drivers[review['Driver ID']] || review['Driver ID'] || '-'
          const isSkipped = review['Skipped'] === 'TRUE'

          return (
            <div key={review['Review ID']} className={`bg-white p-4 rounded-lg shadow border flex justify-between items-start border-l-4 ${isSkipped ? 'border-l-gray-400' : 'border-l-yellow-500'}`}>
              <div className="flex-1">
                <div className="font-bold flex gap-2 items-center">
                  ⭐ {review['Rating'] || 'بدون تقييم'} 
                  <span className="text-sm font-normal text-gray-500">#{review['Request ID']}</span>
                  {isSkipped && <span className="bg-gray-200 text-xs px-2 py-0.5 rounded">Skipped</span>}
                </div>
                
                <div className="text-sm text-gray-600 mt-1">
                  زبون: {customerName} | متجر: {storeName} | شوفير: {driverName}
                </div>

                <div className="mt-2">
                  <textarea
                    defaultValue={review['Comment']}
                    onBlur={(e) => updateComment(review['Review ID'], e.target.value)}
                    placeholder="التعليق..."
                    className="w-full text-sm border rounded p-2 bg-gray-50"
                    rows={2}
                  />
                </div>

                <div className="text-xs text-gray-400 mt-1">
                  Tags: {review['Tags'] || '-'} | Created: {review['Created At'] || '-'}
                </div>
              </div>

              <div className="flex flex-col gap-2 ml-4">
                <button onClick={() => updateStatus(review['Review ID'], 'Approved')} className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded font-bold">
                  Approve ✓
                </button>
                <button onClick={() => updateStatus(review['Review ID'], 'Rejected')} className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded">
                  Reject ✕
                </button>
              </div>
            </div>
          )
        })}
        {reviews.length === 0 && <p className="text-gray-500">ما في ريفيوز Pending 🎉</p>}
      </div>
    </div>
  )
}
