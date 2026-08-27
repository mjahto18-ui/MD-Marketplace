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
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedPoint, setSelectedPoint] = useState(null) // {lat,lng,label}
  const [timer, setTimer] = useState(0) // ثواني
  const [showConfirm, setShowConfirm] = useState(false)
  const [collected, setCollected] = useState("")
  const [driverNote, setDriverNote] = useState("")
  const timerRef = useRef(null)
  const trackRef = useRef(null)

  useEffect(()=>{
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    setSupabase(createClient(url, key))
    fetch('/api/admin/me').then(r=>r.json()).then(setMe)
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
      setLoading(false)
    }
    load()
  },[supabase, me])

  // تايمر 25 دقيقة من اول Picked Up
  const startTimer = () => {
    setTimer(25*60)
    if(timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(()=>{
      setTimer(prev=>{
        if(prev <= 1){
          clearInterval(timerRef.current)
          // نزل رسالة تأخر بـ Admin Note
          if(selectedOrder){
            supabase.from('order_requuest').update({ 
              'Admin Note': `تأخر - تجاوز 25 دقيقة - ${new Date().toLocaleTimeString()}` 
            }).eq('supa_id', selectedOrder.supa_id).then(()=>{})
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
        startTimer()
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
    const origin = '' // بياخد موقع السائق الحالي تلقائي
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
      <div style={{background:'#0e2242', padding:'10px 14px', display:'flex', justifyContent:'space-between'}}>
        <div>أهلاً {me.name} {timer>0 && <span style={{marginLeft:10, color: timer<300 ? '#ef4444' : timer<600 ? '#facc15' : '#22c55e', fontWeight:900}}>⏱️ {formatTimer(timer)}</span>}</div>
        <button onClick={async()=>{await fetch('/api/admin/logout',{method:'POST'}); window.location.href='/admin/login'}}>خروج</button>
      </div>

      <div style={{padding:12, maxWidth:900, margin:'0 auto'}}>
        {requests.map(r=>{
          const isActive = ['Picked Up','On The Way'].includes(r['Delivery Status'])
          const isPending = r['Delivery Status']==='Pending'
          return (
            <div key={r.supa_id} style={{background:'#f3f1ec', color:'#111', borderRadius:14, padding:14, marginBottom:12}}>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <b>{r['Request ID']}</b>
                <span style={{fontSize:12}}>{r['Delivery Status']} - {r['Area']}</span>
              </div>
              
              {isPending ? (
                <div style={{marginTop:8, fontSize:12, opacity:0.7}}>السعر: {r['Total']||''} - تفاصيل مخفية حتى القبول</div>
              ) : (
                <>
                  <div style={{fontSize:13, marginTop:6}}>{r['Delivery Adress']}</div>
                  <div style={{height:250, marginTop:10, borderRadius:12, overflow:'hidden'}}>
                    <DriverMap 
                      customerLat={r['Customer Latitude']} 
                      customerLng={r['Customer Longitude']}
                      onSelectPoint={setSelectedPoint}
                    />
                  </div>
                  {selectedPoint && (
                    <button onClick={openGoogleMaps} style={{marginTop:8, width:'100%', background:'#111', color:'white', padding:10, borderRadius:10}}>
                      🧭 تنقل إلى {selectedPoint.label}
                    </button>
                  )}
                </>
              )}

              <div style={{display:'flex', gap:8, marginTop:10}}>
                {r['Delivery Status']==='Pending' && <button onClick={()=>updateStatus(r,'Picked Up')} style={{background:'#2563eb', color:'white', padding:'8px 14px', borderRadius:10}}>استلام</button>}
                {r['Delivery Status']==='Picked Up' && <button onClick={()=>updateStatus(r,'On The Way')} style={{background:'#f59e0b', color:'white', padding:'8px 14px', borderRadius:10}}>انطلق</button>}
                {r['Delivery Status']==='On The Way' && <button onClick={()=>setShowConfirm(true)} style={{background:'#22c55e', color:'white', padding:'8px 14px', borderRadius:10}}>تأكيد التوصيل</button>}
              </div>
            </div>
          )
        })}
      </div>

      {showConfirm && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div style={{background:'white', color:'black', padding:20, borderRadius:16, width:320}}>
            <h3>تأكيد التوصيل - {selectedOrder?.['Request ID']}</h3>
            <div>المبلغ: {selectedOrder?.['Total']}</div>
            <div>الدفع: {selectedOrder?.['Final Payment Method']}</div>
            <input placeholder="Collected Amount" value={collected} onChange={e=>setCollected(e.target.value)} style={{width:'100%', marginTop:10, padding:8}}/>
            <input placeholder="Driver Note" value={driverNote} onChange={e=>setDriverNote(e.target.value)} style={{width:'100%', marginTop:8, padding:8}}/>
            <button onClick={confirmDelivery} style={{marginTop:12, width:'100%', background:'#111', color:'white', padding:10, borderRadius:10}}>تم التوصيل</button>
          </div>
        </div>
      )}
    </div>
  )
}
