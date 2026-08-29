"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import AdminPendingMap from "@/components/AdminPendingMap" // نفس الخريطة يلي عندك

export default function MappingCustomerPage() {
  const [customers, setCustomers] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState(null)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  useEffect(() => { fetchCustomers() }, [])

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
      // اول زبون هو المركز - متل ما عامل انت بالـ pending
      const first = valid.find(v => v['Mobile'] === '03222222') || valid[0]
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
    if (!val) {
      setFiltered(customers)
      return
    }
    const f = customers.filter(c => c['Mobile']?.toString().includes(val))
    setFiltered(f)

    // اذا لقى واحد - اعملو Center
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

  if (!selected) return <div className="p-6">عم حمل الزباين...</div>

  // منحول الزباين لشكل drivers مشان خريطتك تفهمهم
  const driversFormat = filtered.map(c => ({
    'Driver ID': c['Customer ID'],
    'Driver Name': `${c['Name']} - ${c['Mobile']}`,
    'Current Latitude': c.lat,
    'Current Longitude': c.lng,
    'Name': c['Name']
  }))

  return (
    <div className="h-screen flex flex-col">
      <div className="p-3 bg-white shadow flex gap-3 items-center z-10">
        <h1 className="font-bold">Mapping Customers - {filtered.length}</h1>
        <input
          type="text"
          placeholder="فلتر برقم التلفون 03222222"
          value={search}
          onChange={e => handleSearch(e.target.value)}
          className="border-2 border-red-500 rounded-full px-4 py-2 w-80 ml-auto focus:outline-none"
        />
        <span className="text-xs text-gray-500">عميل 113: 03222222</span>
      </div>

      <div className="flex-1">
        <AdminPendingMap
          order={selected}
          drivers={driversFormat}
          onAssign={()=>{}} // ما بدنا تعيين هون
        />
      </div>
    </div>
  )
}
