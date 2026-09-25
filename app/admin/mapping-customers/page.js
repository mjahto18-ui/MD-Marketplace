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
  customers_yes: '#16a34a', // اخضر - taxi yes
  customers_no: '#7f1d1d', // احمر غامق - taxi no بلوك
  customers_null: '#9ca3af', // رمادي - null مخفي
  customers: '#ef4444',
  stores: '#3b82f6',
  drivers: '#22c55e',
  taxi_drivers: '#facc15'
}

export default function MappingCustomerPage() {
  const [all, setAll] = useState({ customers:[], stores:[], drivers:[], taxi_drivers:[] })
  const [view, setView] = useState([])
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState("")
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  useEffect(() => { fetchAll() }, [])

  const fetchAllPaginated = async (table, cols) => {
    let allData = []
    let from = 0
    const step = 1000
    while(true){
      const { data, error } = await supabase.from(table).select(cols).range(from, from+step-1)
      if(error) throw error
      if(!data || data.length===0) break
      allData = [...allData,...data]
      if(data.length < step) break
      from+=step
    }
    return allData
  }

  const fetchAll = async () => {
    // ✅ بنجيب كلشي بلا limit - بيجيب 4000 زبون و 10000 يوزر دفعات
    const [c,s,d,t,u] = await Promise.all([
      fetchAllPaginated('customers', '"Customer ID","Name","Mobile","Area","Status","Current Latitude","Current Longtitude","Registration Latitude","Registration Longitude","Free Delivery Remaining"'),
      fetchAllPaginated('stores', '"Store Name","Mobile","Category","Area","Adress","Status","Delivery Available","Open Time","Close Time","Current Latitude","Current Longitude"'),
      fetchAllPaginated('drivers', '"Driver Name","Mobile","Area","Status","VehicleTyp","Avg Rating","Total Delivered","Current Latitude","Current Longitude"'),
      fetchAllPaginated('taxi_drivers', 'full_name, phone, area, address, vehicle_type, car_color, seats, status, is_online, average_rating, total_orders, rating_level, "Current Latitude", "Current Longitude", lat, lng'),
      fetchAllPaginated('users', '"Customer ID",taxi') // ✅ بس عمودين - خفيف للـ 10000
    ])

    // ✅ Map سريع Customer ID 5555 -> taxi yes/no/null
    const taxiMap = new Map(
      (u||[]).filter(x=> x["Customer ID"]).map(x=>[String(x["Customer ID"]).trim(), x.taxi?? null])
    )

    const customers = (c||[]).map((x,i)=>{
      const cid = String(x["Customer ID"]||'').trim()
      return {
        key: `c-${cid || i}`,
        realCustomerId: cid,
        userId: null, // ما بقى بدنا User ID
        name: x['Name'] || 'زبون',
        mobile: x['Mobile'] || '',
        full_mobile: x['Mobile'] || '',
        address: x['Area'] || '',
        status: x['Status'] || '',
        extra: `مجاني: ${x['Free Delivery Remaining']||0} - ${x['Status']||''}`,
        taxi_status: taxiMap.get(cid)?? null, // yes/no/null من users
        lat: parseFloat(x['Current Latitude']||x['Registration Latitude']),
        lng: parseFloat(x['Current Longtitude']||x['Registration Longitude']),
        type: 'customers'
      }
    }).filter(x=>!isNaN(x.lat)&&x.lat!==0)

    const stores = (s||[]).map((x,i)=>({
      key: `s-${i}`, name: x['Store Name'] || 'متجر', mobile: x['Mobile'] || '', full_mobile: x['Mobile'] || '',
      address: x['Area'] || x['Adress'] || '', status: x['Status'] || '',
      extra: `${x['Category']||''} - ${x['Delivery Available']==='yes'?'دليفري ✅':'بلا دليفري'}`,
      lat: parseFloat(x['Current Latitude']), lng: parseFloat(x['Current Longitude']), type: 'stores'
    })).filter(x=>!isNaN(x.lat))

    const drivers = (d||[]).map((x,i)=>({
      key: `d-${i}`, name: x['Driver Name'] || 'سائق', mobile: x['Mobile'] || '',
      full_mobile: x['Mobile'] || '', address: x['Area'] || '', status: x['Status'] || '',
      extra: `${x['VehicleTyp']||''} - ⭐${x['Avg Rating']||0}`, lat: parseFloat(x['Current Latitude']), lng: parseFloat(x['Current Longitude']), type: 'drivers'
    })).filter(x=>!isNaN(x.lat))

    const taxi_drivers = (t||[]).map((x,i)=>({
      key: `t-${i}`, name: x['full_name'] || 'تاكسي', mobile: x['phone'] || '', full_mobile: x['phone'] || '',
      address: x['area'] || x['address'] || '', status: x['is_online']? 'online' : 'offline',
      extra: `${x['vehicle_type']||'car'} ${x['car_color']||''}`, lat: parseFloat(x['Current Latitude'] || x['lat']), lng: parseFloat(x['Current Longitude'] || x['lng']), type: 'taxi_drivers'
    })).filter(x=>!isNaN(x.lat)&&x.lat!==0)

    setAll({customers, stores, drivers, taxi_drivers})
    setView([...customers,...stores,...drivers,...taxi_drivers].map(b=>({...b, isMatch:false})))
  }

  const apply = (newTab, phoneVal) => {
    let base = newTab==='customers'? all.customers : newTab==='stores'? all.stores : newTab==='drivers'? all.drivers : newTab==='taxi_drivers'? all.taxi_drivers : [...all.customers,...all.stores,...all.drivers,...all.taxi_drivers]
    if(!phoneVal) setView(base.map(b=>({...b, isMatch:false})))
    else {
      const q = phoneVal.toLowerCase()
      const matched = base.filter(b=> String(b.full_mobile).includes(phoneVal) || String(b.name).toLowerCase().includes(q))
      setView(matched.map(b=>({...b, isMatch:true})))
    }
  }

  const btnStyle = (key, active) => ({
    background: active? COLORS[key] : '#f3f4f6',
    color: active? (key==='taxi_drivers'?'black':'white') : 'black',
    border: `2px solid ${COLORS[key] || 'black'}`,
    padding: '8px 16px', borderRadius: '9999px', fontWeight: '900', fontSize: '13px'
  })

  if(all.customers.length===0 && all.taxi_drivers.length===0 && all.stores.length===0) return <div className="p-6">عم حمل... {all.customers.length}</div>

  return (
    <div className="h-screen flex flex-col">
      <div className="p-3 bg-white shadow flex gap-2 items-center flex-wrap">
       <BackToDashboard />
        <button onClick={()=>{setTab('all'); apply('all', search)}} style={{...btnStyle('customers', tab==='all'), background: tab==='all'? 'black':'#f3f4f6', borderColor: 'black'}}>All {all.customers.length+all.stores.length+all.drivers.length+all.taxi_drivers.length}</button>
        <button onClick={()=>{setTab('customers'); apply('customers', search)}} style={btnStyle('customers', tab==='customers')}>🔴 Customers {all.customers.length}</button>
        <button onClick={()=>{setTab('stores'); apply('stores', search)}} style={btnStyle('stores', tab==='stores')}>🔵 Stores {all.stores.length}</button>
        <button onClick={()=>{setTab('drivers'); apply('drivers', search)}} style={btnStyle('drivers', tab==='drivers')}>🟢 Drivers {all.drivers.length}</button>
        <button onClick={()=>{setTab('taxi_drivers'); apply('taxi_drivers', search)}} style={btnStyle('taxi_drivers', tab==='taxi_drivers')}>🟡 Taxi {all.taxi_drivers.length}</button>
        <input type="text" placeholder="فلتر اسم / رقم" value={search} onChange={e=>{setSearch(e.target.value); apply(tab, e.target.value)}} className="border-2 rounded-full px-4 py-2 w-80 ml-auto outline-none" style={{borderColor: 'black', background: '#fffde7'}} />
      </div>
      <div className="flex-1">
        <CustomerMapAll data={view} />
      </div>
    </div>
  )
}
