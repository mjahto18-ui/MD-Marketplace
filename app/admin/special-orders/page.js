"use client"
import { useEffect, useState } from 'react'
import BackToDashboard from "@/components/BackToDashboard"

export default function SpecialOrdersPage(){
  const [orders, setOrders] = useState([])
  const [selected, setSelected] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [price, setPrice] = useState("")
  const [deliveryFee, setDeliveryFee] = useState("")
  const [adminNote, setAdminNote] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    fetch('/api/admin/special-orders').then(r=>r.json()).then(d=> setOrders(d.orders || []))
  },[])

  const openOrder = (o)=>{
    const id = o.requestID
    setSelected(o)
    setExpandedId(expandedId!==id ? id : null)
    setPrice(o.unitPrice || "")
    setDeliveryFee(o.deliveryFee || "")
    setAdminNote(o.adminNote || "")
  }

  const handleApprove = async ()=>{
    if(!selected) return
    if(!price || !deliveryFee){ alert("حط سعر القطعة وتكلفة التوصيل أولاً"); return; }
    setLoading(true)
    const res = await fetch('/api/admin/special-orders/approve', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ requestId: selected.requestID, price: parseFloat(price), deliveryFee: parseFloat(deliveryFee), adminNote }) })
    const d = await res.json()
    setLoading(false)
    if(d.success){ alert("تمت الموافقة!"); setOrders(o=>o.filter(x=>x.requestID!==selected.requestID)); setSelected(null); setExpandedId(null); }
    else alert(d.message || "خطأ")
  }

  const handleReject = async ()=>{
    if(!selected) return
    if(!confirm("متأكد بدك ترفض؟")) return
    await fetch('/api/admin/special-orders/approve', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ requestId: selected.requestID, reject: true, adminNote }) })
    setOrders(o=>o.filter(x=>x.requestID!==selected.requestID)); setSelected(null); setExpandedId(null);
  }

  return (
    <div className="p-6 grid grid-cols-4 gap-6 min-h-screen bg-slate-950 text-white" style={{direction:'rtl'}}>
      <div className="col-span-1 bg-white/5 rounded-2xl p-4 overflow-y-auto">
        <BackToDashboard />
        <h2 className="font-bold text-xl mb-4">طلبات خاصة ({orders.length})</h2>
        {orders.map(o=>{
          const isOpen = expandedId===o.requestID
          return (
            <div key={o.requestID} className={`rounded-xl mb-3 border ${selected?.requestID===o.requestID?'border-purple-600':'border-white/10'}`}>
              <div onClick={()=>openOrder(o)} className={`p-4 cursor-pointer ${isOpen?'bg-white/10':''} rounded-xl`}>
                <p className="font-bold">#{String(o.requestID).slice(-6)}</p>
                <p className="text-sm mt-1">{o.customerName}</p>
                <p className="text-xs opacity-70">{o.mobile} - {o.areaName || o.areaCode}</p>
                <p className="text-xs mt-1 text-yellow-300">{o.orderText} - كمية {o.quantity}</p>
              </div>
              {isOpen && (
                <div className="p-4 bg-black/30 space-y-2 rounded-b-xl border-t border-white/10 text-sm">
                  <p><b>الاسم:</b> {o.customerName}</p>
                  <p><b>تلفون:</b> {o.mobile}</p>
                  <p><b>المنطقة:</b> {o.areaName || o.areaCode || '-'}</p>
                  <p><b>العنوان:</b> {o.deliveryAddress || '-'}</p>
                  <p><b>الطلب:</b> {o.orderText}</p>
                  <p><b>المتجر المقترح:</b> {o.storeHint || '-'}</p>
                  <p><b>الكمية:</b> {o.quantity}</p>
                  <p><b>ملاحظات:</b> {o.note || '-'}</p>
                  {o.imageUrl && <img src={o.imageUrl} className="w-full aspect-square object-cover rounded-xl mt-2" />}
                </div>
              )}
            </div>
          )
        })}
        {orders.length===0 && <p className="text-sm opacity-50">ما فيه طلبات خاصة</p>}
      </div>

      <div className="col-span-3 rounded-2xl overflow-hidden bg-white text-black p-6" style={{height:'calc(100vh - 48px)', overflowY:'auto'}}>
        {selected ? (
          <div>
            <h2 className="font-bold text-xl mb-4">معاينة الطلب #{String(selected.requestID).slice(-6)}</h2>
            <div className="space-y-2 text-sm bg-slate-50 rounded-xl p-4">
              <p><b>الطلب:</b> {selected.orderText}</p>
              <p><b>الكمية:</b> {selected.quantity}</p>
              <p><b>الزبون:</b> {selected.customerName} - {selected.mobile}</p>
              <p><b>العنوان:</b> {selected.deliveryAddress}</p>
              <p><b>المتجر:</b> {selected.storeHint || '-'}</p>
              <p><b>ملاحظات:</b> {selected.note || '-'}</p>
            </div>
            {selected.imageUrl && <img src={selected.imageUrl} className="w-full max-w- aspect-square object-cover rounded-xl mt-4 mx-auto" />}

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-4">
              <p className="font-bold">📍 المسافة: {selected.distanceKm ? `${selected.distanceKm} كيلو` : 'رح تنحسب عند اختيار المتجر'}</p>
              <p className="text-xs text-slate-500 mt-1">السيستم بيحسبها من موقع المتجر لموقع الزبون - انت بس بتشوفها وبتحط التوصيل</p>
            </div>

            <div className="mt-4 space-y-3">
              <div><label className="text-sm font-bold">سعر القطعة *</label><input value={price} onChange={e=>setPrice(e.target.value)} type="number" className="w-full border rounded-xl p-3 mt-1" placeholder="مثلا 300000" /></div>
              <div><label className="text-sm font-bold">تكلفة التوصيل *</label><input value={deliveryFee} onChange={e=>setDeliveryFee(e.target.value)} type="number" className="w-full border rounded-xl p-3 mt-1" placeholder="مثلا 120000" /></div>
              <div><label className="text-sm font-bold">ملاحظات الأدمن</label><textarea value={adminNote} onChange={e=>setAdminNote(e.target.value)} className="w-full border rounded-xl p-3 mt-1 h-20" /></div>
              {price && deliveryFee && <p className="text-center font-bold">الإجمالي: {(parseFloat(price||0)*(selected.quantity||1) + parseFloat(deliveryFee||0)).toLocaleString()} ل.ل</p>}
              <div className="flex gap-3">
                <button onClick={handleApprove} disabled={loading} className="flex-1 bg-green-600 text-white font-bold py-3 rounded-2xl">{loading?'جاري...':'موافقة ✅'}</button>
                <button onClick={handleReject} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-2xl">رفض</button>
              </div>
            </div>
          </div>
        ) : <div className="h-full flex items-center justify-center">اختار طلب من اليسار</div>}
      </div>
    </div>
  )
}
