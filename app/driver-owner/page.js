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
  const [areasMap, setAreasMap] = useState({})
  const [usersMap, setUsersMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedPoint, setSelectedPoint] = useState(null)
  const [timers, setTimers] = useState({})
  const [showConfirm, setShowConfirm] = useState(false)
  const [collected, setCollected] = useState("")
  const [driverNote, setDriverNote] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("Cash")
  const [myLocation, setMyLocation] = useState(null)
  const [debug, setDebug] = useState("")
  const timersRef = useRef({})
  const trackRef = useRef(null)

  useEffect(()=>{
    setSupabase(createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
    fetch('/api/admin/me').then(r=>r.json()).then(setMe)
    if(navigator.geolocation){
      navigator.geolocation.watchPosition(p=>setMyLocation({lat:p.coords.latitude, lng:p.coords.longitude}), ()=>{}, {enableHighAccuracy:true})
    }
    return ()=>{
      Object.values(timersRef.current).forEach(clearInterval)
      if(trackRef.current) clearInterval(trackRef.current)
    }
  },[])

  const formatTimer = (s)=>`${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`
  const formatLBP = (n) => {
    if(!n) return '0 ل.ل'
    const num = parseFloat(String(n).replace(/,/g,'')) || 0
    return new Intl.NumberFormat('en-LB').format(num) + ' ل.ل'
  }

  const calcRemaining = (order) => {
    const pickupTimeStr = order['Pickup At']
    if(!pickupTimeStr) return 25*60
    const elapsed = Math.floor((Date.now() - new Date(pickupTimeStr).getTime())/1000)
    return Math.max(0, 25*60 - elapsed)
  }

  const startTimerForOrder = (order) => {
    const reqId = order['Request ID']
    if(timersRef.current[reqId]) clearInterval(timersRef.current[reqId])
    const initial = calcRemaining(order)
    setTimers(prev => ({...prev, [reqId]: initial }))
    timersRef.current[reqId] = setInterval(()=>{
      setTimers(prev => {
        const curr = prev[reqId]?? 0
        if(curr <= 1){
          clearInterval(timersRef.current[reqId])
          if(supabase){
            supabase.from('order_requuest').update({
              'Admin Note': `تأخر - تجاوز 25 دقيقة - الطلب ${reqId} - ${new Date().toLocaleString()}`
            }).eq('supa_id', order.supa_id).then(()=>{})
          }
          return {...prev, [reqId]: 0}
        }
        return {...prev, [reqId]: curr - 1}
      })
    }, 1000)
  }

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

        const storeIds = [...new Set((det||[]).map(d=>d['Store ID']).filter(Boolean))]
        if(storeIds.length>0){
          const { data: allStores } = await supabase.from('stores').select('*')
          const map = {}
          ;(allStores||[]).forEach(s=>{
            const id = s['e ID']
            map[id] = s
            map[String(id)] = s
          })
          setStoresMap(map)

          const areaCodes = [...new Set(Object.values(map).map(s=> s['Area']).filter(Boolean))]
          if(areaCodes.length>0){
            const { data: allAreas } = await supabase.from('areas').select('*')
            const amap = {}
            ;(allAreas||[]).forEach(a=>{
              amap[a['Area ID']] = a['Area Name']
              amap[String(a['Area ID'])] = a['Area Name']
            })
            setAreasMap(amap)
          }
        }

        const prodIds = [...new Set((det||[]).map(d=>d['Product ID']).filter(Boolean))]
        if(prodIds.length>0){
          const { data: allProds } = await supabase.from('products').select('*')
          const pmap = {}
          ;(allProds||[]).forEach(p=>{
            const pid = p['Product ID']
            pmap[pid] = p
            pmap[String(pid)] = p
            if(p['Products']) {
              pmap[p['Products']] = p
              pmap[String(p['Products'])] = p
            }
          })
          setProductsMap(pmap)
        }

        const customerIds = [...new Set((data||[]).map(r=> r['Costumer ID']).filter(Boolean))]
        if(customerIds.length>0){
          const { data: users } = await supabase.from('users').select('*').in('ID', customerIds)
          const umap = {}
          ;(users||[]).forEach(u=>{
            umap[u['ID']] = u
            umap[String(u['ID'])] = u
          })
          setUsersMap(umap)
        }

        data.filter(r=> r['Delivery Status']==='Picked Up' || r['Delivery Status']==='On The Way').forEach(order=>{
          startTimerForOrder(order)
        })

        const active = data.find(r=> r['Delivery Status']==='Picked Up' || r['Delivery Status']==='On The Way')
        if(active){
          setSelectedOrder(active)
          setPaymentMethod(active['Final Payment Method']||'Cash')
        }

        setDebug(`OK: ${data.length} طلبات - ${det?.length||0} منتج - ${storeIds.length} متجر`)
      } else {
        setDebug(`فاضي: driverId=${driverId} | error=${error?.message||'no error'}`)
      }
      setLoading(false)
    }
    load()
  },[supabase, me])

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
    const nowIso = new Date().toISOString()
    const updatedRow = {...row, 'Delivery Status': newStatus}
    if(newStatus==='Picked Up'){
      updatedRow['Pickup At'] = nowIso
    }
    setRequests(prev=>prev.map(r=> r.supa_id===row.supa_id? updatedRow : r))
    if(newStatus==='Picked Up' || newStatus==='On The Way') setSelectedOrder(updatedRow)

    const loc = await new Promise(resolve => {
      if(!navigator.geolocation) return resolve(null)
      navigator.geolocation.getCurrentPosition(pos=>resolve(`${pos.coords.latitude},${pos.coords.longitude}`), ()=>resolve(null), {timeout:4000})
    })

    let updateData = { 'Delivery Status': newStatus }
    if(newStatus==='Picked Up'){
      updateData['Pickup At'] = nowIso
    }
    if(loc) updateData['Current Location'] = loc

    const { error } = await supabase.from('order_requuest').update(updateData).eq('supa_id', row.supa_id)
    if(error){
      setDebug(`خطأ تحديث: ${error.message}`)
      return
    }

    if(newStatus==='Picked Up'){ startTimerForOrder(updatedRow); startLiveTracking(row,'Picked Up') }
    if(newStatus==='On The Way'){ if(trackRef.current) clearInterval(trackRef.current); startLiveTracking(row,'On The Way') }
    if(newStatus==='Delivered'){
      if(timersRef.current[row['Request ID']]) clearInterval(timersRef.current[row['Request ID']])
      if(trackRef.current) clearInterval(trackRef.current)
      setTimers(prev=>{ const c={...prev}; delete c[row['Request ID']]; return c })
    }
  }

  const confirmDelivery = async ()=>{
    const now = new Date()
    const nowIso = now.toISOString()
    const pickupStr = selectedOrder['Pickup At']
    let durationMin = null
    if(pickupStr){
      durationMin = Math.ceil((now - new Date(pickupStr))/60000)
    }

    await supabase.from('order_requuest').update({
      'Delivery Status':'Delivered',
      'Delivered At': nowIso,
      'Delivery Duration Min': durationMin,
      'Collected Amount': collected,
      'Driver Note': driverNote,
      'Final Payment Method': paymentMethod
    }).eq('supa_id', selectedOrder.supa_id)

    if(timersRef.current[selectedOrder['Request ID']]) clearInterval(timersRef.current[selectedOrder['Request ID']])
    setShowConfirm(false)
    location.reload()
  }

  const openGoogleMaps = ()=>{ if(!selectedPoint) return; window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedPoint.lat},${selectedPoint.lng}&travelmode=driving`,'_blank') }

  if(!me) return <div style={{padding:20, background:'#0a1930', color:'white', minHeight:'100vh'}}>تحميل...</div>

  const pending = requests.filter(r=>r['Delivery Status']==='Pending').length
  const picked = requests.filter(r=>r['Delivery Status']==='Picked Up').length
  const onway = requests.filter(r=>r['Delivery Status']==='On The Way').length

  return (
    <div style={{minHeight:'100vh', background:'#0a1930', color:'white'}}>
      <div style={{background:'#0e2242', padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:20}}>
        <div style={{display:'flex', alignItems:'center', gap:10, flexWrap:'wrap'}}>
          <span>أهلاً {me.name}</span>
          {Object.entries(timers).map(([reqId, sec])=>(
            <span key={reqId} style={{background: sec===0? '#ef4444' : sec<300? '#ef4444' : sec<600? '#facc15' : '#22c55e', color: sec<600 || sec===0? 'white' : 'black', padding:'6px 16px', borderRadius:20, fontWeight:900, fontSize:12, border:'2px solid white'}}>
              ⏱ {reqId}: {sec===0? 'تأخر!' : formatTimer(sec)}
            </span>
          ))}
        </div>
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
          const isPicked = r['Delivery Status']==='Picked Up' || r['Delivery Status']==='On The Way'
          const firstStore = storesMap[storeIds[0]] || storesMap[String(storeIds[0])] || {}
          const customerId = r['Costumer ID']
          const customerPhone = r['Mobile'] || usersMap[customerId]?.['Mobile'] || usersMap[String(customerId)]?.['Mobile'] || '-'
          const whatsappNumber = usersMap[customerId]?.['WhatsApp Number'] || usersMap[String(customerId)]?.['WhatsApp Number'] || ''
          const waClean = String(whatsappNumber).replace(/[^0-9]/g,'')
          const waLink = waClean? `https://wa.me/${waClean}` : null

          const storeLat = firstStore['Current Latitude']
          const storeLng = firstStore['Current Longitude']
          const customerLat = r['Customer Latitude']
          const customerLng = r['Customer Longitude']

          let orderTotal = 0
          prods.forEach(p=>{
            const qty = parseFloat(p['Qty'] || 1)
            const price = parseFloat(p['Unit Price'] || 0)
            orderTotal += qty * price
          })
          if(orderTotal===0) orderTotal = parseFloat(r['Total Amount'] || r['Total'] || 0)

          return (
            <div key={r.supa_id} style={{background:'#f3f1ec', color:'#111', borderRadius:14, padding:14, marginBottom:12, border: isPicked? '3px solid #22c55e' : 'none'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <b>{r['Request ID']}</b>
                <div style={{display:'flex', gap:6, alignItems:'center'}}>
                  {timers[r['Request ID']]!==undefined && <span style={{background: timers[r['Request ID']]===0? '#ef4444' : timers[r['Request ID']]<300? '#ef4444' : timers[r['Request ID']]<600? '#facc15' : '#22c55e', color: timers[r['Request ID']]<600? 'white' : 'black', padding:'4px 12px', borderRadius:20, fontWeight:900, fontSize:12}}>⏱ {timers[r['Request ID']]===0? 'تأخر!' : formatTimer(timers[r['Request ID']])}</span>}
                  <span style={{fontSize:12, padding:'3px 8px', borderRadius:20, background: isPending? '#ddd' : '#111', color: isPending? '#333' : 'white'}}>{r['Delivery Status']}</span>
                </div>
              </div>

              {isPending? <div style={{marginTop:8, fontSize:12}}>السعر: {formatLBP(r['Total Amount']||r['Total'])} - {prods.length} منتج - تفاصيل مخفية حتى القبول</div> : <>
                <div style={{background:'white', borderRadius:10, padding:10, marginTop:10}}>
                  <div style={{fontWeight:900, fontSize:11, opacity:0.5}}>🏪 قسم المتجر - {storeIds.length} متجر</div>
                  {storeIds.map(sid=>{
                    const s = storesMap[sid] || storesMap[String(sid)] || {}
                    const areaCode = s['Area']
                    const areaName = areasMap[areaCode] || areasMap[String(areaCode)] || areaCode || ''
                    const storeName = s['Store Name'] || 'متجر'
                    return <div key={sid} style={{fontSize:13, marginTop:6, padding:'6px', background:'#f3f3f3', borderRadius:8}}><b>{storeName}</b> / {areaName} / {s['Adress'] || ''}</div>
                  })}
                </div>

                <div style={{background:'white', borderRadius:10, padding:10, marginTop:8}}>
                  <div style={{fontWeight:900, fontSize:11, opacity:0.5}}>🛒 المنتجات - {prods.length} منتج</div>
                  {prods.map((p,i)=>{
                    const prodInfo = productsMap[p['Product ID']] || productsMap[String(p['Product ID'])] || {}
                    const prodName = prodInfo['Product Name'] || p['Product ID'] || 'منتج'
                    const unit = prodInfo['Unit'] || ''
                    const qty = parseFloat(p['Qty'] || 1)
                    const unitPrice = parseFloat(p['Unit Price'] || 0)
                    const lineTotal = qty * unitPrice
                    const storeName = storesMap[p['Store ID']]?.['Store Name'] || storesMap[String(p['Store ID'])]?.['Store Name'] || ''
                    return (
                      <div key={i} style={{display:'flex', flexDirection:'column', fontSize:12, padding:'8px 0', borderBottom:'1px solid #eee'}}>
                        <div style={{display:'flex', justifyContent:'space-between', fontWeight:700}}>
                          <span>{prodName} {unit? `(${unit})` : ''}</span>
                          <span>x{qty}</span>
                        </div>
                        <div style={{display:'flex', justifyContent:'space-between', opacity:0.7, fontSize:11, marginTop:2}}>
                          <span>🏪 {storeName} - {formatLBP(unitPrice)} للوحدة</span>
                          <span style={{fontWeight:900}}>{formatLBP(lineTotal)}</span>
                        </div>
                      </div>
                    )
                  })}
                  <div style={{display:'flex', justifyContent:'space-between', fontWeight:900, fontSize:14, marginTop:10, paddingTop:8, borderTop:'2px solid #111'}}>
                    <span>قيمة الاوردر:</span><span>{formatLBP(orderTotal)}</span>
                  </div>
                </div>

                <div style={{background:'white', borderRadius:10, padding:10, marginTop:8}}>
                  <div style={{fontWeight:900, fontSize:11, opacity:0.5}}>🏠 قسم الزبون</div>
                  <div style={{fontSize:13, marginTop:4}}>{r['Delivery Adress'] || r['Address'] || '-'}</div>
                  <div style={{display:'flex', gap:6, marginTop:8, alignItems:'center'}}>
                    <div style={{fontSize:12, background:'#f0f9ff', padding:'8px', borderRadius:6, flex:1}}>📞 {customerPhone}</div>
                    {waLink && <a href={waLink} target="_blank" style={{background:'#25D366', color:'white', padding:'8px 12px', borderRadius:6, textDecoration:'none', fontWeight:900, fontSize:12}}>واتساب</a>}
                    <a href={`tel:${customerPhone}`} style={{background:'#111', color:'white', padding:'8px 12px', borderRadius:6, textDecoration:'none', fontWeight:900, fontSize:12}}>اتصال</a>
                  </div>
                </div>

                <div style={{background:'white', borderRadius:10, padding:10, marginTop:8}}>
                  <div style={{fontWeight:900, fontSize:11, opacity:0.5}}>💳 قسم الدفع</div>
                  <div style={{fontSize:13}}>الطريقة: <b>{r['Final Payment Method']||'Cash'}</b> - المبلغ: <b>{formatLBP(r['Total Amount']||r['Total']||'')}</b></div>
                </div>

                <div style={{height:280, marginTop:10, borderRadius:12, overflow:'hidden', border:'1px solid #ccc'}}>
                  {storeLat && storeLng? (
                    <DriverMap storeLat={storeLat} storeLng={storeLng} customerLat={customerLat} customerLng={customerLng} driverLat={myLocation?.lat} driverLng={myLocation?.lng} onSelectPoint={setSelectedPoint} />
                  ) : (
                    <div style={{padding:20, textAlign:'center'}}>موقع المتجر غير موجود - {JSON.stringify(firstStore).slice(0,100)}</div>
                  )}
                </div>
                <button onClick={openGoogleMaps} style={{marginTop:8, width:'100%', background: selectedPoint? '#111' : '#999', color:'white', padding:10, borderRadius:10, fontWeight:900}}>{selectedPoint? `🧭 تنقل إلى ${selectedPoint.label}` : 'اختار نقطة على الخريطة للتنقل'}</button>
              </>}

              <div style={{display:'flex', gap:8, marginTop:10}}>
                {r['Delivery Status']==='Pending' && <button onClick={()=>updateStatus(r,'Picked Up')} style={{flex:1, background:'#2563eb', color:'white', padding:'10px', borderRadius:10, fontWeight:900}}>استلام - بلش 25 دقيقة</button>}
                {r['Delivery Status']==='Picked Up' && <button onClick={()=>updateStatus(r,'On The Way')} style={{flex:1, background:'#f59e0b', color:'white', padding:'10px', borderRadius:10, fontWeight:900}}>انطلق للزبون {timers[r['Request ID']]!==undefined? `- ${formatTimer(timers[r['Request ID']])}` : ''}</button>}
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
            {timers[selectedOrder?.['Request ID']]>0 && <div style={{background:'#dcfce7', padding:8, borderRadius:8, textAlign:'center', fontWeight:900, marginTop:8}}>⏱ الوقت المتبقي: {formatTimer(timers[selectedOrder?.['Request ID']])}</div>}
            <select value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)} style={{width:'100%', padding:8, borderRadius:8, border:'1px solid #ccc', marginTop:10}}>
              <option value="Cash">Cash</option>
              <option value="Wish Money">Wish Money</option>
              <option value="Whish Money">Whish Money</option>
            </select>
            <input placeholder="Collected Amount" value={collected} onChange={e=>setCollected(e.target.value)} style={{width:'100%', marginTop:10, padding:8, borderRadius:8, border:'1px solid #ccc'}}/>
            <input placeholder="Driver Note" value={driverNote} onChange={e=>setDriverNote(e.target.value)} style={{width:'100%', marginTop:8, padding:8, borderRadius:8, border:'1px solid #ccc'}}/>
            <button onClick={confirmDelivery} style={{marginTop:12, width:'100%', background:'#111', color:'white', padding:10, borderRadius:10}}>تم التوصيل {selectedOrder?.['Pickup At']? `(${Math.ceil((new Date() - new Date(selectedOrder['Pickup At']))/60000)} دقيقة)` : ''}</button>
            <button onClick={()=>setShowConfirm(false)} style={{marginTop:8, width:'100%', background:'#eee', padding:8, borderRadius:10}}>إلغاء</button>
          </div>
        </div>
      )}
    </div>
  )
}
