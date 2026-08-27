"use client"
import { useEffect, useState, useRef } from "react"
import { createClient } from "@supabase/supabase-js"
import dynamic from "next/dynamic"
const DriverMap = dynamic(() => import("./DriverMap"), { ssr: false })

export default function DriverDashboard(){
  const [supabase, setSupabase] = useState(null)
  const [me, setMe] = useState(null)
  const [requests, setRequests] = useState([])
  const [allDetails, setAllDetails] = useState([])
  const [storesMap, setStoresMap] = useState({})
  const [productsMap, setProductsMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedPoint, setSelectedPoint] = useState(null)
  const [timer, setTimer] = useState(0)
  const [showConfirm, setShowConfirm] = useState(false)
  const [collected, setCollected] = useState("")
  const [driverNote, setDriverNote] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("Cash")
  const [myLocation, setMyLocation] = useState(null)
  const [debug, setDebug] = useState("")
  const timerRef = useRef(null)
  const trackRef = useRef(null)

  useEffect(()=>{
    setSupabase(createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
    fetch('/api/admin/me').then(r=>r.json()).then(setMe)
    if(navigator.geolocation){
      navigator.geolocation.watchPosition(p=>setMyLocation({lat:p.coords.latitude, lng:p.coords.longitude}), ()=>{}, {enableHighAccuracy:true})
    }
  },[])

  useEffect(()=>{
    if(!supabase ||!me) return
    const load = async ()=>{
      setLoading(true)
      const driverId = me.relatedId || me.userId
      const { data, error } = await supabase.from('order_requuest').select('*').eq('Assigned Driver', driverId).eq('Approval Status','Approved').in('Delivery Status',['Pending','Picked Up','On The Way']).limit(100)
      setRequests(data||[])

      if(data && data.length>0){
        const ids = data.map(o=>o['Request ID']).filter(Boolean)
        const { data: det } = await supabase.from('order_details').select('*').in('Request ID', ids)
        setAllDetails(det||[])

        // جيب المتاجر
        const storeIds = [...new Set((det||[]).map(d=>d['Store ID']).filter(Boolean))]
        if(storeIds.length>0){
          const { data: stores } = await supabase.from('stores').select('*').in('Store ID', storeIds)
          const map = {}
          ;(stores||[]).forEach(s=>{ map[s['Store ID']] = s })
          setStoresMap(map)
        }

        // جيب اسماء المنتجات
        const prodIds = [...new Set((det||[]).map(d=>d['Product ID']).filter(Boolean))]
        if(prodIds.length>0){
          const { data: prods } = await supabase.from('product_base_data').select('*').in('Product ID', prodIds)
          const pmap = {}
          ;(prods||[]).forEach(p=>{ pmap[p['Product ID']] = p })
          setProductsMap(pmap)
        }

        // اذا في اوردر مفتوح رجع التايمر بعد الرفرش
        const active = data.find(r=> r['Delivery Status']==='Picked Up' || r['Delivery Status']==='On The Way')
        if(active){
          setSelectedOrder(active)
          setPaymentMethod(active['Final Payment Method'] || 'Cash')
          if(active['Delivery Status']==='Picked Up'){
            const saved = localStorage.getItem('timer_'+active['Request ID'])
            if(saved){
              const elapsed = Math.floor((Date.now()-parseInt(saved))/1000)
              const remaining = Math.max(0, 25*60 - elapsed)
              setTimer(remaining)
              if(remaining>0) startTimerInterval(active)
            } else {
              startTimerInterval(active)
            }
          }
        }

        setDebug(`OK: ${data.length} طلبات - ${det?.length||0} منتج - ${storeIds.length} متجر`)
      } else {
        setDebug(`فاضي: driverId=${driverId} | error=${error?.message||'no error'}`)
      }
      setLoading(false)
    }
    load()
  },[supabase, me])

  const startTimerInterval = (order) => {
    if(timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(()=>{
      setTimer(prev=>{
        if(prev <= 1){ clearInterval(timerRef.current); supabase.from('order_requuest').update({ 'Admin Note': `تأخر - ${new Date().toLocaleTimeString()}` }).eq('supa_id', order.supa_id).then(()=>{}); return 0 }
        return prev-1
      })
    }, 1000)
  }

  const startTimer = (order) => {
    localStorage.setItem('timer_'+order['Request ID'], Date.now().toString())
    setTimer(25*60)
    startTimerInterval(order)
  }

  const startLiveTracking = (order, status) => {
    if(trackRef.current) clearInterval(trackRef.current)
    const send = async () => {
      navigator.geolocation.getCurrentPosition(async (pos)=>{
        const loc = `${pos.coords.latitude},${pos.coords.longitude}`
        await supabase.from('Driver Live tracking').upsert({ 'Driver ID': me.relatedId, 'Order Request ID': order['Request ID'], 'Current Location': loc, 'Last Update': new Date().toISOString(), 'Delivery Status': status }, { onConflict: 'Order Request ID' })
        await supabase.from('order_requuest').update({ 'Current Location': loc }).eq('supa_id', order.supa_id)
      })
    }
    send(); trackRef.current = setInterval(send, status==='Picked Up'?10000:5000)
  }

  const updateStatus = async (row, newStatus)=>{
    navigator.geolocation.getCurrentPosition(async (pos)=>{
      const loc = `${pos.coords.latitude},${pos.coords.longitude}`
      await supabase.from('order_requuest').update({ 'Delivery Status': newStatus, 'Current Location': loc }).eq('supa_id', row.supa_id)
      if(newStatus==='Picked Up'){ setSelectedOrder(row); startTimer(row); startLiveTracking(row,'Picked Up') }
      if(newStatus==='On The Way'){ if(trackRef.current) clearInterval(trackRef.current); startLiveTracking(row,'On The Way') }
      if(newStatus==='Delivered'){ if(timerRef.current) clearInterval(timerRef.current); if(trackRef.current) clearInterval(trackRef.current); localStorage.removeItem('timer_'+row['Request ID']); setTimer(0) }
    })
    setRequests(prev=>prev.map(r=> r.supa_id===row.supa_id? {...r, 'Delivery Status': newStatus} : r))
  }

  const confirmDelivery = async ()=>{
    await supabase.from('order_requuest').update({ 'Delivery Status':'Delivered', 'Collected Amount': collected, 'Driver Note': driverNote, 'Final Payment Method': paymentMethod }).eq('supa_id', selectedOrder.supa_id)
    localStorage.removeItem('timer_'+selectedOrder['Request ID'])
    setShowConfirm(false)
    location.reload()
  }

  const openGoogleMaps = ()=>{ if(!selectedPoint) return; window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedPoint.lat},${selectedPoint.lng}&travelmode=driving`,'_blank') }
  const formatTimer = (s)=>`${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`

  if(!me) return <div style={{padding:20, background:'#0a1930', color:'white', minHeight:'100vh'}}>تحميل...</div>

  const pending = requests.filter(r=>r['Delivery Status']==='Pending').length
  const picked = requests.filter(r=>r['Delivery Status']==='Picked Up').length
  const onway = requests.filter(r=>r['Delivery Status']==='On The Way').length

  return (
    <div style={{minHeight:'100vh', background:'#0a1930', color:'white'}}>
      <div style={{background:'#0e2242', padding:'10px 14px', display:'flex', justifyContent:'space-between', position:'sticky', top:0, zIndex:20}}>
        <div>أهلاً {me.name} {timer>0 && <span style={{marginLeft:10, background: timer<300? '#ef4444' : '#22c55e', padding:'4px 10px', borderRadius:20, fontWeight:900}}>⏱ {formatTimer(timer)}</span>}</div>
        <button onClick={async()=>{await fetch('/api/admin/logout',{method:'POST'}); location.href='/admin/login'}} style={{background:'#ef444444', border:'1px solid #ef4444', color:'#fca5a5', padding:'6px 12px', borderRadius:8}}>خروج</button>
      </div>

      <div style={{padding:12, maxWidth:900, margin:'0 auto'}}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8, marginBottom:12}}>
          <div style={{background:'#f3f1ec', color:'#111', borderRadius:12, padding:12, textAlign:'center'}}><div style={{fontSize:22, fontWeight:900}}>{requests.length}</div><div style={{fontSize:10}}>الكل</div></div>
          <div style={{background:'#fef3c7', color:'#111', borderRadius:12, padding:12, textAlign:'center'}}><div style={{fontSize:22, fontWeight:900}}>{pending}</div><div style={{fontSize:10}}>Pending</div></div>
          <div style={{background:'#dbeafe', color:'#111', borderRadius:12, padding:12, textAlign:'center'}}><div style={{fontSize:22, fontWeight:900}}>{picked}</div><div style={{fontSize:10}}>Picked</div></div>
          <div style={{background:'#ffedd5', color:'#111', borderRadius:12, padding:12, textAlign:'center'}}><div style={{fontSize:22, fontWeight:900}}>{onway}</div><div style={{fontSize:10}}>On Way</div></div>
        </div>

        <div style={{background:'rgba(255,255,255,0.08)', borderRadius:12, padding:12, fontSize:11, marginBottom:12}}>
          <div>📍 موقعك: {myLocation? `${myLocation.lat.toFixed(5)}, ${myLocation.lng.toFixed(5)}` : 'بانتظار GPS...'}</div>
          <div style={{marginTop:6, color:'#facc15'}}>🔍 {debug}</div>
        </div>

        {requests.map(r=>{
          const prods = allDetails.filter(d=> String(d['Request ID']) === String(r['Request ID']))
          const storeIds = [...new Set(prods.map(p=>p['Store ID']).filter(Boolean))]
          const isPending = r['Delivery Status']==='Pending'
          const firstStore = storesMap[storeIds[0]] || {}
          return (
            <div key={r.supa_id} style={{background:'#f3f1ec', color:'#111', borderRadius:14, padding:14, marginBottom:12, border: r['Delivery Status']==='On The Way'? '2px solid #f59e0b' : 'none'}}>
              <div style={{display:'flex', justifyContent:'space-between'}}><b>{r['Request ID']}</b><span style={{fontSize:12, padding:'3px 8px', borderRadius:20, background: isPending? '#ddd' : '#111', color: isPending? '#333' : 'white'}}>{r['Delivery Status']}</span></div>

              {isPending? <div style={{marginTop:8, fontSize:12}}>السعر: {r['Total Amount']||r['Total']||''} - {prods.length} منتج</div> : <>
                {/* المتاجر - اكتر من متجر */}
                <div style={{background:'white', borderRadius:10, padding:10, marginTop:10}}>
                  <div style={{fontWeight:900, fontSize:11, opacity:0.5}}>🏪 قسم المتجر - {storeIds.length} متجر</div>
                  {storeIds.map(sid=>{
                    const s = storesMap[sid]
                    return <div key={sid} style={{fontSize:13, marginTop:6, padding:'6px', background:'#f9f9', borderRadius:8}}>
                      <b>{s?.['Store Name'] || sid}</b> - {s?.['Area']||''} - {s?.['Phone']||''}
                      <div style={{fontSize:11, opacity:0.6}}>Lat: {s?.['Latitude']||s?.['Store Latitude']||'-'} Lng: {s?.['Longitude']||s?.['Store Longitude']||'-'}</div>
                    </div>
                  })}
                </div>

                {/* المنتجات مع اسم المتجر والحجم والكمية الصح */}
                <div style={{background:'white', borderRadius:10, padding:10, marginTop:8}}>
                  <div style={{fontWeight:900, fontSize:11, opacity:0.5}}>🛒 المنتجات - {prods.length} من order_details</div>
                  {prods.map((p,i)=>{
                    const prodInfo = productsMap[p['Product ID']] || {}
                    const storeName = storesMap[p['Store ID']]?.['Store Name'] || p['Store ID']
                    const qty = p['Qty'] || p['Quantity'] || 1
                    return (
                      <div key={i} style={{display:'flex', flexDirection:'column', fontSize:12, padding:'8px 0', borderBottom:'1px solid #eee'}}>
                        <div style={{display:'flex', justifyContent:'space-between', fontWeight:700}}>
                          <span>{prodInfo['Product Name'] || p['Product ID']}</span>
                          <span>x{qty}</span>
                        </div>
                        <div style={{display:'flex', justifyContent:'space-between', opacity:0.7, fontSize:11, marginTop:2}}>
                          <span>الحجم: {prodInfo['Size']||prodInfo['Variant']||'-'} | المتجر: {storeName}</span>
                          <span>{p['Unit Price']} = {p['Line Total']}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div style={{background:'white', borderRadius:10, padding:10, marginTop:8}}><div style={{fontWeight:900, fontSize:11, opacity:0.5}}>🏠 الزبون</div><div style={{fontSize:13}}>{r['Delivery Adress']} - {r['Area']}</div><div style={{fontSize:12, opacity:0.7}}>📞 {r['Customer Phone']||r['Phone']||'-'}</div></div>
                <div style={{background:'white', borderRadius:10, padding:10, marginTop:8}}><div style={{fontWeight:900, fontSize:11, opacity:0.5}}>💳 الدفع</div><div style={{fontSize:13}}>الطريقة: <b>{r['Final Payment Method']||'Cash'}</b> - المبلغ: <b>{r['Total Amount']||r['Total']}</b></div></div>

                <div style={{height:280, marginTop:10, borderRadius:12, overflow:'hidden', border:'1px solid #ccc'}}>
                  <DriverMap
                    storeLat={firstStore['Latitude']||firstStore['Store Latitude']||r['Store Latitude']}
                    storeLng={firstStore['Longitude']||firstStore['Store Longitude']||r['Store Longitude']}
                    customerLat={r['Customer Latitude']}
                    customerLng={r['Customer Longitude']}
                    driverLat={myLocation?.lat}
                    driverLng={myLocation?.lng}
                    onSelectPoint={setSelectedPoint}
                  />
                </div>
                <button onClick={openGoogleMaps} style={{marginTop:8, width:'100%', background: selectedPoint? '#111' : '#999', color:'white', padding:10, borderRadius:10, fontWeight:900}}>{selectedPoint? `🧭 تنقل إلى ${selectedPoint.label}` : 'اختار نقطة'}</button>
              </>}

              <div style={{display:'flex', gap:8, marginTop:10}}>
                {r['Delivery Status']==='Pending' && <button onClick={()=>updateStatus(r,'Picked Up')} style={{flex:1, background:'#2563eb', color:'white', padding:'10px', borderRadius:10, fontWeight:900}}>استلام - بلش 25 دقيقة</button>}
                {r['Delivery Status']==='Picked Up' && <button onClick={()=>updateStatus(r,'On The Way')} style={{flex:1, background:'#f59e0b', color:'white', padding:'10px', borderRadius:10, fontWeight:900}}>انطلق للزبون</button>}
                {r['Delivery Status']==='On The Way' && <button onClick={()=>{setSelectedOrder(r); setCollected(r['Total Amount']||r['Total']||''); setPaymentMethod(r['Final Payment Method']||'Cash'); setShowConfirm(true)}} style={{flex:1, background:'#22c55e', color:'white', padding:'10px', borderRadius:10, fontWeight:900}}>تأكيد التوصيل</button>}
              </div>
            </div>
          )
        })}
      </div>

      {showConfirm && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50}}>
          <div style={{background:'white', color:'black', padding:20, borderRadius:16, width:340}}>
            <h3>تأكيد التوصيل - {selectedOrder?.['Request ID']}</h3>
            <div style={{marginTop:8}}>المبلغ: {selectedOrder?.['Total Amount']}</div>
            <label style={{fontSize:12, marginTop:10, display:'block'}}>طريقة الدفع:</label>
            <select value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)} style={{width:'100%', padding:8, borderRadius:8, border:'1px solid #ccc', marginTop:4}}>
              <option value="Cash">Cash</option>
              <option value="Wish Money">Wish Money</option>
              <option value="Whish Money">Whish Money</option>
            </select>
            <input placeholder="Collected Amount" value={collected} onChange={e=>setCollected(e.target.value)} style={{width:'100%', marginTop:10, padding:8, borderRadius:8, border:'1px solid #ccc'}}/>
            <input placeholder="Driver Note" value={driverNote} onChange={e=>setDriverNote(e.target.value)} style={{width:'100%', marginTop:8, padding:8, borderRadius:8, border:'1px solid #ccc'}}/>
            <button onClick={confirmDelivery} style={{marginTop:12, width:'100%', background:'#111', color:'white', padding:10, borderRadius:10}}>تم التوصيل</button>
            <button onClick={()=>setShowConfirm(false)} style={{marginTop:8, width:'100%', background:'#eee', padding:8, borderRadius:10}}>إلغاء</button>
          </div>
        </div>
      )}
    </div>
  )
}
