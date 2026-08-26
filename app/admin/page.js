"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const TABLES_CONFIG = [
  { name: "md_global_control", key: "key", label: "key" },
  { name: "messages", key: "Message ID", label: "Phone" },
  { name: "protection_cases", key: "Case ID", label: "Case ID" },
  { name: "broadcast", key: "Broadcast ID", label: "Broadcast ID" },
  { name: "webhook", key: "Webhook ID", label: "Title", label2: "Image" },
  { name: "push_queue", key: "Queue ID", label: "Image" },
  { name: "notification_templates", key: "Notification ID", label: "Code" },
  { name: "guestlogs", key: "Log Date", label: "Device Type" },
  { name: "asceses", key: "_RowNumber", label: "Role", isDefaultKey: true },
  { name: "menu", key: "_RowNumber", label: "View", label2: "Photo", isDefaultKey: true },
  { name: "product_base_data", key: "Product ID", label: "Product Name" },
  { name: "personas", key: "Name", label: "Name" },
  { name: "customers", key: "Customer ID", label: "Name" },
  { name: "users", key: "User ID", label: "Name" },
  { name: "drivers", key: "Driver ID", label: "Driver Name" },
  { name: "areas", key: "Area ID", label: "Area Name" },
  { name: "categories", key: "Category ID", label: "Category Name" },
  { name: "stores", key: "Store ID", label: "Store Name", label2: "Logo" },
  { name: "products", key: "Product ID", label: "Product Name" },
  { name: "delivery_rates", key: "Rate ID", label: "Area" },
  { name: "rewards", key: "Reward ID", label: "Reward ID" },
  { name: "reviews", key: "Review ID", label: "Review ID" },
  { name: "wallet_transactions", key: "Transaction ID", label: "Transaction ID" },
  { name: "driver_live_tracking", key: "Tracking ID", label: "Map Title v/c" },
  { name: "cart", key: "Cart ID", label: "Cart ID" },
  { name: "order_details", key: "Detail ID", label: "Product ID" },
  { name: "order_requuest", key: "Request ID", label: "Request ID" },
  { name: "orders_history", key: "Request ID", label: "Request ID" },
  { name: "dashboard", key: "Dashboard ID", label: "Dashboard ID" },
  { name: "custom_delivery", key: "Request ID", label: "الطلب" },
  { name: "bot_sessions", key: "Phone", label: "Last Activity" },
  { name: "new_arrivals", key: "New_Arrival_ID", label: "Image URL" },
]

export default function AdminDashboard() {
  const [supabase, setSupabase] = useState(null)
  const [selected, setSelected] = useState(TABLES_CONFIG[13])
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [editRow, setEditRow] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({})

  useEffect(() => {
    let url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1/','').replace('/rest/v1','').replace(/\/$/,'')
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (url && key) setSupabase(createClient(url, key))
  }, [])

  const loadTable = async (conf) => {
    if (!supabase) return
    setLoading(true); setSelected(conf); setSearch(""); setEditRow(null)
    const { data } = await supabase.from(conf.name).select("*").limit(100).order("supa_id", {ascending:false})
    setData(data||[]); setLoading(false)
  }
  useEffect(()=>{ if(supabase) loadTable(selected) }, [supabase])

  const openEdit = (row) => { setEditRow(row); setFormData(row); setIsAdding(false) }
  const openAdd = () => {
    const empty = {}; if(data[0]) Object.keys(data[0]).forEach(k=>{ if(!['supa_id','_supa_synced_at','_RowNumber'].includes(k)) empty[k]='' })
    setFormData(empty); setIsAdding(true); setEditRow({})
  }
  const handleSave = async () => {
    const payload = {...formData}; delete payload.supa_id; delete payload._supa_synced_at; delete payload._RowNumber
    let res = isAdding? await supabase.from(selected.name).insert(payload) : await supabase.from(selected.name).update(payload).eq('supa_id', editRow.supa_id)
    if(!res.error){ setEditRow(null); loadTable(selected) } else alert(res.error.message)
  }
  const handleDelete = async () => {
    if(!confirm('متأكد بدك تمحي؟')) return
    const { error } = await supabase.from(selected.name).delete().eq('supa_id', editRow.supa_id)
    if(!error){ setEditRow(null); loadTable(selected) }
  }

  const filtered = data.filter(r =>!search || JSON.stringify(r).toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="min-h-screen bg-[#08152b] text-white flex">
      {/* شمال = الجداول */}
      <aside className="w- bg-[#0e2242] border-r border-white/10 p-3 overflow-y-auto h-screen sticky top-0 shrink-0">
        <h1 className="font-black text-xl mb-4">MD Marketplace</h1>
        <div className="space-y-1">
          {TABLES_CONFIG.map(t => (
            <button key={t.name} onClick={() => loadTable(t)} className={`w-full text-left px-3 py-2 rounded-lg text- ${selected.name===t.name?'bg-blue-600 text-white':'hover:bg-white/10 text-white/60'}`}>
              {t.name}
            </button>
          ))}
        </div>
      </aside>

      {/* يمين = المحتوى */}
      <main className="flex-1 p-6 overflow-y-auto h-screen">
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-2xl font-bold">{selected.name} ({filtered.length})</h2>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." className="ml-6 bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-sm w-80 outline-none"/>
          <button onClick={openAdd} className="ml-auto bg-green-500 text-white px-5 py-2 rounded-lg text-sm font-bold">+ إضافة</button>
          <button onClick={()=>loadTable(selected)} className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold">Reload</button>
        </div>

        {loading? <p>جاري التحميل...</p> : (
          <div className="grid grid-cols-3 gap-3">
            {filtered.map((row,i)=>{
              const img = row[selected.label2] || row['Image'] || row['Logo'] || row['Photo']
              return (
                <div key={i} onClick={()=>openEdit(row)} className="bg-white text-black rounded-xl p-4 cursor-pointer hover:ring-2 hover:ring-blue-500">
                  <div className="text- bg-black text-white px-2 py-1 rounded inline-block">{String(row[selected.key]||'').slice(0,20)}</div>
                  <div className="font-bold mt-2 truncate">{String(row[selected.label]||'').slice(0,60)}</div>
                  {img?.startsWith('http') && <img src={img} className="w-full h-24 object-cover rounded mt-2"/>}
                  <div className="text- text-gray-500 mt-2">اضغط للتعديل / حذف</div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {editRow && (
        <div className="fixed inset-0 bg-black/60 flex justify-end z-50">
          <div className="w- bg-white text-black h-screen overflow-y-auto p-6">
            <div className="flex justify-between mb-4"><h3 className="font-bold">{isAdding?'إضافة':'تعديل'} - {selected.name}</h3><button onClick={()=>setEditRow(null)} className="bg-gray-100 px-3 py-1 rounded">X</button></div>
            {Object.keys(formData).map(k=>(
              <div key={k} className="mb-3"><label className="text- font-bold text-gray-500">{k}</label>
              <textarea value={formData[k]||''} onChange={e=>setFormData({...formData,[k]:e.target.value})} className="w-full border rounded-lg p-2 text-sm" rows={2}/></div>
            ))}
            <div className="flex gap-2 mt-6">
              <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold">{isAdding?'إضافة':'حفظ'}</button>
              {!isAdding && <button onClick={handleDelete} className="bg-red-600 text-white px-6 py-3 rounded-xl">حذف</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
