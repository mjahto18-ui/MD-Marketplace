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
  const [selected, setSelected] = useState(TABLES_CONFIG[12])
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")

  useEffect(() => {
    let url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (url) url = url.replace('/rest/v1/', '').replace('/rest/v1','').replace(/\/$/,'')
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (url && key) setSupabase(createClient(url, key))
  }, [])

  const loadTable = async (tableConf) => {
    if (!supabase) return
    setLoading(true)
    setSelected(tableConf)
    setSearch("")
    const { data, error } = await supabase.from(tableConf.name).select("*").limit(100)
    if (error) {
      const retry = await supabase.from(tableConf.name).select("*").limit(100)
      setData(retry.data || [])
    } else {
      setData(data || [])
    }
    setLoading(false)
  }

  useEffect(() => { if (supabase) loadTable(selected) }, [supabase])

  const filtered = data.filter(row => {
    if (!search) return true
    return JSON.stringify(row).toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div dir="rtl" className="min-h-screen bg-[#08152b] text-white flex">
      {/* الجداول يمين */}
      <div className="w- bg-[#0e2242] border-l border-white/10 p-3 overflow-y-auto h-screen sticky top-0">
        <h1 className="font-black text-xl mb-4">MD Marketplace</h1>
        <p className="text-xs text-white/40 mb-3">{TABLES_CONFIG.length} جدول</p>
        <div className="space-y-1">
          {TABLES_CONFIG.map(t => (
            <button key={t.name} onClick={() => loadTable(t)}
              className={`w-full text-right px-3 py-2.5 rounded-lg text- leading-tight ${selected.name===t.name?'bg-blue-600 text-white':'hover:bg-white/10 text-white/60'}`}>
              <div className="font-bold">{t.name}</div>
              <div className="text- opacity-60 mt-1">KEY: {t.key} {t.isDefaultKey?' (Default)':''} • LABEL: {t.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* المعلومات شمال */}
      <div className="flex-1 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="text-right">
            <h2 className="text-2xl font-bold">{selected.name}</h2>
            <p className="text-xs text-white/50">KEY = {selected.key} | LABEL = {selected.label} {selected.label2?' + '+selected.label2:''}</p>
          </div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`بحث بـ ${selected.label}...`}
            className="mr-6 bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-sm w-80 outline-none text-right"/>
          <span className="text-sm text-white/40">{filtered.length} صف</span>
          <button onClick={()=>loadTable(selected)} className="mr-auto bg-white text-[#08152b] px-4 py-2 rounded-lg text-sm font-bold">Reload</button>
        </div>

        {loading? <p className="text-white/50">جاري التحميل...</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((row, idx) => {
              const pk = row[selected.key] || row['supa_id'] || row['_RowNumber'] || idx
              const label = row[selected.label] || row[selected.label2] || '(بدون عنوان)'
              const imgUrl = selected.label2? row[selected.label2] : (row['Image'] || row['Logo'] || row['Photo'] || null)
              return (
                <div key={pk+''+idx} className="bg-white text-gray-900 rounded-xl p-4 shadow">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text- bg-gray-900 text-white px-2 py-1 rounded">{selected.key}: {String(pk).substring(0,20)}</span>
                    {selected.isDefaultKey && <span className="text- bg-orange-100 text-orange-700 px-2 py-1 rounded">Default Key</span>}
                  </div>
                  <div className="font-bold text- mb-1 truncate text-right">{String(label)}</div>
                  {imgUrl && imgUrl.startsWith('http') && <img src={imgUrl} alt="" className="w-full h-28 object-cover rounded mt-2 bg-gray-100"/>}
                  <div className="mt-3 text- text-gray-500 max-h-20 overflow-hidden text-right">
                    {Object.entries(row).slice(0,4).map(([k,v])=> <div key={k} className="truncate"><b>{k}:</b> {String(v??'').substring(0,60)}</div>)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
