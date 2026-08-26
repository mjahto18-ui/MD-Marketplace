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
  { name: "asceses", key: "_RowNumber", label: "Role" },
  { name: "menu", key: "_RowNumber", label: "View", label2: "Photo" },
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
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1/','').replace(/\/$/,'')
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (url && key) setSupabase(createClient(url, key))
  }, [])

  const loadTable = async (conf) => {
    if (!supabase) return
    setLoading(true); setSelected(conf); setEditRow(null)
    // بدون order مشان ما يفشل
    const { data, error } = await supabase.from(conf.name).select("*").limit(100)
    if(error) console.log(error)
    setData(data||[]); setLoading(false)
  }
  useEffect(()=>{ if(supabase) loadTable(selected) }, [supabase])

  const openEdit = (r) => { setEditRow(r); setFormData(r); setIsAdding(false) }
  const openAdd = () => {
    const empty = {}; if(data[0]) Object.keys(data[0]).forEach(k=>{ if(!['supa_id','_supa_synced_at','_RowNumber'].includes(k)) empty[k]='' })
    setFormData(empty); setIsAdding(true); setEditRow({})
  }
  const handleSave = async () => {
    const p = {...formData}; delete p.supa_id; delete p._supa_synced_at; delete p._RowNumber
    const res = isAdding? await supabase.from(selected.name).insert(p) : await supabase.from(selected.name).update(p).eq('supa_id', editRow.supa_id)
    if(!res.error){ setEditRow(null); loadTable(selected) } else alert(res.error.message)
  }
  const handleDelete = async () => {
    if(!confirm('تمحي؟')) return
    const { error } = await supabase.from(selected.name).delete().eq('supa_id', editRow.supa_id)
    if(!error){ setEditRow(null); loadTable(selected) }
  }

  const filtered = data.filter(r =>!search || JSON.stringify(r).toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex min-h-screen bg-[#08152b] text-white">
      {/* شمال - الجداول - قياس ثابت */}
      <div className="w- min-w- bg-[#0e2242] border-r border-white/10 flex flex-col">
        <div className="p-4 font-black text-lg border-b border-white/10">MD Marketplace</div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {TABLES_CONFIG.map(t => (
            <button key={t.name} onClick={()=>loadTable(t)} className={`w-full text-left px-3 py-2.5 rounded-md text- truncate ${selected.name===t.name?'bg-blue-600 text-white':'text-white/60 hover:bg-white/10'}`}>
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* يمين - المحتوى - بياخد باقي العرض */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-[#0a1c38]">
          <h2 className="text-xl font-bold">{selected.name} <span className="text-white/40">({filtered.length})</span></h2>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." className="ml-6 bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-sm w- outline-none"/>
          <div className="ml-auto flex gap-2">
            <button onClick={openAdd} className="bg-green-500 px-4 py-2 rounded-lg text-sm font-bold">+ إضافة</button>
            <button onClick={()=>loadTable(selected)} className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold">Reload</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-[#08152b]">
          {loading? <div className="text-white/50">جاري التحميل...</div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {filtered.map((row,i)=>{
                const img = row[selected.label2] || row['Image'] || row['Logo'] || row['Photo']
                return (
                  <div key={i} onClick={()=>openEdit(row)} className="bg-white text-black rounded-xl p-4 shadow cursor-pointer hover:ring-2 hover:ring-blue-500">
                    <div className="text- bg-black text-white px-2 py-1 rounded inline-block mb-2">{String(row[selected.key]||'').slice(0,20)}</div>
                    <div className="font-bold truncate">{String(row[selected.label]||'(بدون)').slice(0,60)}</div>
                    {img?.startsWith('http') && <img src={img} className="w-full h-24 object-cover rounded mt-2"/>}
                    <div className="text- text-gray-400 mt-2">اضغط للتعديل</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {editRow && (
        <div className="fixed inset-0 bg-black/60 flex justify-end z-50">
          <div className="w- bg-white text-black h-full overflow-y-auto p-6">
            <div className="flex justify-between mb-4"><h3 className="font-bold">{isAdding?'إضافة':'تعديل'}</h3><button onClick={()=>setEditRow(null)} className="bg-gray-100 px-3 py-1 rounded">X</button></div>
            {Object.keys(formData).map(k=>(
              <div key={k} className="mb-3"><label className="text- font-bold text-gray-500">{k}</label><textarea value={formData[k]||''} onChange={e=>setFormData({...formData,[k]:e.target.value})} className="w-full border rounded p-2 text-sm" rows={2}/></div>
            ))}
            <div className="flex gap-2 mt-6">
              <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold">حفظ</button>
              {!isAdding && <button onClick={handleDelete} className="bg-red-600 text-white px-6 py-3 rounded-xl">حذف</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
