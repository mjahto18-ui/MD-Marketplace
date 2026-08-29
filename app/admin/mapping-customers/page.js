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
  const [all, setAll] = useState({ customers:[], stores:[], drivers:[] })
  const [view, setView] = useState([])
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState("")

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    const [c,s,d] = await Promise.all([
      supabase.from('customers').select('*').limit(1000),
      supabase.from('stores').select('*').limit(500),
      supabase.from('drivers').select('*').limit(500)
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

    setAll({customers, stores, drivers})
    setView([...customers,...stores,...drivers].map(b=>({...b, isMatch:false})))
  }

  const apply = (newTab, phoneVal) => {
    let base = []
    if(newTab==='customers') base = all.customers
    else if(newTab==='stores') base = all.stores
    else if(newTab==='drivers') base = all.drivers
    else base = [...all.customers,...all.stores,...all.drivers]

    if(!phoneVal){
      setView(base.map(b=>({...b, isMatch:false})))
    } else {
      const matched = base.filter(b=> String(b.mobile).includes(phoneVal) || String(b.id).toLowerCase().includes(phoneVal.toLowerCase()))
      setView(matched.map(b=>({...b, isMatch:true})))
    }
  }

  if(all.customers.length===0 && all.stores.length===0) return <div className="p-6">عم حمل...</div>

  return (
    <div className="h-screen flex flex-col">
      <div className="p-3 bg-white shadow flex gap-2 items-center flex-wrap">
        <button onClick={()=>{setTab('all'); apply('all', search)}} className={`px-4 py-2 rounded-full text-sm font-bold ${tab==='all'?'bg-black text-white':'bg-gray-100'}`}>All {all.customers.length+all.stores.length+all.drivers.length}</button>
        <button onClick={()=>{setTab('customers'); apply('customers', search)}} className={`px-4 py-2 rounded-full text-sm font-bold ${tab==='customers'?'bg-red-500 text-white':'bg-gray-100'}`}>Customers {all.customers.length}</button>
        <button onClick={()=>{setTab('stores'); apply('stores', search)}} className={`px-4 py-2 rounded-full text-sm font-bold ${tab==='stores'?'bg-blue-600 text-white':'bg-gray-100'}`}>Stores {all.stores.length}</button>
        <button onClick={()=>{setTab('drivers'); apply('drivers', search)}} className={`px-4 py-2 rounded-full text-sm font-bold ${tab==='drivers'?'bg-green-600 text-white':'bg-gray-100'}`}>Drivers {all.drivers.length}</button>

        <input type="text" placeholder="فلتر 03222222 / ID" value={search} onChange={e=>{setSearch(e.target.value); apply(tab, e.target.value)}} className="border-2 border-red-500 rounded-full px-4 py-2 w-80 ml-auto bg-yellow-50 outline-none" />
        {search && <button onClick={()=>{setSearch(""); apply(tab, "")}} className="bg-gray-200 px-3 py-1 rounded-full">مسح</button>}
      </div>
      <div className="flex-1">
        <CustomerMapAll data={view} />
      </div>
    </div>
  )
}
