"use client"
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
const AdminPendingMap = dynamic(()=>import('@/components/AdminPendingMap'), {ssr:false})

export default function PendingPage(){
  const [orders, setOrders] = useState([])
  const [selected, setSelected] = useState(null)
  const [drivers, setDrivers] = useState([])

  useEffect(()=>{
    fetch('/api/admin/pending-orders').then(r=>r.json()).then(d=>{
      console.log('ORDERS:', d) // شوف بالـ F12 شو اسم الحقل
      setOrders(d)
    })
  },[])

  useEffect(()=>{
    const load = async()=>{
      const { createClient } = await import('@supabase/supabase-js')
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1','').replace(/\/$/,''),
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
      const { data, error } = await sb.from('drivers').select('*').not('"Current Latitude"', 'is', null)
      if(error) console.log('DRIVERS ERROR:', error)
      else setDrivers(data||[])
    }
    load()
    const i = setInterval(load, 10000)
    return ()=>clearInterval(i)
  },[])

  const handleAssign = async(driver)=>{
    if(!selected) return
    
    const reqID = selected.requestID || selected['Request ID'] || selected['requestID']
    const driverId = driver['Driver ID']
    const driverName = driver['Driver Name'] || driverId

    console.log('Assigning', reqID, 'to', driverId)

    const res = await fetch('/api/admin/assign-driver', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ requestID: reqID, driverId })
    })
    const result = await res.json()
    console.log('RESULT:', result)

    if(!res.ok){
      alert('فشل: ' + result.error)
      return
    }

    alert(`تم تعيين ${driverName} للطلب ${reqID}`)
    setOrders(o=>o.filter(x=> (x.requestID || x['Request ID']) !== reqID))
    setSelected(null)
  }

  return (
    <div className="p-6 grid grid-cols-4 gap-6 min-h-screen bg-slate-950 text-white" style={{direction:'rtl'}}>
      <div className="col-span-1 bg-white/5 rounded-2xl p-4 overflow-y-auto">
        <h2 className="font-bold text-xl mb-4">بندينغ ({orders.length})</h2>
        {orders.map(o=>{
          const id = o.requestID || o['Request ID'] || o['requestID']
          return (
            <div key={id} onClick={()=>setSelected(o)} className={`p-4 rounded-xl mb-3 cursor-pointer border ${selected && (selected.requestID || selected['Request ID'])===id?'bg-purple-600 border-purple-600':'bg-white/5 border-white/10 hover:bg-white/10'}`}>
              <p className="font-bold">#{String(id).slice(-6)}</p>
              <p className="text-sm mt-1">{o.customerName || o['Customer Name']}</p>
              <p className="text-xs opacity-70">{o.mobile || o['Mobile']}</p>
            </div>
          )
        })}
      </div>

      <div className="col-span-3 rounded-2xl overflow-hidden bg-white" style={{height:'calc(100vh - 48px)'}}>
        {selected? (
          <AdminPendingMap
            order={{
              ...selected,
              requestID: selected.requestID || selected['Request ID'],
              customerLat: selected.customerLat || parseFloat(selected['Latitude']),
              customerLng: selected.customerLng || parseFloat(selected['Longitude'])
            }}
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
