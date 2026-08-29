"use client"
export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import dynamicImport from "next/dynamic"

const AdminPendingMap = dynamicImport(() => import("@/components/AdminPendingMap"), {
  ssr: false,
  loading: () => <div className="p-6">عم حمل الخريطة...</div>
})

export default function MappingCustomerPage() {
  const [customers, setCustomers] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState(null)
  const [log, setLog] = useState("")

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  useEffect(() => { fetchCustomers() }, [])

  const fetchCustomers = async () => {
    // جرب بلا select محدد - جيب كلشي
    const { data, error, count } = await supabase
    .from('customers')
    .select('*', { count: 'exact' })
    .limit(5)

    let txt = `ERROR: ${JSON.stringify(error)}\n COUNT: ${count}\n DATA 5: ${JSON.stringify(data?.[0], null, 2)}`
    console.log(txt)
    setLog(txt)

    if(!data || data.length===0){
      setLog(prev => prev + "\n\n ما في داتا - RLS مسكر! روح Supabase > Table Editor > customers > شوف اذا RLS مفتوح")
      return
    }

    const valid = data.map(c => ({
        ...c,
        lat: parseFloat(c['Current Latitude'] || c['Registration Latitude'] || c['Current Latitude'] || 0),
        lng: parseFloat(c['Current Longtitude'] || c['Registration Longitude'] || 0),
      })).filter(c =>!isNaN(c.lat) && c.lat!==0)

    // جيب 1000 بعد ما تأكدنا
    const { data: all } = await supabase.from('customers').select('*').limit(1000)
    const validAll = (all||[]).map(c=>({...c, lat: parseFloat(c['Current Latitude']||c['Registration Latitude']), lng: parseFloat(c['Current Longtitude']||c['Registration Longitude'])})).filter(c=>!isNaN(c.lat)&&c.lat!==0)

    setCustomers(validAll)
    setFiltered(validAll)
    
    const first = validAll.find(v => v['Mobile']?.toString().includes('03222222')) || validAll[0]
    if(first){
      setSelected({
        customerLat: first.lat,
        customerLng: first.lng,
        customerName: first.Name,
        mobile: first.Mobile,
        requestID: first['Customer ID']
      })
    } else {
      setLog(prev => prev + "\n\n ما في ولا واحد عندو lat - كلون فاضيين!")
    }
  }

  const handleSearch = (val) => {
    setSearch(val)
    if (!val) { setFiltered(customers); return }
    const f = customers.filter(c => c['Mobile']?.toString().includes(val))
    setFiltered(f)
    if (f.length>0){
      setSelected({
        customerLat: f[0].lat,
        customerLng: f[0].lng,
        customerName: f[0].Name,
        mobile: f[0].Mobile,
        requestID: f[0]['Customer ID']
      })
    }
  }

  if (!selected) return (
    <div className="p-6">
      <div className="bg-black text-green-400 p-4 rounded text-xs whitespace-pre-wrap mb-4">{log || "عم حمل..."}</div>
      <input placeholder="03222222" value={search} onChange={e=>handleSearch(e.target.value)} className="border p-2 rounded" />
    </div>
  )

  const driversFormat = filtered.map(c => ({
    'Driver ID': c['Customer ID'],
    'Driver Name': `${c['Name']} - ${c['Mobile']}`,
    'Current Latitude': c.lat,
    'Current Longitude': c.lng,
  }))

  return (
    <div className="h-screen flex flex-col">
      <div className="p-3 bg-white shadow flex gap-3 items-center">
        <h1 className="font-bold">Mapping - {filtered.length} / {customers.length}</h1>
        <input
          type="text"
          placeholder="03222222"
          value={search}
          onChange={e => handleSearch(e.target.value)}
          className="border-2 border-red-500 rounded-full px-4 py-2 w-80 ml-auto"
        />
      </div>
      <div className="flex-1">
        <AdminPendingMap order={selected} drivers={driversFormat} onAssign={()=>{}} />
      </div>
    </div>
  )
}
