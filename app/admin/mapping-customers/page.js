"use client"
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import dynamicImport from 'next/dynamic'

// Leaflet بلا SSR
const MapContainer = dynamicImport(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false })
const TileLayer = dynamicImport(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false })
const Marker = dynamicImport(() => import('react-leaflet').then(m => m.Marker), { ssr: false })
const Popup = dynamicImport(() => import('react-leaflet').then(m => m.Popup), { ssr: false })

export default function MappingPage() {
  const [customers, setCustomers] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  useEffect(() => {
    fetchCustomers()
    // CSS تبع Leaflet
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
  }, [])

  const fetchCustomers = async () => {
    const { data } = await supabase
     .from('customers')
     .select('Customer ID, Name, Mobile, Area, Adress, Registration Latitude, Registration Longitude, Current Latitude, Current Longtitude, Status')
     .not('Registration Latitude', 'is', null)
     .not('Registration Longitude', 'is', null)
     .eq('Status', 'Active')
     .limit(1000)

    setCustomers(data || [])
    setFiltered(data || [])
    setLoading(false)
  }

  const handleSearch = (val) => {
    setSearch(val)
    if (!val) {
      setFiltered(customers)
      return
    }
    const f = customers.filter(c =>
      c['Mobile']?.toString().includes(val) ||
      c['Name']?.includes(val) ||
      c['Customer ID']?.toString().includes(val)
    )
    setFiltered(f)
  }

  if (loading) return <div className="p-6">عم حمل الزباين...</div>

  const center = filtered.length > 0
   ? [parseFloat(filtered[0]['Current Latitude'] || filtered[0]['Registration Latitude']), parseFloat(filtered[0]['Current Longtitude'] || filtered[0]['Registration Longitude'])]
    : [33.8938, 35.5018] // بيروت

  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 bg-white shadow flex gap-3 items-center">
        <h1 className="font-bold text-xl">Mapping Customer - {filtered.length} زبون</h1>
        <input
          type="text"
          placeholder="فلتر برقم التلفون... 03xxxxxx"
          value={search}
          onChange={e => handleSearch(e.target.value)}
          className="border rounded-full px-4 py-2 w-80 ml-auto"
        />
        {search && <button onClick={() => handleSearch("")} className="bg-gray-200 px-3 py-1 rounded">مسح</button>}
      </div>

      <div className="flex-1">
        <MapContainer center={center} zoom={search? 15 : 12} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {filtered.map(c => {
            const lat = parseFloat(c['Current Latitude'] || c['Registration Latitude'])
            const lng = parseFloat(c['Current Longtitude'] || c['Registration Longitude'])
            if (isNaN(lat) || isNaN(lng)) return null
            return (
              <Marker key={c['Customer ID']} position={[lat, lng]}>
                <Popup>
                  <div className="text-sm">
                    <b>{c['Name']}</b> - #{c['Customer ID']}<br/>
                    📞 {c['Mobile']}<br/>
                    📍 {c['Adress']}<br/>
                    Area: {c['Area']}<br/>
                    {c['Current Latitude']? '📡 موقع حالي' : '🏠 موقع تسجيل'}
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>
    </div>
  )
}
