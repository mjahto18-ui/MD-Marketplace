"use client"
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
const AdminPendingMap = dynamic(()=>import('@/components/AdminPendingMap'), {ssr:false})

export default function PendingPage(){
  const [orders, setOrders] = useState([])
  const [selected, setSelected] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [drivers, setDrivers] = useState([])
  const [detailsMap, setDetailsMap] = useState({})

  useEffect(()=>{
    fetch('/api/admin/pending-orders').then(r=>r.json()).then(setOrders)
  },[])

  useEffect(()=>{
    const load = async()=>{
      const { createClient } = await import('@supabase/supabase-js')
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      const { data } = await sb.from('drivers').select('*').not('Current Latitude','is',null)
      setDrivers(data||[])
    }
    load()
  },[])

  const openOrder = async(o)=>{
    const id = o.requestID
    setSelected(o)
    const willOpen = expandedId!==id
    setExpandedId(willOpen? id : null)
    if(willOpen &&!detailsMap[id]){
      const { createClient } = await import('@supabase/supabase-js')
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      const { data: det } = await sb.from('order_details').select('*').eq('"Request ID"', id)
      const pIds = [...new Set((det||[]).map(d=>String(d['Product ID']).trim()).filter(Boolean))]
      const sIds = [...new Set((det||[]).map(d=>String(d['Store ID']).trim()).filter(Boolean))]
      const { data: prods } = pIds.length? await sb.from('products').select('*').in('"Product ID"', pIds) : {data:[]}
      const { data: stores } = sIds.length? await sb.from('stores').select('"Store ID", "Store Name", "Adress"').in('"Store ID"', sIds) : {data:[]}
      const pMap = {}; (prods||[]).forEach(p=> pMap[String(p['Product ID']).trim()] = p['Product Name'] || p['Name'] || p['Product ID'])
      const sMap = {}; (stores||[]).forEach(s=> sMap[String(s['Store ID']).trim()] = { name: s['Store Name'], adress: s['Adress'] })
      const enriched = (det||[]).map(d=>({
       ...d,
        productName: pMap[String(d['Product ID']).trim()] || d['Product ID'],
        storeName: sMap[String(d['Store ID']).trim()]?.name || d['Store ID'],
        storeAdress: sMap[String(d['Store ID']).trim()]?.adress || ''
      }))
      setDetailsMap(prev=>({...prev, [id]: enriched}))
    }
  }

  const handleAssign = async(driver)=>{
    if(!selected) return
    const reqID = selected.requestID
    const driverId = driver['Driver ID']
    const res = await fetch('/api/admin/assign-driver',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestID:reqID,driverId})})
    const result = await res.json()
    if(!res.ok){ alert(result.error); return }
    alert(`تم تعيين ${driver['Driver Name']}`)
    setOrders(o=>o.filter(x=>x.requestID!==reqID)); setSelected(null); setExpandedId(null)
  }

  return (
    <div className="p-6 grid grid-cols-4 gap-6 min-h-screen bg-slate-950 text-white" style={{direction:'rtl'}}>
      <div className="col-span-1 bg-white/5 rounded-2xl p-4 overflow-y-auto">
        <h2 className="font-bold text-xl mb-4">بندينغ ({orders.length})</h2>
        {orders.map(o=>{
          const isOpen = expandedId===o.requestID
          const prods = detailsMap[o.requestID] || []
          return (
            <div key={o.requestID} className={`rounded-xl mb-3 border ${selected?.requestID===o.requestID?'border-purple-600':'border-white/10'}`}>
              <div onClick={()=>openOrder(o)} className={`p-4 cursor-pointer ${isOpen?'bg-white/10':''} rounded-xl`}>
                <p className="font-bold">#{String(o.requestID).slice(-6)}</p>
                <p className="text-sm mt-1">{o.customerName}</p>
                <p className="text-xs opacity-70">{o.mobile} - {o.areaName || o.areaCode}</p>
              </div>
              {isOpen && (
                <div className="p-4 bg-black/30 space-y-2 rounded-b-xl border-t border-white/10 text-sm">
                  <p><b>الاسم:</b> {o.customerName}</p>
                  <p><b>تلفون:</b> {o.mobile}</p>
                  <p><b>المنطقة:</b> {o.areaName || o.areaCode || '-'} </p>
                  <p><b>العنوان:</b> {o.deliveryAddress || '-'}</p>
                  <p><b>سعر المنتجات:</b> {o.itemsCost || 0}</p>
                  <p><b>دلفري:</b> {o.deliveryFee || 0}</p>
                  <p><b>المجموع:</b> {o.totalAmount || 0}</p>
                  
                  
                  <p><b>ملاحظات:</b> {o.note || '-'}</p>
                  <div className="mt-3 bg-white/5 rounded-lg p-3">
                    <p className="font-bold text-xs mb-2 opacity-60">🛒 المنتجات ({prods.length})</p>
                    {prods.length===0? <p className="text-xs opacity-50">جاري تحميل المنتجات...</p> : prods.map((d,i)=>(
                      <div key={i} className="py-1.5 border-b border-white/5 last:border-0 text-xs">
                        <div className="flex justify-between"><span className="font-bold">{d.productName} x{d['Qty']}</span><span>{d['Line Total'] || d['Unit Price']}</span></div>
                        <div className="opacity-70 text- mt-1">🏪 {d.storeName} {d.storeAdress? `- ${d.storeAdress}`:''}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="col-span-3 rounded-2xl overflow-hidden bg-white relative" style={{height:'calc(100vh - 48px)'}}>
        {selected? <AdminPendingMap order={selected} drivers={drivers} onAssign={handleAssign}/> : <div className="h-full flex items-center justify-center text-black">اختار طلب من اليسار</div>}
      </div>
    </div>
  )
}
