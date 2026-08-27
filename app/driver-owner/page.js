"use client"
import { useEffect, useState, useRef } from "react"
import { createClient } from "@supabase/supabase-js"
import dynamic from "next/dynamic"

// خريطة السائق بدون خط - 3 نقاط بس
const DriverMap = dynamic(() => import("./DriverMap"), { ssr: false })

export default function DriverDashboard(){
  const [supabase, setSupabase] = useState(null)
  const [me, setMe] = useState(null)
  const [requests, setRequests] = useState([])
  const [allDetails, setAllDetails] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedPoint, setSelectedPoint] = useState(null) // {lat,lng,label}
  const [timer, setTimer] = useState(0) // ثواني
  const [showConfirm, setShowConfirm] = useState(false)
  const [collected, setCollected] = useState("")
  const [driverNote, setDriverNote] = useState("")
  const [myLocation, setMyLocation] = useState(null) // ضفناها
  const timerRef = useRef(null)
  const trackRef = useRef(null)

  useEffect(()=>{
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    setSupabase(createClient(url, key))
    fetch('/api/admin/me').then(r=>r.json()).then(setMe)
    // ضفنا تتبع موقع السائق للخريطة
    if(navigator.geolocation){
      navigator.geolocation.watchPosition(p=>setMyLocation({lat:p.coords.latitude, lng:p.coords.longitude}), ()=>{}, {enableHighAccuracy:true})
    }
  },[])

  // تحميل الطلبات - حسب القاموس اللي ثبتناه
  useEffect(()=>{
    if(!supabase || !me) return
    const load = async ()=>{
      setLoading(true)
      const driverId = me.relatedId || me.userId
      // Related ID هو Assigned Driver الحقيقي
      const { data } = await supabase.from('order_requuest')
        .select('*')
        .eq('Related ID', driverId)
        .eq('Approval Status', 'Approved')
        .in('Delivery Status', ['Pending','Picked Up','On The Way'])
        .limit(100)
      setRequests(data||[])
      // جيب المنتجات من order_details بناء على Request ID
      if(data && data.length>0){
        const ids = data.map(o=>o['Request ID']).filter(Boolean)
        const { data: det } = await supabase.from('order_details').select('*').in('Request ID', ids)
        setAllDetails(det||[])
      }
      setLoading(false)
    }
    load()
  },[supabase, me])

  // تايمر 25 دقيقة من اول Picked Up
  const startTimer = (order) => {
    setTimer(25*60)
    if(timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(()=>{
      setTimer(prev=>{
        if(prev <= 1){
          clearInterval(timerRef.current)
          // نزل رسالة تأخر بـ Admin Note
          if(order){
            supabase.from('order_requuest').update({ 
              'Admin Note': `تأخر - تجاوز 25 دقيقة - ${new Date().toLocaleTimeString()}` 
            }).eq('supa_id', order.supa_id).then(()=>{})
          }
          return 0
        }
        return prev-1
      })
    }, 1000)
  }

  // Live Tracking
  const startLiveTracking = (order, status) => {
    const intervalMs = status === 'Picked Up' ? 10000 : 5000
    if(trackRef.current) clearInterval(trackRef.current)
    
    const sendLocation = async () => {
      navigator.geolocation.getCurrentPosition(async (pos)=>{
        const locString = `${pos.coords.latitude},${pos.coords.longitude}`
        const now = new Date().toISOString()
        // 1- حدث جدول Driver Live tracking (الـ Live الحقيقي)
        await supabase.from('Driver Live tracking').upsert({
          'Driver ID': me.relatedId,
          'Order Request ID': order['Request ID'],
          'Current Location': locString,
          'Last Update': now,
          'Delivery Status': status
        }, { onConflict: 'Order Request ID' })
        // 2- حدث اخر لوكايشن بجدول order_requuest منشان الزبون يقرا من جدول واحد بس
        await supabase.from('order_requuest').update({ 
          'Current Location': locString 
        }).eq('supa_id', order.supa_id)
      })
    }
    sendLocation()
    trackRef.current = setInterval(sendLocation, intervalMs)
  }

  const updateStatus = async (row, newStatus)=>{
    // حفظ لوكايشن لحظة الاكشن متل قبل
    navigator.geolocation.getCurrentPosition(async (pos)=>{
      const locString = `${pos.coords.latitude},${pos.coords.longitude}`
      await supabase.from('order_requuest').update({ 
        'Delivery Status': newStatus,
        'Current Location': locString
      }).eq('supa_id', row.supa_id)
      
      if(newStatus === 'Picked Up'){
        setSelectedOrder(row)
        startTimer(row)
        startLiveTracking(row, 'Picked Up')
      }
      if(newStatus === 'On The Way'){
        if(trackRef.current) clearInterval(trackRef.current)
        startLiveTracking(row, 'On The Way')
      }
      if(newStatus === 'Delivered'){
        if(timerRef.current) clearInterval(timerRef.current)
        if(trackRef.current) clearInterval(trackRef.current)
        setTimer(0)
      }
    })
    setRequests(prev=>prev.map(r=> r.supa_id===row.supa_id ? {...r, 'Delivery Status': newStatus} : r))
  }

  const confirmDelivery = async ()=>{
    await supabase.from('order_requuest').update({
      'Delivery Status': 'Delivered',
      'Collected Amount': collected,
      'Driver Note': driverNote,
      'Final Payment Method': selectedOrder['Final Payment Method']
    }).eq('supa_id', selectedOrder.supa_id)
    setShowConfirm(false)
    location.reload()
  }

  const openGoogleMaps = ()=>{
    if(!selectedPoint) return
    const dest = `${selectedPoint.lat},${selectedPoint.lng}`
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`, '_blank')
  }

  const formatTimer = (s)=>{
    const m = Math.floor(s/60).toString().padStart(2,'0')
    const sec = (s%60).toString().padStart(2,'0')
    return `${m}:${sec}`
  }

  if(!me) return <div style={{padding:20, background:'#0a1930', color:'white', minHeight:'100vh'}}>تحميل...</div>

  return (
    <div style={{minHeight:'100vh', background:'#0a1930', color:'white'}}>
      <div style={{background:'#0e2242', padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:20}}>
        <div>أهلاً {me.name} {timer>0 && <span style={{marginLeft:10, background: timer<300 ? '#ef4444' : timer<600 ? '#facc15' : '#22c55e', padding:'4px 10px', borderRadius:20, fontWeight:900, color: timer<600 ? 'black' : 'white'}}>⏱️ {formatTimer(timer)}</span>}</div>
        <button onClick={async()=>{await fetch('/api/admin/logout',{method:'POST'}); window.location.href='/admin/login'}} style={{background:'rgba(239,68,68,0.2)', color:'#fca5a5', border:'1px solid #ef4444', padding:'6px 12px', borderRadius:8}}>خروج</button>
      </div>

      <div style={{padding:12, maxWidth:900, margin:'0 auto'}}>
        {requests.map(r=>{
          const isActive = ['Picked Up','On The Way'].includes(r['Delivery Status'])
          const isPending = r['Delivery Status']==='Pending'
          const prods = allDetails.filter(d=> d['Request ID'] === r['Request ID'])
          return (
            <div key={r.supa_id} style={{background:'#f3f1ec', color:'#111', borderRadius:14, padding:14, marginBottom:12, border: isActive ? '2px solid #f59e0b' : 'none'}}>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <b>{r['Request ID']}</b>
                <span style={{fontSize:12, padding:'3px 8px', borderRadius:20, background: isPending ? '#ddd' : '#111', color: isPending ? '#333' : 'white'}}>{r['Delivery Status']} - {r['Area']}</span>
              </div>
              
              {isPending ? (
                <div style={{marginTop:8, fontSize:12, opacity:0.7}}>السعر: {r['Total']|| r['Amount'] || ''} - {prods.length} منتج - تفاصيل مخفية حتى القبول</div>
              ) : (
                <>
                  {/* قسم المتجر */}
                  <div style={{background:'white', borderRadius:10, padding:10, marginTop:10}}>
                    <div style={{fontWeight:900, fontSize:11, opacity:0.5}}>🏪 قسم المتجر</div>
                    <div style={{fontSize:13, marginTop:4}}>المتجر: <b>{r['Store Name'] || r['Store ID'] || '-'}</b></div>
                  </div>
                  {/* قسم المنتجات - من order_details */}
                  <div style={{background:'white', borderRadius:10, padding:10, marginTop:8}}>
                    <div style={{fontWeight:900, fontSize:11, opacity:0.5}}>🛒 المنتجات - {prods.length} من order_details</div>
                    {prods.map((p,i)=>(
                      <div key={i} style={{display:'flex', justifyContent:'space-between', fontSize:12, padding:'5px 0', borderBottom:'1px solid #eee'}}>
                        <span>{p['Product Name'] || p['Product ID']}</span>
                        <span>x{p['Quantity'] || 1} - {p['Price'] || ''}</span>
                      </div>
                    ))}
                  </div>
                  {/* قسم الزبون */}
                  <div style={{background:'white', borderRadius:10, padding:10, marginTop:8}}>
                    <div style={{fontWeight:900, fontSize:11, opacity:0.5}}>🏠 قسم الزبون</div>
                    <div style={{fontSize:13}}>{r['Delivery Adress']}</div>
                    <div style={{fontSize:12, opacity:0.7}}>📞 {r['Customer Phone'] || r['Phone'] || '-'}</div>
                  </div>
                  {/* قسم الدفع */}
                  <div style={{background:'white', borderRadius:10, padding:10, marginTop:8}}>
                    <div style={{fontWeight:900, fontSize:11, opacity:0.5}}>💳 قسم الدفع</div>
                    <div style={{fontSize:13}}>الطريقة: <b>{r['Final Payment Method']}</b> - المبلغ: <b>{r['Total']}</b></div>
                  </div>

                  <div style={{height:250, marginTop:10, borderRadius:12, overflow:'hidden', border:'1px solid #ccc'}}>
                    <DriverMap 
                      storeLat={r['Store Latitude']}
                      storeLng={r['Store Longitude']}
                      customerLat={r['Customer Latitude']} 
                      customerLng={r['Customer Longitude']}
                      driverLat={myLocation?.lat}
                      driverLng={myLocation?.lng}
                      onSelectPoint={setSelectedPoint}
                    />
                  </div>
                  <button onClick={openGoogleMaps} disabled={!selectedPoint} style={{marginTop:8, width:'100%', background: selectedPoint ? '#111' : '#999', color:'white', padding:10, borderRadius:10, border:'none', fontWeight:900}}>
                    {selectedPoint ? `🧭 تنقل إلى ${selectedPoint.label}` : 'اختار نقطة على الخريطة للتنقل'}
                  </button>
                </>
              )}

              <div style={{display:'flex', gap:8, marginTop:10}}>
                {r['Delivery Status']==='Pending' && <button onClick={()=>updateStatus(r,'Picked Up')} style={{flex:1, background:'#2563eb', color:'white', padding:'10px', borderRadius:10, border:'none', fontWeight:900}}>استلام - بلش 25 دقيقة</button>}
                {r['Delivery Status']==='Picked Up' && <button onClick={()=>updateStatus(r,'On The Way')} style={{flex:1, background:'#f59e0b', color:'white', padding:'10px', borderRadius:10, border:'none', fontWeight:900}}>انطلق للزبون</button>}
                {r['Delivery Status']==='On The Way' && <button onClick={()=>{setSelectedOrder(r); setShowConfirm(true)}} style={{flex:1, background:'#22c55e', color:'white', padding:'10px', borderRadius:10, border:'none', fontWeight:900}}>تأكيد التوصيل</button>}
              </div>
            </div>
          )
        })}
      </div>

      {showConfirm && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50}}>
          <div style={{background:'white', color:'black', padding:20, borderRadius:16, width:320}}>
            <h3>تأكيد التوصيل - {selectedOrder?.['Request ID']}</h3>
            <div>المبلغ: {selectedOrder?.['Total']}</div>
            <div>الدفع: {selectedOrder?.['Final Payment Method']}</div>
            <input placeholder="Collected Amount" value={collected} onChange={e=>setCollected(e.target.value)} style={{width:'100%', marginTop:10, padding:8}}/>
            <input placeholder="Driver Note" value={driverNote} onChange={e=>setDriverNote(e.target.value)} style={{width:'100%', marginTop:8, padding:8}}/>
            <button onClick={confirmDelivery} style={{marginTop:12, width:'100%', background:'#111', color:'white', padding:10, borderRadius:10}}>تم التوصيل</button>
            <button onClick={()=>setShowConfirm(false)} style={{marginTop:8, width:'100%', background:'#eee', padding:8, borderRadius:10}}>إلغاء</button>
          </div>
        </div>
      )}
    </div>
  )
}
