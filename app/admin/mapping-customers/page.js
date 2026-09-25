"use client"
export const dynamic = "force-dynamic"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import dynamicImport from "next/dynamic"
import BackToDashboard from "@/components/BackToDashboard"

const CustomerMapAll = dynamicImport(() => import("@/components/CustomerMapAll"), {
  ssr: false,
  loading: () => <div className="p-6">عم حمل الخريطة...</div>
})

const COLORS = {
  customers: '#ef4444', // أحمر
  stores: '#3b82f6', // أزرق
  drivers: '#22c55e', // أخضر
  taxi_drivers: '#facc15' // أصفر
}

export default function MappingCustomerPage() {
  const [all, setAll] = useState({ customers:[], stores:[], drivers:[], taxi_drivers:[] })
  const [view, setView] = useState([])
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState("")

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    const [c,s,d,t] = await Promise.all([
      supabase.from('customers').select('*').limit(1000),
      supabase.from('stores').select('*').limit(500),
      supabase.from('drivers').select('*').limit(500),
      supabase.from('taxi_drivers').select('*').limit(1000)
    ])

    const customers = (c.data||[]).map(x=>({
      id: x['Customer ID'], name: x['Name'], mobile: x['Mobile'], address: x['Adress'],
      lat: parseFloat(x['Current Latitude']||x['Registration Latitude']),
      lng: parseFloat(x['Current Longtitude']||x['Registration Longitude']),
      type: 'customers'
    })).filter(x=>!isNaN(x.lat)&&x.lat!==0)

    const stores = (s.data||[]).map(x=>({
      id: x['Store ID'], name: x['Store Name'], mobile: x['Mobile'], address: x['Adress'],
      lat: parseFloat(x['Current Latitude']), lng: parseFloat(x['Current Longitude']),
      type: 'stores'
    })).filter(x=>!isNaN(x.lat))

    const drivers = (d.data||[]).map(x=>({
      id: x['Driver ID'], name: x['Driver Name'], mobile: x['Mobile'], address: x['Area'], status: x['Status'],
      lat: parseFloat(x['Current Latitude']), lng: parseFloat(x['Current Longitude']),
      type: 'drivers'
    })).filter(x=>!isNaN(x.lat))

    const taxi_drivers = (t.data||[]).map(x=>({
      id: x['Taxi_ID'], name: x['full_name'], mobile: x['phone'], address: x['area'] || x['address'],
      lat: parseFloat(x['Current Latitude'] || x['lat']),
      lng: parseFloat(x['Current Longitude'] || x['lng']),
      type: 'taxi_drivers',
      status: x['is_online']? 'online':'offline',
      vehicle: x['vehicle_type']
    })).filter(x=>!isNaN(x.lat)&&x.lat!==0)

    setAll({customers, stores, drivers, taxi_drivers})
    setView([...customers,...stores,...drivers,...taxi_drivers].map(b=>({...b, isMatch:false})))
  }

  const apply = (newTab, phoneVal) => {
    let base = []
    if(newTab==='customers') base = all.customers
    else if(newTab==='stores') base = all.stores
    else if(newTab==='drivers') base = all.drivers
    else if(newTab==='taxi_drivers') base = all.taxi_drivers
    else base = [...all.customers,...all.stores,...all.drivers,...all.taxi_drivers]

    if(!phoneVal) setView(base.map(b=>({...b, isMatch:false})))
    else {
      const matched = base.filter(b=> String(b.mobile).includes(phoneVal) || String(b.id).toLowerCase().includes(phoneVal.toLowerCase()))
      setView(matched.map(b=>({...b, isMatch:true})))
    }
  }

  const btnStyle = (key, active) => ({
    background: active? COLORS[key] : '#f3f4f6',
    color: active? (key==='taxi_drivers'?'black':'white') : 'black',
    border: `2px solid ${COLORS[key]}`,
    padding: '8px 16px',
    borderRadius: '9999px',
    fontWeight: '900',
    fontSize: '13px'
  })

  if(all.customers.length===0 && all.taxi_drivers.length===0) return <div className="p-6">عم حمل...</div>

  return (
    <div className="h-screen flex flex-col">
      <div className="p-3 bg-white shadow flex gap-2 items-center flex-wrap">
       <BackToDashboard />
        <button onClick={()=>{setTab('all'); apply('all', search)}} style={{...btnStyle('customers', tab==='all'), background: tab==='all'? 'black':'#f3f4f6', borderColor: 'black'}}>All {all.customers.length+all.stores.length+all.drivers.length+all.taxi_drivers.length}</button>
        <button onClick={()=>{setTab('customers'); apply('customers', search)}} style={btnStyle('customers', tab==='customers')}>🔴 Customers {all.customers.length}</button>
        <button onClick={()=>{setTab('stores'); apply('stores', search)}} style={btnStyle('stores', tab==='stores')}>🔵 Stores {all.stores.length}</button>
        <button onClick={()=>{setTab('drivers'); apply('drivers', search)}} style={btnStyle('drivers', tab==='drivers')}>🟢 Drivers {all.drivers.length}</button>
        <button onClick={()=>{setTab('taxi_drivers'); apply('taxi_drivers', search)}} style={btnStyle('taxi_drivers', tab==='taxi_drivers')}>🟡 Taxi {all.taxi_drivers.length}</button>

        <input type="text" placeholder="فلتر 03222222 / ID" value={search} onChange={e=>{setSearch(e.target.value); apply(tab, e.target.value)}} className="border-2 rounded-full px-4 py-2 w-80 ml-auto outline-none" style={{borderColor: COLORS[tab] || 'black', background: '#fffde7'}} />
        {search && <button onClick={()=>{setSearch(""); apply(tab, "")}} className="bg-gray-200 px-3 py-1 rounded-full">مسح</button>}
      </div>
      <div className="flex-1">
        <CustomerMapAll data={view} colors={COLORS} />
      </div>
    </div>
  )
}
