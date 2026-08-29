"use client"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default function TablePage(){
  const { slug } = useParams() // customers-customers-pending او users
  const [data, setData] = useState([])
  const [title, setTitle] = useState(slug)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    const load = async()=>{
      // 1- دور اذا هاد slug هو slice من جدول menu
      const { data: allMenus } = await supabase.from('menu').select('*')
      const found = allMenus?.find(m => `${m.Menu}-${m.View.toLowerCase().replace(/\s+/g,'-')}` === slug)

      let tableName = slug
      let viewName = slug
      let filterFn = null

      if(found){
        tableName = found.Menu
        viewName = found.View
        // فلاتر الـ 9
        if(found.View==='Customers Pending') filterFn = r=>r.Status==='Pending'
        if(found.View==='Pending Orders') filterFn = r=>r['Approval Status']==='Pending'
        if(found.View==='Today Orders'){
          const today = new Date().toISOString().split('T')[0]
          filterFn = r=>String(r['Request Date']||'').startsWith(today)
        }
        if(found.View==='Customers Pending') filterFn = r=>r.Status==='Pending'
if(found.View==='Pending Orders') filterFn = r=>r['Approval Status']==='Pending'
if(found.View==='Today Orders'){
  const today = new Date().toISOString().split('T')[0]
  filterFn = r=>String(r['Request Date']||'').startsWith(today)
}
if(found.View==='Complete Orders') filterFn = r=>r['Approval Status']==='Completed'
if(found.View==='Approved Orders') filterFn = r=>r['Approval Status']==='Approved'
if(found.View==='Active Orders') filterFn = r=>['Active','Approved'].includes(r['Approval Status'])
if(found.View==='Rejected Orders') filterFn = r=>r['Approval Status']==='Rejected'
if(found.View==='Cash Pending') filterFn = r=>r['Cash Status']==='Pending'
if(found.View==='Cash Received') filterFn = r=>r['Cash Status']==='Received'
if(found.View==='Mapping Customers') filterFn = r=>!r.Latitude ||!r.Longitude || r.Latitude==='' // اللي ما عندو خريطة
      } else {
        // اذا مو slice - هو جدول مباشر مثل users, areas, messages...
        // slug ممكن يكون users-users او users - ناخد اول كلمة
        tableName = slug.split('-')[0]
        viewName = tableName
      }

      setTitle(`${viewName} • ${tableName}`)
      const { data: rows } = await supabase.from(tableName).select('*').limit(500)
      let final = rows||[]
      if(filterFn) final = final.filter(filterFn)
      setData(final)
      setLoading(false)
    }
    load()
  },[slug])

  if(loading) return <div className="min-h-screen bg-[#080811] text-white p-10">جاري فتح {slug}...</div>

  return (
    <div className="min-h-screen bg-[#080811] text-white p-6">
      <div className="max-w- mx-auto">
        <h1 className="font-black text-">{title} ({data.length})</h1>
        <div className="text- opacity-50">/admin/{slug}</div>
        <div className="mt-6 bg-white text-black rounded-xl overflow-auto max-h-">
          <table className="w-full text-">
            <thead className="bg-black/10 sticky top-0"><tr><th className="p-2">#</th>{data[0] && Object.keys(data[0]).slice(0,8).map(k=><th key={k} className="p-2 text-left">{k}</th>)}</tr></thead>
            <tbody>{data.map((r,i)=><tr key={i} className="border-t"><td className="p-2">{i+1}</td>{Object.values(r).slice(0,8).map((v,j)=><td key={j} className="p-2 truncate max-w-">{String(v??'')}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
