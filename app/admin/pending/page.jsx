"use client"
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
const AdminPendingMap = dynamic(()=>import('@/components/AdminPendingMap'), {ssr:false})

export default function PendingPage(){
  const [orders, setOrders] = useState([])
  const [selected, setSelected] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [drivers, setDrivers] = useState([])
  const [details, setDetails] = useState([])
  const [showProducts, setShowProducts] = useState(false)

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

  const openOrder = (o)=>{
    const id = o.requestID
    setSelected(o)
    if(expandedId === id) setExpandedId(null)
    else setExpandedId(id)
  }

  const loadProducts = async(requestID)=>{
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data: det } = await sb.from('order_details').select('*').eq('"Request ID"', requestID)
    const pIds = [...new Set((det||[]).map(d=>String(d['Product ID']).trim()).filter(Boolean))]
    const { data: prods } = pIds.length? await sb.from('products').select('*').in('"Product ID"', pIds) : {data:[]}
    const pMap = {}; (prods||[]).forEach(p=> pMap[String(p['Product ID']).trim()] = p['Product Name'] || p['Name'] || p['Product ID'])
    setDetails((det||[]).map(d=>({...d, productName: pMap[String(d['Product ID']).trim()] || d['Product ID']})))
    setShowProducts(true)
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
                  <p><b>العنوان:</b> {o.deliveryAddress || '-'}</p>
                  <p><b>المنطقة:</b> {o.areaName || o.areaCode || '-'} </p>
                  <p><b>قيمة الغراض:</b> {o.itemsCost || 0}</p>
                  <p><b>دلفري:</b> {o.deliveryFee || 0}</p>
                  <p><b>المجموع:</b> {o.totalAmount || 0}</p>
                  <p><b>تلفون:</b> {o.mobile}</p>
                  <p><b>ملاحظات:</b> {o.note || '-'}</p>
                  <button onClick={()=>loadProducts(o.requestID)} className="w-full mt-3 bg-purple-600 hover:bg-purple-700 rounded-lg py-2 text-xs font-bold">🛒 شوف المنتجات</button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="col-span-3 rounded-2xl overflow-hidden bg-white relative" style={{height:'calc(100vh - 48px)'}}>
        {selected? <AdminPendingMap order={selected} drivers={drivers} onAssign={handleAssign}/> : <div className="h-full flex items-center justify-center text-black">اختار طلب من اليسار</div>}

        {showProducts && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 p-6">
            <div className="bg-slate-900 rounded-2xl p-6 w- max-h- overflow-auto">
              <div className="flex justify-between mb-4"><h3 className="font-bold">منتجات #{String(selected?.requestID).slice(-6)}</h3><button onClick={()=>setShowProducts(false)}>✕</button></div>
              {details.map((d,i)=>(
                <div key={i} className="flex justify-between py-2 border-b border-white/10 text-sm">
                  <span>{d.productName} x{d['Qty']}</span>
                  <span>{d['Line Total']}</span>
                </div>
              ))}
              {details.length===0 && <p className="opacity-60 text-sm">ما في منتجات - تأكد ان Request ID متطابق</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
