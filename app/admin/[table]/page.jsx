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
  const [enums, setEnums] = useState({})
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

    // 1- جيب الـ ENUMS من نفس الجدول عن طريق الـ function يلي عملتها بالـ SQL
    let enumMaps = {}
    try{
      const { data: enumJson } = await supabase.rpc('get_table_enums', { p_table: t })
      if(enumJson) enumMaps = enumJson
    }catch(e){}

    const { data: rows } = await supabase.from(t).select('*').order('supa_id',{ascending:true}).limit(200)
    setData(rows||[])
    if(rows?.[0]) {
      const columns = Object.keys(rows[0])
      setCols(columns)
      let maps = {}
      for (const col of columns) {
        if (col==='supa_id') continue
        if (enumMaps[col]) continue // اذا هو ENUM ما بدنا ندورلو ربط
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
      setEnums(enumMaps)
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
    if (enums[colKey]) {
      return (
        <select className={small? "w-full h-9 rounded-xl border border-[#FFD700]/20 bg-[#0F0F0F] px-3 text-[13px] font-medium text-white outline-none focus:border-[#FFD700]/40 focus:ring-2 focus:ring-[#FFD700]/10" : "w-full h-11 rounded-[16px] border border-[#FFD700]/20 bg-[#141414] px-4 text-[13px] font-medium text-white outline-none focus:bg-[#0F0F0F] focus:border-[#FFD700]/40 focus:ring-4 focus:ring-[#FFD700]/10 transition-all"} style={{fontFamily:'Andika'}} value={value||''} onChange={e=>onChange(e.target.value)}>
          <option value="">اختر {colKey}</option>
          {enums[colKey].map(v=>(<option key={v} value={v}>{v}</option>))}
        </select>
      )
    }
    if (dropdowns[colKey]) {
      return (
        <select className={small? "w-full h-9 rounded-xl border border-white/[0.06] bg-[#0F0F0F] px-3 text-[13px] font-medium text-white outline-none focus:border-[#FFD700]/20 focus:ring-2 focus:ring-[#FFD700]/10" : "w-full h-11 rounded-[16px] border border-white/[0.08] bg-[#141414] px-4 text-[13px] font-medium text-white outline-none focus:bg-[#0F0F0F] focus:border-[#FFD700]/30 focus:ring-4 focus:ring-[#FFD700]/10 transition-all"} style={{fontFamily:'Andika'}} value={value||''} onChange={e=>onChange(e.target.value)}>
          <option value="">اختر {colKey}</option>
          {dropdowns[colKey].map(opt=>(<option key={opt.value} value={opt.value}>{opt.label}</option>))}
        </select>
      )
    }
    return (<input placeholder={colKey} className={small? "w-full h-9 rounded-xl border border-white/[0.06] bg-[#0F0F0F] px-3 text-[13px] font-medium text-white outline-none focus:border-[#FFD700]/20 focus:ring-2 focus:ring-[#FFD700]/10" : "w-full h-11 rounded-[16px] border border-white/[0.08] bg-[#141414] px-4 text-[13px] font-medium text-white outline-none placeholder:text-white/20 focus:bg-[#0F0F0F] focus:border-[#FFD700]/30 focus:ring-4 focus:ring-[#FFD700]/10 transition-all"} style={{fontFamily:'Andika'}} value={value||''} onChange={e=>onChange(e.target.value)} />)
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#0F0F0F] text-white selection:bg-[#FFD700]/30">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Andika:wght@400;700&family=JetBrains+Mono:wght@400;500&display=swap');
        *{font-family:'Andika',sans-serif}
        .mono{font-family:'JetBrains Mono',monospace!important}
        .gold-glow{box-shadow:0 0 40px rgba(255,215,0,0.15), 0 0 80px rgba(255,215,0,0.05), inset 0 1px 0 rgba(255,215,0,0.2)}
        .gold-glow-strong{box-shadow:0 0 60px rgba(255,215,0,0.3), 0 0 120px rgba(255,215,0,0.1), inset 0 1px 0 rgba(255,215,0,0.3)}
        .grid-pattern{background-image:radial-gradient(rgba(255,215,0,0.08) 1px, transparent 1px); background-size:24px 24px}
      `}</style>

      <header className="sticky top-0 z-40 backdrop-blur-[20px] bg-[#0F0F0F]/80 border-b border-white/[0.06]">
        <div className="px-6 lg:px-10 py-5 flex items-center justify-between max-w-[1600px] mx-auto">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-[16px] bg-[#FFD700] flex items-center justify-center shadow-[0_0_30px_rgba(255,215,0,0.3)]">
              <div className="w-7 h-7 rounded-[10px] bg-black/20 backdrop-blur flex items-center justify-center text-black font-black text-[12px] tracking-widest mono">MD</div>
            </div>
            <div>
              <div className="flex items-baseline gap-3">
                <h1 className="text-[18px] font-black tracking-tight text-white leading-none">{table}</h1>
                <span className="text-[12px] font-bold text-white/40 tracking-wide mono">/ ADMIN</span>
              </div>
              <div className="flex items-center gap-2.5 mt-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#FFD700] text-black px-3 py-1 text-[11px] font-black tracking-wide mono"><span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse"/>{myRole}</span>
                <span className="text-[12px] text-white/40 font-medium">{filtered.length} سجل • {Object.keys(dropdowns).length} روابط • {Object.keys(enums).length} ENUM</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="hidden md:flex items-center gap-2 h-11 px-4 rounded-full bg-white/[0.04] border border-white/[0.06]">
              <span className="text-white/40">⌕</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث سريع..." className="bg-transparent outline-none text-[13px] font-medium text-white placeholder:text-white/20 w-40 mono"/>
            </div>
            {perm.can_add && (<button onClick={()=>setShowAdd(true)} className="h-11 px-5 rounded-full bg-[#FFD700] text-black text-[13px] font-black tracking-wide hover:bg-white hover:shadow-[0_0_20px_rgba(255,215,0,0.3)] active:scale-[0.98] transition-all">+ إضافة جديد</button>)}
            <a href="/admin/dashboard" className="h-11 px-5 rounded-full bg-white/[0.06] border border-white/[0.08] text-white text-[13px] font-bold hover:bg-white/[0.1] transition">Dashboard</a>
          </div>
        </div>
      </header>

      <main className="px-6 lg:px-10 py-8 max-w-[1600px] mx-auto relative">
        <div className="absolute inset-0 grid-pattern opacity-[0.15] pointer-events-none"></div>
        {showAdd && (
          <div className="relative rounded-[24px] bg-[#141414] border border-[#FFD700]/20 gold-glow p-7 mb-8">
            <div className="flex items-center justify-between mb-7">
              <div><h2 className="text-[16px] font-black tracking-tight text-white">إضافة سجل جديد</h2><p className="text-[12px] text-white/40 mt-1 mono">البرتقالي ENUM ◆ الأزرق مربوط من جدول تاني ● نفس المنطق</p></div>
              <button onClick={()=>setShowAdd(false)} className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/[0.06] text-white hover:bg-white/[0.1] transition">✕</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {cols.filter(c=>c!=='supa_id').map(k=>(<div key={k}><label className="block text-[11px] font-bold tracking-wide text-white/50 mb-2 mono">{k} {dropdowns[k] && <span className="text-[#FFD700]">● مربوط</span>} {enums[k] && <span className="text-amber-400">◆ {enums[k].length} قيم</span>}</label>{renderInput(k, newRow[k]||'', (v)=>setNewRow({...newRow,[k]:v}))}</div>))}
            </div>
            <div className="mt-7 flex gap-2.5"><button onClick={add} className="h-11 px-7 rounded-full bg-[#FFD700] text-black text-[13px] font-black hover:bg-white transition">حفظ السجل</button><button onClick={()=>setShowAdd(false)} className="h-11 px-7 rounded-full bg-white/[0.06] border border-white/[0.08] text-white text-[13px] font-bold hover:bg-white/[0.1] transition">إلغاء</button></div>
          </div>
        )}

        <div className="relative rounded-[24px] bg-[#141414] border border-white/[0.06] overflow-hidden">
          <div className="px-8 py-6 border-b border-white/[0.06] flex items-center justify-between bg-[#0F0F0F]/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FFD700] text-black flex items-center justify-center text-[13px] font-black mono shadow-[0_0_20px_rgba(255,215,0,0.3)]">{filtered.length}</div>
              <div><div className="text-[13px] font-bold text-white">جدول {table}</div><div className="text-[11px] text-white/40 font-medium mt-0.5 mono">عرض {filtered.length} من {data.length} • تحديث مباشر</div></div>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-medium text-white/30 mono"><span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.15)] animate-pulse"/>LIVE SYNC • {Object.keys(enums).length} ENUMS • {Object.keys(dropdowns).length} LINKS</div>
          </div>

          <div className="overflow-auto max-h-[calc(100vh-240px)]">
            <table dir="rtl" className="w-full text-[13px] border-collapse">
              <thead className="sticky top-0 z-20">
                <tr className="bg-[#0F0F0F] text-white border-b border-white/[0.06]">
                  {canEdit && (<th className="sticky right-0 z-30 bg-[#0F0F0F] px-6 py-4 text-center text-[11px] font-black tracking-widest text-[#FFD700] mono">إجراء</th>)}
                  {cols.map(k=>(<th key={k} className="px-6 py-4 text-right text-[11px] font-bold tracking-widest text-white/40 whitespace-nowrap border-l border-white/[0.04] mono">{k} {dropdowns[k] && <span className="ml-1 text-[#FFD700]">●</span>} {enums[k] && <span className="ml-1 text-amber-300">◆</span>}</th>))}
                  {canEdit && (<th className="px-6 py-4 text-center text-[11px] font-bold tracking-widest text-white/40 mono">حذف</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r,index)=>(
                  <tr key={r.supa_id} className={`group border-b border-white/[0.04] hover:bg-white/[0.03] transition-all ${index%2===0?'bg-[#141414]':'bg-[#0F0F0F]/50'}`}>
                    {canEdit && (<td className="sticky right-0 z-10 bg-inherit group-hover:bg-white/[0.03] px-4 py-3 border-l border-white/[0.04]">{editId===r.supa_id? (<div className="flex gap-1.5"><button onClick={save} className="h-8 px-3 rounded-full bg-[#FFD700] text-black text-[12px] font-black hover:bg-white transition">حفظ</button><button onClick={()=>setEditId(null)} className="h-8 w-8 rounded-full bg-white/[0.06] text-white hover:bg-white/[0.1] transition">✕</button></div>) : (<button onClick={()=>{setEditId(r.supa_id); setEditRow(r)}} className="h-8 px-4 rounded-full bg-white/[0.06] border border-white/[0.08] text-white text-[12px] font-bold group-hover:bg-[#FFD700] group-hover:text-black group-hover:border-[#FFD700] transition-all">تعديل</button>)}</td>)}
                    {cols.map(k=>(<td key={k} className="px-6 py-4 text-right text-white/70 font-medium max-w-[240px] truncate border-l border-white/[0.02]">{editId===r.supa_id && k!=='supa_id'? (renderInput(k, editRow[k]||'', (v)=>setEditRow({...editRow,[k]:v}), true)) : (<span className={`${dropdowns[k]?'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/20 text-[11px] font-bold':''} ${enums[k]?'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] text-white/60 border border-white/[0.06] text-[11px] font-bold':''}`}>{dropdowns[k]? (dropdowns[k].find(o=>o.value===String(r[k]??''))?.label || String(r[k]??'')) : String(r[k]??'')}</span>)}</td>))}
                    {canEdit && (<td className="px-4 py-3 text-center"><button onClick={()=>del(r.supa_id)} className="h-8 px-3 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/40 text-[12px] font-bold hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition">حذف</button></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {!canEdit && perm.can_view && (<div className="mt-6 rounded-full bg-white/[0.04] border border-white/[0.06] px-5 py-3 text-[13px] font-bold text-white/40 mono">🔒 وضع القراءة فقط — {myRole}</div>)}
        {!perm.can_view && (<div className="mt-6 rounded-full bg-red-500/10 border border-red-500/20 px-5 py-3 text-[13px] font-bold text-red-400">⛔ لا تملك صلاحية عرض هذا الجدول</div>)}
      </main>
    </div>
  )
}
