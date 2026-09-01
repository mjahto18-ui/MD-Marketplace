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
  const [dropdowns, setDropdowns] = useState({})
  const [search, setSearch] = useState('')

  const normalize = (v) => String(v).toUpperCase() === 'TRUE' || v === true

  const guessRef = (col) => {
    const c = col.toLowerCase().replace(/_id| id|_ID/g,'').trim()
    if (c==='area' || c==='areas') return { table: 'areas', idCol: 'Area ID', labelCol: 'Area' }
    if (c==='category' || c==='categories') return { table: 'categories', idCol: 'Category ID', labelCol: 'Category' }
    if (c==='store' || c==='stores') return { table: 'stores', idCol: 'Store ID', labelCol: 'Store Name' }
    if (c==='product' || c==='products') return { table: 'products', idCol: 'Product ID', labelCol: 'Product Name' }
    if (c==='customer' || c==='customers') return { table: 'customers', idCol: 'Customer ID', labelCol: 'Name' }
    if (c==='driver' || c==='drivers') return { table: 'drivers', idCol: 'Driver ID', labelCol: 'Driver Name' }
    if (c==='user' || c==='users') return { table: 'users', idCol: 'User ID', labelCol: 'Name' }
    return null
  }

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
    if(rows?.[0]) {
      const columns = Object.keys(rows[0])
      setCols(columns)
      let maps = {}
      for (const col of columns) {
        if (col==='supa_id') continue
        const ref = guessRef(col)
        if (ref) {
          try {
            const { data: refRows } = await supabase.from(ref.table).select('*').limit(500)
            if (refRows && refRows.length>0) {
              maps[col] = refRows.map(r => ({ value: String(r[ref.idCol]??''), label: String(r[ref.labelCol]||r[ref.idCol]||'') })).filter(o=>o.value)
            }
          } catch(e) {}
        }
      }
      setDropdowns(maps)
    }
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
    else { setShowAdd(false); setNewRow({}); load() }
  }

  const canEdit = perm.can_edit
  const filtered = data.filter(r =>!search || Object.values(r).some(v => String(v).toLowerCase().includes(search.toLowerCase())))

  const renderInput = (colKey, value, onChange, small=false) => {
    if (dropdowns[colKey]) {
      return (
        <select className={small? "w-full h-9 rounded-xl border border-zinc-200 bg-white px-3 text- font-medium text-black outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/10" : "w-full h-11 rounded-2xl border border-zinc-200 bg-zinc-50/50 px-4 text- font-medium text-black outline-none focus:bg-white focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/10 transition-all"} style={{fontFamily:'Andika'}} value={value||''} onChange={e=>onChange(e.target.value)}>
          <option value="">اختر {colKey}</option>
          {dropdowns[colKey].map(opt=>(<option key={opt.value} value={opt.value}>{opt.label}</option>))}
        </select>
      )
    }
    return (<input placeholder={colKey} className={small? "w-full h-9 rounded-xl border border-zinc-200 bg-white px-3 text- font-medium text-black outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/10" : "w-full h-11 rounded-2xl border border-zinc-200 bg-zinc-50/50 px-4 text- font-medium text-black outline-none placeholder:text-zinc-400 focus:bg-white focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/10 transition-all"} style={{fontFamily:'Andika'}} value={value||''} onChange={e=>onChange(e.target.value)} />)
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#0052CC] text-zinc-900 selection:bg-zinc-900 selection:text-white">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Andika:wght@400;700&display=swap'); *{font-family:'Andika',sans-serif}`}</style>

      <header className="sticky top-0 z-40 bg-[#3385FF] backdrop-blur-2xl border-b border-white/20">
        <div className="px-6 lg:px-10 py-5 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded- bg-[#0052CC] flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
              <div className="w-7 h-7 rounded- bg-white/20 backdrop-blur flex items-center justify-center text-white font-black text- tracking-widest" style={{fontFamily:'Andika'}}>MD</div>
            </div>
            <div>
              <div className="flex items-baseline gap-3">
                <h1 className="text- font-[900] tracking-[-0.02em] text-black leading-none" style={{fontFamily:'Andika'}}>{table}</h1>
                <span className="text- font-bold text-black/60 tracking-wide" style={{fontFamily:'Andika'}}>/ ADMIN</span>
              </div>
              <div className="flex items-center gap-2.5 mt-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#0052CC] text-white px-3 py-1 text- font-bold tracking-wide" style={{fontFamily:'Andika'}}><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"/>{myRole}</span>
                <span className="text- text-black font-medium" style={{fontFamily:'Andika'}}>{filtered.length} سجل • {Object.keys(dropdowns).length} روابط</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="hidden md:flex items-center gap-2 h-11 px-4 rounded-2xl bg-zinc-50 border border-zinc-100">
              <span className="text-black">⌕</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث سريع..." className="bg-transparent outline-none text- font-medium text-black placeholder:text-zinc-400 w-" style={{fontFamily:'Andika'}}/>
            </div>
            {perm.can_add && (<button onClick={()=>setShowAdd(true)} className="h-11 px-5 rounded-2xl bg-[#0052CC] text-white text- font-bold tracking-wide hover:bg-[#0041a3] hover:shadow-[0_8px_24px_rgba(0,0,0,0.16)] active:scale-[0.98] transition-all" style={{fontFamily:'Andika'}}>+ إضافة جديد</button>)}
            <a href="/admin/dashboard" className="h-11 px-5 rounded-2xl bg-black border border-zinc-200 text-white text- font-bold hover:bg-zinc-800 transition" style={{fontFamily:'Andika'}}>لوحة التحكم</a>
          </div>
        </div>
      </header>

      <main className="px-6 lg:px-10 py-8">
        {showAdd && (
          <div className="bg-[#3385FF] rounded- border border-zinc-100 shadow-[0_20px_60px_rgba(0,0,0,0.15)] p-7 mb-8">
            <div className="flex items-center justify-between mb-7">
              <div><h2 className="text- font-[800] tracking-tight text-black" style={{fontFamily:'Andika'}}>إضافة سجل جديد</h2><p className="text- text-black mt-1 font-medium" style={{fontFamily:'Andika'}}>كل الحقول المربوطة صارت قوائم منسدلة تلقائياً ▼</p></div>
              <button onClick={()=>setShowAdd(false)} className="w-10 h-10 rounded-2xl bg-zinc-50 border border-zinc-100 text-black hover:bg-zinc-100 transition">✕</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {cols.filter(c=>c!=='supa_id').map(k=>(<div key={k}><label className="block text- font-bold tracking-wide text-black mb-2" style={{fontFamily:'Andika'}}>{k} {dropdowns[k] && <span className="text-[#0052CC]">▼ مربوط</span>}</label>{renderInput(k, newRow[k]||'', (v)=>setNewRow({...newRow,[k]:v}))}</div>))}
            </div>
            <div className="mt-7 flex gap-2.5"><button onClick={add} className="h-11 px-7 rounded-2xl bg-[#0052CC] text-white text- font-bold hover:bg-[#0041a3] transition" style={{fontFamily:'Andika'}}>حفظ السجل</button><button onClick={()=>setShowAdd(false)} className="h-11 px-7 rounded-2xl bg-zinc-50 border border-zinc-100 text-black text- font-bold hover:bg-zinc-100 transition" style={{fontFamily:'Andika'}}>إلغاء</button></div>
          </div>
        )}

        <div className="bg-[#3385FF] rounded- border border-zinc-100 shadow-[0_20px_80px_rgba(0,0,0,0.15)] overflow-hidden">
          <div className="px-8 py-6 border-b border-zinc-50 flex items-center justify-between bg-[#3385FF]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0052CC] text-white flex items-center justify-center text- font-black" style={{fontFamily:'Andika'}}>{filtered.length}</div>
              <div><div className="text- font-bold text-black" style={{fontFamily:'Andika'}}>جدول {table}</div><div className="text- text-black font-medium mt-0.5" style={{fontFamily:'Andika'}}>عرض {filtered.length} من {data.length} • تحديث مباشر</div></div>
            </div>
            <div className="flex items-center gap-2 text- font-medium text-black" style={{fontFamily:'Andika'}}><span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]"/>LIVE SYNC • DROPDOWNS ACTIVE</div>
          </div>

          <div className="overflow-auto max-h-[calc(100vh-240px)]">
            <table dir="rtl" className="w-full text- border-collapse">
              <thead className="sticky top-0 z-20">
                <tr className="bg-[#0052CC] text-white">
                  {canEdit && (<th className="sticky right-0 z-30 bg-[#0052CC] px-6 py-4 text-center text- font-bold tracking-widest text-white" style={{fontFamily:'Andika'}}>إجراء</th>)}
                  {cols.map(k=>(<th key={k} className="px-6 py-4 text-right text- font-bold tracking-widest text-white whitespace-nowrap border-l border-white/20" style={{fontFamily:'Andika'}}>{k} {dropdowns[k] && <span className="ml-1 text-white">●</span>}</th>))}
                  {canEdit && (<th className="px-6 py-4 text-center text- font-bold tracking-widest text-white" style={{fontFamily:'Andika'}}>حذف</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r,index)=>(
                  <tr key={r.supa_id} className={`group border-b border-zinc-100 hover:bg-[#e6efff]/50 transition-all ${index%2===0?'bg-white':'bg-[#f6f8ff]'}`}>
                    {canEdit && (<td className="sticky right-0 z-10 bg-inherit group-hover:bg-[#e6efff]/50 px-4 py-3 border-l border-zinc-100">{editId===r.supa_id? (<div className="flex gap-1.5"><button onClick={save} className="h-8 px-3 rounded-xl bg-[#0052CC] text-white text- font-bold hover:bg-[#0041a3] transition" style={{fontFamily:'Andika'}}>حفظ</button><button onClick={()=>setEditId(null)} className="h-8 w-8 rounded-xl bg-zinc-100 text-black hover:bg-zinc-200 transition">✕</button></div>) : (<button onClick={()=>{setEditId(r.supa_id); setEditRow(r)}} className="h-8 px-4 rounded-xl bg-black text-white text- font-bold group-hover:bg-[#0052CC] transition-all" style={{fontFamily:'Andika'}}>تعديل</button>)}</td>)}
                    {cols.map(k=>(<td key={k} className="px-6 py-4 text-right text-black font-bold max-w- truncate border-l border-zinc-50/50" style={{fontFamily:'Andika'}}>{editId===r.supa_id && k!=='supa_id'? (renderInput(k, editRow[k]||'', (v)=>setEditRow({...editRow,[k]:v}), true)) : (<span className={`${dropdowns[k]?'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e6efff] text-black border border-[#b3ccff] text- font-bold':''}`} style={{fontFamily:'Andika'}}>{dropdowns[k]? (dropdowns[k].find(o=>o.value===String(r[k]??''))?.label || String(r[k]??'')) : String(r[k]??'')}</span>)}</td>))}
                    {canEdit && (<td className="px-4 py-3 text-center"><button onClick={()=>del(r.supa_id)} className="h-8 px-3 rounded-xl bg-white border border-zinc-200 text-black text- font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition" style={{fontFamily:'Andika'}}>حذف</button></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {!canEdit && perm.can_view && (<div className="mt-6 rounded-2xl bg-white border border-zinc-100 px-5 py-4 text- font-bold text-black" style={{fontFamily:'Andika'}}>🔒 وضع القراءة فقط — {myRole}</div>)}
        {!perm.can_view && (<div className="mt-6 rounded-2xl bg-white border border-red-100 px-5 py-4 text- font-bold text-black" style={{fontFamily:'Andika'}}>⛔ لا تملك صلاحية عرض هذا الجدول</div>)}
      </main>
    </div>
  )
}
