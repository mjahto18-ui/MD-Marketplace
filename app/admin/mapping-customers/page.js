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
  const [ready, setReady] = useState(false)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  useEffect(() => {
    setReady(true)
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    const { data } = await supabase
    .from('customers')
    .select('Customer ID, Name, Mobile, Adress, Registration Latitude, Registration Longitude, Current Latitude, Current Longtitude')
    .limit(1000)

    const valid = (data || [])
    .map(c => ({
      ...c,
        lat: parseFloat(c['Current Latitude'] || c['Registration Latitude']),
        lng: parseFloat(c['Current Longtitude'] || c['Registration Longitude']),
      }))
    .filter(c =>!isNaN(c.lat) && c.lat!== 0)

    setCustomers(valid)
    setFiltered(valid)
    if (valid.length > 0) {
      const first = valid.find(v => v['Mobile']?.toString().includes('03222222')) || valid[0]
      setSelected({
        customerLat: first.lat,
        customerLng: first.lng,
        customerName: first.Name,
        mobile: first.Mobile,
        requestID: first['Customer ID']
      })
    }
  }

  const handleSearch = (val) => {
    setSearch(val)
    if (!val) { setFiltered(customers); return }
    const f = customers.filter(c => c['Mobile']?.toString().includes(val))
    setFiltered(f)
    if (f.length === 1) {
      setSelected({
        customerLat: f[0].lat,
        customerLng: f[0].lng,
        customerName: f[0].Name,
        mobile: f[0].Mobile,
        requestID: f[0]['Customer ID']
      })
    }
  }

  if (!ready ||!selected) return <div className="p-6">عم حمل الزباين...</div>

  const driversFormat = filtered.map(c => ({
    'Driver ID': c['Customer ID'],
    'Driver Name': `${c['Name']} - ${c['Mobile']}`,
    'Current Latitude': c.lat,
    'Current Longitude': c.lng,
  }))

  return (
    <div className="h-screen flex flex-col">
      <div className="p-3 bg-white shadow flex gap-3 items-center">
        <h1 className="font-bold">Mapping - {filtered.length}</h1>
        <input
          type="text"
          placeholder="فلتر برقم التلفون 03222222"
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
