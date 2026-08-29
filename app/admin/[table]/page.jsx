"use client"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default function GenericTable(){
  const { table } = useParams()
  const [data, setData] = useState([])
  const [cols, setCols] = useState([])
  const [myRole, setMyRole] = useState('')
  const [perm, setPerm] = useState({can_view:true, can_edit:false, can_add:false, can_delete:false})
  const [editId, setEditId] = useState(null)
  const [editRow, setEditRow] = useState({})

  const load = async()=>{
    const sess = await fetch('/api/admin/session').then(r=>r.json())
    setMyRole(sess.role||'')

    const { data: rule } = await supabase.from('asceses').select('*').eq('role', sess.role).eq('menu', table).maybeSingle()

    if(sess.role==='Admin'){
      setPerm({can_view:true, can_edit:true, can_add:true, can_delete:true})
    }else if(rule){
      setPerm({can_view:rule.can_view, can_edit:rule.can_edit, can_add:rule.can_add, can_delete:rule.can_delete || false})
    }else{
      setPerm({can_view:false, can_edit:false, can_add:false, can_delete:false})
    }

    const { data: rows } = await supabase.from(table).select('*').order('supa_id',{ascending:true}).limit(200)
    setData(rows||[])
    if(rows?.[0]) setCols(Object.keys(rows[0]))
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

  const canEdit = perm.can_edit

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="flex justify-between mb-4 items-center">
        <h1 className="font-black text-xl">{table} ({data.length}) <span className="text- font-normal bg-black text-white px-2 py-1 rounded-full ml-2">{myRole} - {canEdit?'يعدل':'قراءة فقط'}</span></h1>
        <a href="/admin/dashboard" className="bg-black text-white px-4 py-1 rounded-full text-">داشبورد</a>
      </div>

      <div className="bg-white rounded-xl shadow overflow-auto max-w- border">
        <table className="w-full text- whitespace-nowrap">
          <thead className="bg-black text-white sticky top-0">
            <tr>
              {canEdit && <th className="p-2 sticky left-0 bg-black z-10">تعديل</th>}
              {cols.map(k=><th key={k} className="p-2 text-left border-l border-white/10 min-w-">{k}</th>)}
              {canEdit && <th className="p-2">حذف</th>}
            </tr>
          </thead>
          <tbody>
            {data.map(r=>(
              <tr key={r.supa_id} className="border-t hover:bg-gray-50">
                {canEdit && <td className="p-2 sticky left-0 bg-white z-10">
                  {editId===r.supa_id?
                    <><button onClick={save} className="bg-green-600 text-white px-2 py-1 rounded">حفظ</button><button onClick={()=>setEditId(null)} className="bg-gray-300 px-2 py-1 rounded ml-1">x</button></>
                    : <button onClick={()=>{setEditId(r.supa_id); setEditRow(r)}} className="bg-black text-white px-2 py-1 rounded">عدل</button>}
                </td>}
                {cols.map(k=>(
                  <td key={k} className="p-2 border-l max-w- truncate">
                    {editId===r.supa_id && k!=='supa_id'? <input className="border w-full p-1" value={editRow[k]||''} onChange={e=>setEditRow({...editRow,[k]:e.target.value})} /> : String(r[k]??'')}
                  </td>
                ))}
                {canEdit && <td className="p-2"><button onClick={()=>del(r.supa_id)} className="bg-red-600 text-white px-2 py-1 rounded">حذف</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!canEdit && perm.can_view && <div className="mt-3 text- text-red-600 font-bold">انت {myRole} - قراءة فقط بهاد الجدول (can_edit=FALSE)</div>}
      {!perm.can_view && <div className="mt-3 text- text-red-600 font-bold">ما عندك صلاحية تشوف هاد الجدول</div>}
    </div>
  )
}
