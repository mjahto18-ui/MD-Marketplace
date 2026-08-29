"use client"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default function GenericTable(){
  const { table } = useParams()
  const [data, setData] = useState([])
  const [editId, setEditId] = useState(null)
  const [editRow, setEditRow] = useState({})

  const load = async()=>{
    const { data: rows } = await supabase.from(table).select('*').order('supa_id',{ascending:true}).limit(200)
    setData(rows||[])
  }
  useEffect(()=>{ load() },[table])

  const save = async()=>{
    const { supa_id,...rest } = editRow
    await supabase.from(table).update(rest).eq('supa_id', editId)
    setEditId(null); load()
  }
  const del = async(id)=>{
    if(!confirm('تحذف؟')) return
    await supabase.from(table).delete().eq('supa_id', id)
    load()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-between mb-4">
        <h1 className="font-black text-xl">{table} ({data.length})</h1>
        <a href="/admin/dashboard" className="bg-black text-white px-4 py-1 rounded-full text-">داشبورد</a>
      </div>

      <div className="bg-white rounded-xl overflow-auto shadow">
        <table className="w-full text-">
          <thead className="bg-black text-white sticky top-0">
            <tr><th className="p-2">تعديل</th>{data[0] && Object.keys(data[0]).slice(0,6).map(k=><th key={k} className="p-2">{k}</th>)}<th>حذف</th></tr>
          </thead>
          <tbody>
            {data.map(r=>(
              <tr key={r.supa_id} className="border-t">
                <td className="p-2">
                  {editId===r.supa_id?
                    <><button onClick={save} className="bg-green-600 text-white px-2 py-1 rounded">حفظ</button><button onClick={()=>setEditId(null)} className="bg-gray-300 px-2 py-1 rounded ml-1">x</button></>
                    : <button onClick={()=>{setEditId(r.supa_id); setEditRow(r)}} className="bg-black text-white px-2 py-1 rounded">عدل</button>}
                </td>
                {Object.entries(r).slice(0,6).map(([k,v])=>(
                  <td key={k} className="p-2">{editId===r.supa_id? <input className="border w-full p-1" value={editRow[k]||''} onChange={e=>setEditRow({...editRow,[k]:e.target.value})} /> : <span className="truncate block max-w-">{String(v??'')}</span>}</td>
                ))}
                <td className="p-2"><button onClick={()=>del(r.supa_id)} className="bg-red-600 text-white px-2 py-1 rounded">حذف</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
