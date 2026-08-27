"use client"
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
const AdminPendingMap = dynamic(()=>import('@/components/AdminPendingMap'), {ssr:false})

export default function PendingPage(){
  const [orders, setOrders] = useState([])
  const [selected, setSelected] = useState(null)
  const [drivers, setDrivers] = useState([])

  useEffect(()=>{
    fetch('/api/admin/pending-orders').then(r=>r.json()).then(setOrders)
  },[])

  // السائقين الاونلاين من Supabase - جدول Drivers
 useEffect(()=>{
  const load = async()=>{
    // جيبهن مباشر - ما بدنا API
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1','').replace(/\/$/,''),
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    const { data } = await sb.from('drivers').select('*').not('"Current Latitude"', 'is', null)
    setDrivers(data||[])
  }
  load()
  const i = setInterval(load, 5000)
  return ()=>clearInterval(i)
},[])
  const handleAssign = async(driver)=>{
    await fetch('/api/admin/assign-driver', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ requestID: selected.requestID, driverId: driver['Driver ID'] })
    })
    alert(`تم تعيين ${driver.Name} للطلب ${selected.requestID}`)
    setOrders(o=>o.filter(x=>x.requestID!==selected.requestID))
    setSelected(null)
  }

  return (
    <div className="p-6 grid grid-cols-4 gap-6 min-h-screen bg-slate-950 text-white" style={{direction:'rtl'}}>
      <div className="col-span-1 bg-white/5 rounded-2xl p-4 h- overflow-y-auto">
        <h2 className="font-bold text-xl mb-4">بندينغ ({orders.length})</h2>
        {orders.map(o=>(
          <div key={o.requestID} onClick={()=>setSelected(o)} className={`p-4 rounded-xl mb-3 cursor-pointer border ${selected?.requestID===o.requestID?'bg-purple-600 border-purple-600':'bg-white/5 border-white/10 hover:bg-white/10'}`}>
            <p className="font-bold">#{o.requestID?.slice(-6)}</p>
            <p className="text-sm mt-1">{o.customerName}</p>
            <p className="text-xs opacity-70">{o.mobile}</p>
            <p className="text- mt-1 opacity-50">{o.customerLat?.toFixed(4)}, {o.customerLng?.toFixed(4)}</p>
          </div>
        ))}
      </div>

      <div className="col-span-3 h- rounded-2xl overflow-hidden bg-white">
        {selected? (
          <AdminPendingMap
            order={selected}
            drivers={drivers}
            onAssign={handleAssign}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-black">اختار طلب من اليسار</div>
        )}
      </div>
    </div>
  )
}
