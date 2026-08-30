
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
  const [showAdd, setShowAdd] = useState(false)
  const [newRow, setNewRow] = useState({})

  const normalize = (v) => String(v).toUpperCase() === 'TRUE' || v === true

  const load = async () => {
    const sessRes = await fetch('/api/admin/me', { credentials: 'include', cache: 'no-store' })
    if(!sessRes.ok) return
    const sess = await sessRes.json()
    const role = (sess.role || 'Admin').trim()
    setMyRole(role)
    const t = String(table).trim()

    const { data: menuRow } = await supabase.from('menu').select('Role').eq('Menu', t).maybeSingle()
    if(menuRow){
      const allowed = String(menuRow.Role).split(',').map(r=>r.trim())
      if(!allowed.includes(role)){
        setPerm({can_view:false, can_edit:false, can_add:false, can_delete:false})
        return
      }
    }

    const { data: rule } = await supabase.from('asceses').select('*').eq('role', role).eq('menu', t).maybeSingle()

    if(role==='Admin'){
      setPerm({can_view:true, can_edit:true, can_add:true, can_delete:true})
    }else if(rule){
      setPerm({
        can_view:true,
        can_edit: normalize(rule.can_edit),
        can_add: normalize(rule.can_add),
        can_delete: normalize(rule.can_delete)
      })
    }else{
      setPerm({can_view:true, can_edit:false, can_add:false, can_delete:false})
    }

    const { data: rows } = await supabase.from(t).select('*').order('supa_id',{ascending:true}).limit(200)
    setData(rows||[])
    if(rows?.[0]) setCols(Object.keys(rows[0]))
  }

  useEffect(()=>{ load() },[table])

  const save = async()=>{
    const { supa_id,...rest } = editRow
    await supabase.from(table).update(rest).eq('supa_id', editId)
    setEditId(null)
    load()
  }

  const del = async(id)=>{
    if(!confirm('تحذف؟')) return
    await supabase.from(table).delete().eq('supa_id', id)
    load()
  }

  const add = async()=>{
    const { supa_id,...clean } = newRow
    const { error } = await supabase.from(table).insert(clean)
    if(error) alert(error.message)
    else {
      setShowAdd(false)
      setNewRow({})
      load()
    }
  }

  const canEdit = perm.can_edit

  return (
    <div dir="rtl" className="min-h-screen bg-[#f5f7fa] text-slate-900">

      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200">

        <div className="px-5 lg:px-8 py-4 flex items-center justify-between gap-4">

          <div className="flex items-center gap-4 min-w-0">

            <div className="w-11 h-11 rounded-2xl bg-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-slate-900/10 overflow-hidden">
              <img
                src="/logo.png"
                alt="logo"
                className="w-8 h-8 object-contain"
                onError={(e)=>e.target.style.display='none'}
              />
            </div>

            <div className="text-right min-w-0">

              <div className="flex items-center gap-2 flex-wrap">

                <h1 className="font-black text-xl tracking-tight text-slate-950">
                  {table}
                </h1>

                <span className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-[10px] font-black text-slate-600">
                  {data.length} سجل
                </span>

              </div>

              <div className="flex items-center gap-2 mt-1.5">

                <span className="text-[11px] font-bold text-slate-400">
                  {myRole}
                </span>

                <span className="w-1 h-1 rounded-full bg-slate-300" />

                <span className={`text-[11px] font-black ${
                  canEdit ? 'text-emerald-600' : 'text-slate-400'
                }`}>
                  {canEdit ? 'قراءة وتعديل' : 'قراءة فقط'}
                </span>

              </div>

            </div>

          </div>


          <div className="flex items-center gap-2 shrink-0">

            {perm.can_add && (
              <button
                onClick={()=>setShowAdd(true)}
                className="h-10 px-4 rounded-xl bg-emerald-600 text-white text-xs font-black shadow-lg shadow-emerald-600/15 hover:bg-emerald-700 active:scale-[0.98] transition-all"
              >
                <span className="text-base ml-1">+</span>
                إضافة
              </button>
            )}

            <a
              href="/admin/dashboard"
              className="h-10 px-4 rounded-xl bg-slate-950 text-white flex items-center text-xs font-black hover:bg-slate-800 active:scale-[0.98] transition-all"
            >
              لوحة التحكم
            </a>

          </div>

        </div>

      </header>


      {/* CONTENT */}
      <main className="p-5 lg:p-8">

        {/* ADD PANEL */}
        {showAdd && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-[0_8px_30px_rgba(15,23,42,0.06)] p-5 mb-5">

            <div className="flex items-center justify-between mb-5">

              <div className="text-right">
                <h2 className="text-base font-black text-slate-950">
                  إضافة سجل جديد
                </h2>

                <p className="text-[11px] text-slate-400 mt-1">
                  أدخل بيانات السجل ثم اضغط حفظ
                </p>
              </div>

              <button
                onClick={()=>setShowAdd(false)}
                className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 font-black hover:bg-slate-200 transition"
              >
                ×
              </button>

            </div>


            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">

              {cols.filter(c=>c!=='supa_id').map(k=>(

                <div key={k} className="text-right">

                  <label className="block text-[10px] font-black tracking-wide text-slate-400 mb-1.5">
                    {k}
                  </label>

                  <input
                    placeholder={k}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium outline-none focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 transition"
                    value={newRow[k]||''}
                    onChange={e=>setNewRow({...newRow,[k]:e.target.value})}
                  />

                </div>

              ))}

            </div>


            <div className="mt-5 flex gap-2 justify-start">

              <button
                onClick={add}
                className="h-10 px-5 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 transition"
              >
                حفظ السجل
              </button>

              <button
                onClick={()=>setShowAdd(false)}
                className="h-10 px-5 rounded-xl bg-slate-100 text-slate-600 text-xs font-black hover:bg-slate-200 transition"
              >
                إلغاء
              </button>

            </div>

          </div>
        )}


        {/* TABLE CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-[0_6px_25px_rgba(15,23,42,0.05)] overflow-hidden">

          {/* TABLE TOP */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">

            <div className="text-right">

              <div className="text-xs font-black text-slate-900">
                بيانات {table}
              </div>

              <div className="text-[10px] text-slate-400 mt-1">
                {data.length} سجل معروض
              </div>

            </div>

            <div className="flex items-center gap-2">

              <span className="w-2 h-2 rounded-full bg-emerald-500" />

              <span className="text-[10px] font-bold text-slate-400">
                LIVE DATA
              </span>

            </div>

          </div>


          {/* TABLE */}
          <div className="overflow-auto max-h-[calc(100vh-190px)]">

            <table
              dir="rtl"
              className="w-full text-sm whitespace-nowrap border-collapse"
            >

              <thead className="sticky top-0 z-20">

                <tr className="bg-slate-950 text-white">

                  {canEdit && (
                    <th className="sticky right-0 z-30 bg-slate-950 px-4 py-3 text-center text-[11px] font-black border-l border-white/10">
                      تعديل
                    </th>
                  )}

                  {cols.map(k=>(
                    <th
                      key={k}
                      className="px-4 py-3 text-right text-[11px] font-black text-slate-200 border-l border-white/10 min-w-[130px]"
                    >
                      {k}
                    </th>
                  ))}

                  {canEdit && (
                    <th className="px-4 py-3 text-center text-[11px] font-black min-w-[80px]">
                      حذف
                    </th>
                  )}

                </tr>

              </thead>


              <tbody>

                {data.map((r,index)=>(

                  <tr
                    key={r.supa_id}
                    className={`border-b border-slate-100 hover:bg-slate-50 transition ${
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                    }`}
                  >

                    {canEdit && (

                      <td className="sticky right-0 z-10 bg-inherit px-3 py-2 border-l border-slate-100">

                        {editId===r.supa_id ? (

                          <div className="flex items-center justify-center gap-1">

                            <button
                              onClick={save}
                              className="w-9 h-8 rounded-lg bg-emerald-600 text-white text-[10px] font-black hover:bg-emerald-700 transition"
                            >
                              حفظ
                            </button>

                            <button
                              onClick={()=>setEditId(null)}
                              className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 font-black hover:bg-slate-200 transition"
                            >
                              ×
                            </button>

                          </div>

                        ) : (

                          <button
                            onClick={()=>{
                              setEditId(r.supa_id)
                              setEditRow(r)
                            }}
                            className="h-8 px-3 rounded-lg bg-slate-950 text-white text-[10px] font-black hover:bg-slate-800 transition"
                          >
                            تعديل
                          </button>

                        )}

                      </td>

                    )}


                    {cols.map(k=>(

                      <td
                        key={k}
                        className="px-4 py-2.5 text-right border-l border-slate-100 max-w-[280px] truncate text-[12px] font-medium text-slate-700"
                      >

                        {editId===r.supa_id && k!=='supa_id' ? (

                          <input
                            className="w-full min-w-[120px] h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5"
                            value={editRow[k]||''}
                            onChange={e=>setEditRow({...editRow,[k]:e.target.value})}
                          />

                        ) : (

                          String(r[k]??'')

                        )}

                      </td>

                    ))}


                    {canEdit && (

                      <td className="px-3 py-2 text-center">

                        <button
                          onClick={()=>del(r.supa_id)}
                          className="h-8 px-3 rounded-lg bg-red-50 text-red-600 border border-red-100 text-[10px] font-black hover:bg-red-600 hover:text-white transition"
                        >
                          حذف
                        </button>

                      </td>

                    )}

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>


        {/* PERMISSION MESSAGE */}
        {!canEdit && perm.can_view && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-xs text-amber-700 font-bold">
            <span>🔒</span>
            أنت {myRole} — هذا الجدول للقراءة فقط (can_edit = FALSE)
          </div>
        )}

        {!perm.can_view && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-xs text-red-700 font-bold">
            <span>⛔</span>
            ما عندك صلاحية تشوف هذا الجدول
          </div>
        )}

      </main>

    </div>
  )
}

