"use client"
export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import dynamicImport from "next/dynamic"

const CustomerMapAll = dynamicImport(() => import("@/components/CustomerMapAll"), {
  ssr: false,
  loading: () => <div className="p-6">عم حمل الخريطة...</div>
})

export default function MappingCustomerPage() {
  const [customers, setCustomers] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState("")

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  useEffect(() => { fetchCustomers() }, [])

  const fetchCustomers = async () => {
    const { data: all } = await supabase.from('customers').select('*').limit(1000)
    
    const validAll = (all||[]).map(c=>{
      const lat = parseFloat(c['Current Latitude']||c['Registration Latitude'])
      const lng = parseFloat(c['Current Longtitude']||c['Registration Longitude'])
      return {...c, lat, lng}
    }).filter(c=>!isNaN(c.lat)&&c.lat!==0)

    setCustomers(validAll)
    setFiltered(validAll)
  }

  const handleSearch = (val) => {
    setSearch(val)
    if (!val) { setFiltered(customers); return }
    const f = customers.filter(c => String(c['Mobile']).includes(val))
    setFiltered(f)
  }

  if (customers.length===0) return <div className="p-6">عم حمل الزباين... اذا طول افتح F12 شوف اذا في data</div>

  return (
    <div className="h-screen flex flex-col">
      <div className="p-3 bg-white shadow flex gap-3 items-center">
        <h1 className="font-bold">Customer Map - {filtered.length} / {customers.length}</h1>
        <input
          type="text"
          placeholder="فلتر برقم التلفون 03222222"
          value={search}
          onChange={e => handleSearch(e.target.value)}
          className="border-2 border-red-500 rounded-full px-4 py-2 w-80 ml-auto bg-yellow-50"
        />
        {search && <button onClick={()=>handleSearch("")} className="bg-gray-200 px-3 py-1 rounded">مسح</button>}
      </div>
      <div className="flex-1">
        <CustomerMapAll customers={filtered} />
      </div>
    </div>
  )
}
