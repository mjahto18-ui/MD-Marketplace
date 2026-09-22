"use client"
import { useEffect, useState, useRef } from "react"
import { createClient } from "@supabase/supabase-js"
import dynamic from "next/dynamic"
import CashPending from "./CashPending"
import { Star } from "lucide-react"
const DriverMap = dynamic(() => import("@/components/Stars"), { ssr: false })

function Stars({ rating = 0, size = 14 }) {
  const r = parseFloat(rating) || 0;
  let full = Math.floor(r);
  let half = false;
  const dec = r - full;
  if (dec >= 0.75) full += 1;
  else if (dec >= 0.25) half = true;
  const empty = Math.max(0, 5 - full - (half? 1 : 0));
  return (
    <div style={{display:'flex', alignItems:'center'}}>
      {[...Array(full)].map((_, i) => (
        <Star key={`f-${i}`} size={size} style={{fill:'#facc15', color:'#facc15'}} />
      ))}
      {half && (
        <div style={{position:'relative', width:size, height:size}}>
          <Star size={size} style={{position:'absolute', color:'rgba(255,255,255,0.2)'}} />
          <div style={{position:'absolute', overflow:'hidden', width:'50%'}}>
            <Star size={size} style={{fill:'#facc15', color:'#facc15'}} />
          </div>
        </div>
      )}
      {[...Array(empty)].map((_, i) => (
        <Star key={`e-${i}`} size={size} style={{color:'rgba(255,255,255,0.2)'}} />
      ))}
    </div>
  );
}

export default function DriverDashboard(){
  const [supabase, setSupabase] = useState(null)
  const [me, setMe] = useState(null)
  const [requests, setRequests] = useState([])
  const [allDetails, setAllDetails] = useState([])
  const [storesMap, setStoresMap] = useState({})
  const [productsMap, setProductsMap] = useState({})
  const [areasMap, setAreasMap] = useState({})
  const [usersMap, setUsersMap] = useState({})
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedPoint, setSelectedPoint] = useState(null)
  const [timers, setTimers] = useState({})
  const [showConfirm, setShowConfirm] = useState(false)
  const [collected, setCollected] = useState("")
  const [driverNote, setDriverNote] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("Cash")
  const [myLocation, setMyLocation] = useState(null)
  const [debug, setDebug] = useState("")
  const [isOnline, setIsOnline] = useState(true)
  const [activeTab, setActiveTab] = useState('orders')
  const [cashPendingCount, setCashPendingCount] = useState(0)
  const [cashPendingTotal, setCashPendingTotal] = useState(0)
  const [driverStats, setDriverStats] = useState(null)
  // --- جديد: محفظة ---
  const [wallet, setWallet] = useState(0)
  const [walletTx, setWalletTx] = useState([])
  const [showWallet, setShowWallet] = useState(false)
  const timersRef = useRef({})
  const trackRef = useRef(null)
  const driverLocationRef = useRef(null)

  useEffect(()=>{
    setSupabase(createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
    fetch('/api/admin/me').then(r=>r.json()).then(setMe)
    if(navigator.geolocation){
      navigator.geolocation.watchPosition(p=>setMyLocation({lat:p.coords.latitude, lng:p.coords.longitude}), ()=>{}, {enableHighAccuracy:true})
    }
    return ()=>{
      Object.values(timersRef.current).forEach(clearInterval)
      if(trackRef.current) clearInterval(trackRef.current)
      if(driverLocationRef.current) navigator.geolocation.clearWatch(driverLocationRef.current)
    }
  },[])

  useEffect(()=>{
    if(!supabase ||!me ||!isOnline) return
    const driverId = me.relatedId || me.userId
    if(!driverId) return
    if(!navigator.geolocation) return
    driverLocationRef.current = navigator.geolocation.watchPosition(async (pos)=>{
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      setMyLocation({lat, lng})
      await supabase.from('drivers').update({
        "Current Latitude": lat,
        "Current Longitude": lng,
        "Last Location Update": new Date().toISOString(),
        "Status": "Online"
      }).eq('"Driver ID"', driverId)
    }, ()=>{}, {enableHighAccuracy:true, maximumAge:0})
    return ()=>{ if(driverLocationRef.current) navigator.geolocation.clearWatch(driverLocationRef.current) }
  },[supabase, me, isOnline])

  const toggleOnline = async ()=>{
    if(!supabase ||!me) return
    const driverId = me.relatedId || me.userId
    const newStatus = isOnline? "Offline" : "Online"
    await supabase.from('drivers').update({"Status": newStatus, "Last Location Update": new Date().toISOString()}).eq('"Driver ID"', driverId)
    setIsOnline(!isOnline)
  }

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
    setTimers(prev => ({...prev, [reqId]: calcRemaining(order) }))
    timersRef.current[reqId] = setInterval(()=>{
      setTimers(prev => {
        const curr = prev[reqId]?? 0
        if(curr <= 1){
          clearInterval(timersRef.current[reqId])
          supabase?.from('order_requuest').update({ 'Admin Note': `تأخر - ${reqId} - ${new Date().toLocaleString()}` }).eq('supa_id', order.supa_id).then(()=>{})
          return {...prev, [reqId]: 0}
        }
        return {...prev, [reqId]: curr - 1}
      })
    }, 1000)
  }

  useEffect(()=>{
    if(!supabase ||!me) return
    const load = async ()=>{
      const driverId = me.relatedId || me.userId
      const userIdForWallet = me.userId

      // --- تقييم + محفظة ---
      const { data: drv } = await supabase.from('drivers').select('"Avg Rating", "Rating Count", "Total Delivered"').eq('"Driver ID"', driverId).single()
      if(drv) setDriverStats(drv)

      // --- هون جيب المحفظة حسب User ID (مربوط برقم التلفون) ---
      try{
        const w = await fetch(`/api/wallet/me?userId=${userIdForWallet}`, {cache:'no-store'}).then(r=>r.json())
        if(w.success){
          setWallet(w.wallet||0)
          setWalletTx(w.transactions||[])
        }
      }catch{}

      const { data } = await supabase.from('order_requuest').select('*').eq('Assigned Driver', driverId).eq('Approval Status','Approved').in('Delivery Status',['Pending','Picked Up','On The Way']).limit(100)
      setRequests(data||[])
      if(data && data.length>0){
        const ids = data.map(o=>o['Request ID']).filter(Boolean)
        const { data: det } = await supabase.from('order_details').select('*').in('Request ID', ids)
        setAllDetails(det||[])
        const storeIds = [...new Set((det||[]).map(d=>String(d['Store ID']).trim()).filter(Boolean))]
        if(storeIds.length>0){
          const { data: allStores } = await supabase.from('stores').select('*')
          const map = {}
          ;(allStores||[]).forEach(s=>{
            const raw = s['e ID'] || s['Store ID'] || s['ID']
            if(!raw) return
            map[String(raw).trim()] = s
            map[String(raw).trim().toLowerCase()] = s
          })
          setStoresMap(map)
          const { data: allAreas } = await supabase.from('areas').select('*')
          const amap = {}
          ;(allAreas||[]).forEach(a=>{
            amap[String(a['Area ID']).trim()] = a['Area Name']
            amap[String(a['Area ID']).trim().toLowerCase()] = a['Area Name']
          })
          setAreasMap(amap)
        }
        const prodIds = [...new Set((det||[]).map(d=>String(d['Product ID']).trim()).filter(Boolean))]
        if(prodIds.length>0){
          const { data: allProds } = await supabase.from('products').select('*')
          const pmap = {}
          ;(allProds||[]).forEach(p=>{
            const raw = p['Product ID']
            if(!raw) return
            const key = String(raw).trim()
            pmap[key] = p
            pmap[key.toLowerCase()] = p
            if(p['Products_Base_ID']) pmap[String(p['Products_Base_ID']).trim()] = p
          })
          setProductsMap(pmap)
        }
        const customerIds = [...new Set((data||[]).map(r=> String(r['Costumer ID']||'').trim()).filter(Boolean))]
        if(customerIds.length>0){
          const { data: users } = await supabase.from('users').select('*').in('ID', customerIds)
          const umap = {}
          ;(users||[]).forEach(u=>{ umap[String(u['ID']).trim()] = u })
          setUsersMap(umap)
        }
        data.filter(r=> r['Delivery Status']==='Picked Up' || r['Delivery Status']==='On The Way').forEach(order=>{ startTimerForOrder(order) })
        const active = data.find(r=> r['Delivery Status']==='Picked Up' || r['Delivery Status']==='On The Way')
        if(active){ setSelectedOrder(active); setPaymentMethod(active['Final Payment Method']||'Cash') }
        setDebug(`OK: ${data.length} اوردر - ${det?.length||0} منتج`)
      }
      const { data: cashData } = await supabase.from('order_requuest').select('Total Amount').eq('Assigned Driver', driverId).eq('Final Payment Method','Cash').eq('Cash Status','Pending')
      if(cashData){
        setCashPendingCount(cashData.length)
        setCashPendingTotal(cashData.reduce((s,o)=>s+parseFloat(o['Total Amount']||0),0))
      }
    }
    load()
  },[supabase, me])

  const startLiveTracking = (order, status) => {
  if(trackRef.current) clearInterval(trackRef.current)
  const send = async () => {
    navigator.geolocation.getCurrentPosition(async (pos)=>{
      const loc = `${pos.coords.latitude},${pos.coords.longitude}`
      const now = new Date().toISOString()
      await supabase.from('driver_live_tracking').upsert({ 'Driver ID': me.relatedId, 'Order Request ID': order['Request ID'], 'Current Location': loc, 'Last Update': now, 'Delivery Status': status }, { onConflict: 'Order Request ID' })
      await supabase.from('order_requuest').update({ 'Current Location': loc, 'Last Location Update': now }).eq('Request ID', order['Request ID'])
    })
  }
  send(); trackRef.current = setInterval(send, 10000)
}

  const updateStatus = async (row, newStatus)=>{
    const nowIso = new Date().toISOString()
    const updatedRow = {...row, 'Delivery Status': newStatus}
    if(newStatus==='Picked Up') updatedRow['Pickup At'] = nowIso
    setRequests(prev=>prev.map(r=> r.supa_id===row.supa_id? updatedRow : r))
    setSelectedOrder(updatedRow)
    let updateData = { 'Delivery Status': newStatus }
    if(newStatus==='Picked Up') updateData['Pickup At'] = nowIso
    await supabase.from('order_requuest').update(updateData).eq('supa_id', row.supa_id)
    if(newStatus==='Picked Up'){ startTimerForOrder(updatedRow); startLiveTracking(row,'Picked Up') }
    if(newStatus==='On The Way'){ startLiveTracking(row,'On The Way') }
  }
 const confirmDelivery = async ()=>{
    const now = new Date()
    const nowIso = now.toISOString()
    const pickupStr = selectedOrder['Pickup At']
    let durationMin = null
    if(pickupStr) durationMin = Math.ceil((now - new Date(pickupStr))/60000)
    const { error } = await supabase.from('order_requuest').update({
      'Delivery Status':'Delivered',
      'Delivered At': nowIso,
      'Delivery Duration': durationMin,
      'Collected Amount': collected,
      'Driver Note': driverNote,
      'Final Payment Method': paymentMethod,
      'Approval Status': 'Complete Orders'
    }).eq('supa_id', selectedOrder.supa_id)
    if(error) setDebug(`خطأ حفظ الوقت: ${error.message}`)
    else {
      if(trackRef.current) clearInterval(trackRef.current)
      location.reload()
    }
  }
  const openGoogleMaps = ()=>{ if(!selectedPoint) return; window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedPoint.lat},${selectedPoint.lng}&travelmode=driving`,'_blank') }

  const glassCard = {
    background:'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
    backdropFilter:'blur(20px)',
    border:'1px solid rgba(255,255,255,0.08)',
    boxShadow:'0 10px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
  }

  if(!me) return <div style={{padding:20, background:'radial-gradient(1200px at 20% -10%, #1a0b2e 0%, #0a0a14 45%, #080811 100%)', color:'white', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', width:'100%', maxWidth:'100vw', overflowX:'hidden', boxSizing:'border-box'}}>تحميل...</div>

  const pending = requests.filter(r=>r['Delivery Status']==='Pending').length
  const picked = requests.filter(r=>r['Delivery Status']==='Picked Up').length
  const onway = requests.filter(r=>r['Delivery Status']==='On The Way').length

  return (
    <div style={{minHeight:'100vh', background:'radial-gradient(1200px at 20% -10%, #1a0b2e 0%, #0a0a14 45%, #080811 100%)', color:'white', fontFamily:'Cairo, sans-serif', width:'100%', maxWidth:'100vw', overflowX:'hidden', boxSizing:'border-box'}}>
      <div style={{...glassCard, background:'rgba(10,10,20,0.7)', padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:20, width:'100%', maxWidth:'100vw', boxSizing:'border-box', overflowX:'hidden'}}>
        <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', minWidth:0, flex:1}}>
          <span style={{fontWeight:900, color:'white', whiteSpace:'nowrap'}}>أهلاً {me.name}</span>
          {driverStats && (
            <div style={{display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)', padding:'4px 10px', borderRadius:20, flexShrink:0}}>
              <Stars rating={driverStats["Avg Rating"]} size={14} />
              <span style={{fontSize:12, color:'#facc15', fontWeight:900}}>{Number(driverStats["Avg Rating"]||0).toFixed(1)}</span>
              <span style={{fontSize:10, opacity:0.6, color:'white'}}>({driverStats["Rating Count"]||0}) • {driverStats["Total Delivered"]||0}</span>
            </div>
          )}
          <button onClick={toggleOnline} style={{background: isOnline? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,#ef4444,#dc2626)', color:'white', padding:'6px 14px', borderRadius:20, fontWeight:900, fontSize:12, border:'1px solid rgba(255,255,255,0.15)', flexShrink:0}}>{isOnline? '🟢 Online' : '🔴 Offline'}</button>
          <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
            {Object.entries(timers).map(([reqId, sec])=>(
              <span key={reqId} style={{background: sec===0? '#ef4444' : sec<300? '#ef4444' : sec<600? '#facc15' : '#22c55e', color:'white', padding:'5px 10px', borderRadius:20, fontWeight:900, fontSize:11, border:'1px solid rgba(255,255,255,0.2)', whiteSpace:'nowrap'}}>⏱ {reqId}: {sec===0? 'تأخر!' : formatTimer(sec)}</span>
            ))}
          </div>
        </div>
        <button onClick={async()=>{await fetch('/api/admin/logout',{method:'POST'}); location.href='/admin/login'}} style={{background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', color:'#fca5a5', padding:'6px 12px', borderRadius:8, flexShrink:0, marginLeft:8}}>خروج</button>
      </div>

      <div style={{padding:12, maxWidth:900, width:'100%', margin:'0 auto', boxSizing:'border-box', overflowX:'hidden'}}>
        {/* --- كرت المحفظة الجديد - ما بينحشر عالتلفون --- */}
        <div onClick={()=>setShowWallet(true)} style={{background:'linear-gradient(135deg,#10b981,#059669)', color:'white', borderRadius:16, padding:14, marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', border:'2px solid rgba(255,255,255,0.2)', width:'100%', boxSizing:'border-box'}}>
          <div style={{minWidth:0}}>
            <div style={{fontSize:11, opacity:0.9}}>👛 محفظتي</div>
            <div style={{fontSize:26, fontWeight:900, marginTop:2}}>{formatLBP(wallet)}</div>
            <div style={{fontSize:11, opacity:0.8, marginTop:2}}>اضغط لعرض التفاصيل</div>
          </div>
          <div style={{fontSize:32, flexShrink:0}}>💳</div>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8, marginBottom:12, width:'100%', boxSizing:'border-box'}}>
          <div style={{...glassCard, borderRadius:12, padding:12, textAlign:'center'}}><div style={{fontSize:22, fontWeight:900, color:'white'}}>{requests.length}</div><div style={{fontSize:10, color:'rgba(255,255,255,0.6)'}}>الكل</div></div>
          <div style={{...glassCard, borderRadius:12, padding:12, textAlign:'center', borderColor:'rgba(251,191,36,0.2)'}}><div style={{fontSize:22, fontWeight:900, color:'#fde68a'}}>{pending}</div><div style={{fontSize:10, color:'rgba(255,255,255,0.6)'}}>Pending</div></div>
          <div style={{...glassCard, borderRadius:12, padding:12, textAlign:'center', borderColor:'rgba(59,130,246,0.2)'}}><div style={{fontSize:22, fontWeight:900, color:'#93c5fd'}}>{picked}</div><div style={{fontSize:10, color:'rgba(255,255,255,0.6)'}}>Picked</div></div>
          <div style={{...glassCard, borderRadius:12, padding:12, textAlign:'center', borderColor:'rgba(249,115,22,0.2)'}}><div style={{fontSize:22, fontWeight:900, color:'#fdba74'}}>{onway}</div><div style={{fontSize:10, color:'rgba(255,255,255,0.6)'}}>On Way</div></div>
        </div>

        <div style={{display:'flex', gap:8, marginBottom:12, width:'100%', boxSizing:'border-box'}}>
          <button onClick={()=>setActiveTab('orders')} style={{flex:1, background: activeTab==='orders'?'linear-gradient(135deg,#ec4899,#8b5cf6)':'rgba(255,255,255,0.06)', color:'white', padding:12, borderRadius:10, fontWeight:900, border:'1px solid rgba(255,255,255,0.1)', minWidth:0}}>📦 اوردراتي ({requests.length})</button>
          <button onClick={()=>setActiveTab('cash')} style={{flex:1, background: activeTab==='cash'?'linear-gradient(135deg,#ef4444,#dc2626)':'rgba(255,255,255,0.06)', color:'white', padding:12, borderRadius:10, fontWeight:900, border: activeTab==='cash'?'1px solid rgba(255,255,255,0.3)':'1px solid rgba(255,255,255,0.1)', minWidth:0}}>💰 عليك دفع ({cashPendingCount})</button>
        </div>

        <div style={{...glassCard, borderRadius:12, padding:12, fontSize:11, marginBottom:12, width:'100%', boxSizing:'border-box', overflowX:'hidden', wordBreak:'break-word'}}>
          <div style={{color:'white'}}>📍 موقعك: {myLocation? `${myLocation.lat.toFixed(5)}, ${myLocation.lng.toFixed(5)}` : 'بانتظار GPS...'} {isOnline? '(يتم الارسال للادمن)' : '(متوقف)'}</div>
          <div style={{marginTop:6, color:'#facc15', wordBreak:'break-word'}}>🔍 {debug}</div>
        </div>

        {activeTab==='cash'? (
          <CashPending driverId={me.relatedId || me.userId} supabase={supabase} formatLBP={formatLBP} />
        ) : (
          requests.map(r=>{
          const prods = allDetails.filter(d=> String(d['Request ID']) === String(r['Request ID']))
          const storeIds = [...new Set(prods.map(p=>String(p['Store ID']).trim()).filter(Boolean))]
          const isPending = r['Delivery Status']==='Pending'
          const isPicked = r['Delivery Status']==='Picked Up' || r['Delivery Status']==='On The Way'
          const customerId = String(r['Costumer ID']||'').trim()
          const customerPhone = r['Mobile'] || usersMap[customerId]?.['Mobile'] || '-'
          const whatsappRaw = usersMap[customerId]?.['WhatsApp Number'] || ''
          let waClean = String(whatsappRaw).replace(/[^0-9]/g,'')
          let waLink = waClean? `https://wa.me/${waClean}` : null
          if(!waLink && customerPhone && customerPhone!== '-'){
            const pClean = String(customerPhone).replace(/[^0-9]/g,'').replace(/^0+/, '')
            waLink = `https://wa.me/961${pClean}`
          }
          let orderTotal = 0
          prods.forEach(p=>{
            const qty = parseFloat(p['Qty'] || 1)
            const price = parseFloat(p['Unit Price'] || 0)
            orderTotal += qty * price
          })
          if(orderTotal===0) orderTotal = parseFloat(r['Total Amount'] || 0)

          return (
            <div key={r.supa_id} style={{...glassCard, borderRadius:14, padding:14, marginBottom:12, border: isPicked? '2px solid #22c55e' : '1px solid rgba(255,255,255,0.08)', width:'100%', boxSizing:'border-box', overflowX:'hidden'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:8}}>
                <b style={{color:'white'}}>{r['Request ID']}</b>
                <div style={{display:'flex', gap:6, alignItems:'center', flexWrap:'wrap'}}>
                  {timers[r['Request ID']]!==undefined && <span style={{background: timers[r['Request ID']]===0? '#ef4444' : timers[r['Request ID']]<300? '#ef4444' : timers[r['Request ID']]<600? '#facc15' : '#22c55e', color:'white', padding:'4px 12px', borderRadius:20, fontWeight:900, fontSize:11}}>{timers[r['Request ID']]===0? 'تأخر!' : formatTimer(timers[r['Request ID']])}</span>}
                  <span style={{fontSize:11, padding:'3px 8px', borderRadius:20, background: isPending? 'rgba(255,255,255,0.1)' : 'white', color: isPending? 'white' : 'black', border:'1px solid rgba(255,255,255,0.1)'}}>{r['Delivery Status']}</span>
                </div>
              </div>
              {isPending? (
                <div style={{marginTop:8, fontSize:12, color:'rgba(255,255,255,0.7)'}}>السعر: {formatLBP(r['Total Amount'])} - {prods.length} منتج - مخفي حتى القبول</div>
              ) : (
                <>
                  <div style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:10, marginTop:10, width:'100%', boxSizing:'border-box'}}>
                    <div style={{fontWeight:900, fontSize:11, opacity:0.5, color:'white'}}>🏪 قسم المتجر - {storeIds.length} متجر</div>
                    {storeIds.map(sid=>{
                      const s = storesMap[sid] || storesMap[sid.toLowerCase()] || {}
                      const areaName = areasMap[s['Area']] || areasMap[String(s['Area']).toLowerCase()] || s['Area'] || ''
                      const storeName = s['Store Name'] || `متجر ${sid.slice(0,8)}`
                      return <div key={sid} style={{fontSize:13, marginTop:6, padding:'6px 8px', background:'rgba(255,255,255,0.06)', borderRadius:8, color:'white', wordBreak:'break-word'}}><b>{storeName}</b> / {areaName} / {s['Adress'] || ''}</div>
                    })}
                  </div>
                  <div style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:10, marginTop:8, width:'100%', boxSizing:'border-box'}}>
                    <div style={{fontWeight:900, fontSize:11, opacity:0.5, color:'white'}}>🛒 المنتجات - {prods.length} منتج</div>
                    {prods.map((p,i)=>{
                      const key = String(p['Product ID']).trim()
                      const prodInfo = productsMap[key] || productsMap[key.toLowerCase()] || {}
                      const prodName = prodInfo['Product Name'] || `منتج ${key.slice(-6)}`
                      const unit = prodInfo['Unit'] || ''
                      const qty = parseFloat(p['Qty'] || 1)
                      const unitPrice = parseFloat(p['Unit Price'] || prodInfo['Price'] || 0)
                      const lineTotal = qty * unitPrice
                      const sName = storesMap[p['Store ID']]?.['Store Name'] || ''
                      return (
                        <div key={i} style={{fontSize:12, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.06)', color:'white'}}>
                          <div style={{display:'flex', justifyContent:'space-between', fontWeight:700}}><span style={{wordBreak:'break-word'}}>{prodName} {unit? `(${unit})` : ''}</span><span>x{qty}</span></div>
                          <div style={{display:'flex', justifyContent:'space-between', opacity:0.6, fontSize:11, marginTop:2, color:'rgba(255,255,255,0.6)'}}><span>🏪 {sName} - {formatLBP(unitPrice)}</span><span style={{fontWeight:900}}>{formatLBP(lineTotal)}</span></div>
                        </div>
                      )
                    })}
                    <div style={{display:'flex', justifyContent:'space-between', fontWeight:900, fontSize:14, marginTop:10, paddingTop:8, borderTop:'2px solid rgba(255,255,255,0.1)', color:'white'}}><span>قيمة الاوردر:</span><span>{formatLBP(orderTotal)}</span></div>
                  </div>
                  <div style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:10, marginTop:8, width:'100%', boxSizing:'border-box'}}>
                    <div style={{fontWeight:900, fontSize:11, opacity:0.5, color:'white'}}>🏠 قسم الزبون</div>
                    <div style={{fontSize:13, marginTop:4, color:'white', wordBreak:'break-word'}}>{r['Delivery Adress'] || '-'}</div>
                    <div style={{display:'flex', gap:6, marginTop:8, alignItems:'center', flexWrap:'wrap'}}>
                      <div style={{fontSize:12, background:'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.2)', padding:'8px', borderRadius:6, flex:1, color:'white', minWidth:0, wordBreak:'break-all'}}>📞 {customerPhone}</div>
                      <a href={waLink} target="_blank" style={{background:'#25D366', color:'white', padding:'8px 12px', borderRadius:6, textDecoration:'none', fontWeight:900, fontSize:12, flexShrink:0}}>واتساب</a>
                      <a href={`tel:${customerPhone}`} style={{background:'white', color:'black', padding:'8px 12px', borderRadius:6, textDecoration:'none', fontWeight:900, fontSize:12, flexShrink:0}}>اتصال</a>
                    </div>
                  </div>
                  <div style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:10, marginTop:8}}>
                    <div style={{fontWeight:900, fontSize:11, opacity:0.5, color:'white'}}>💳 الدفع</div>
                    <div style={{fontSize:13, color:'white'}}>الطريقة: <b>{r['Final Payment Method']||'Cash'}</b> - المبلغ: <b>{formatLBP(r['Total Amount']||'')}</b></div>
                  </div>
                  {(() => {
                    const stores = storeIds.map(sid => storesMap[sid] || storesMap[sid.toLowerCase()]).filter(s => s && s['Current Latitude'] && s['Current Longitude']).map(s => ({ lat: parseFloat(s['Current Latitude']), lng: parseFloat(s['Current Longitude']), name: s['Store Name'] || 'متجر' }))
                    const cLat = r['Customer Latitude']? parseFloat(r['Customer Latitude']) : null
                    const cLng = r['Customer Longitude']? parseFloat(r['Customer Longitude']) : null
                    if(stores.length===0 &&!cLat) return <div style={{padding:10, textAlign:'center', background:'rgba(255,255,255,0.04)', borderRadius:10, marginTop:10, color:'rgba(255,255,255,0.4)'}}>لا يوجد موقع متجر او زبون</div>
                    return (
                      <div style={{width:'100%', boxSizing:'border-box', overflow:'hidden'}}>
                        <div style={{height:320, marginTop:10, borderRadius:12, overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)', width:'100%'}}>
                          <DriverMap stores={stores} customerLat={cLat} customerLng={cLng} driverLat={myLocation?.lat} driverLng={myLocation?.lng} onSelectPoint={setSelectedPoint} />
                        </div>
                        <button onClick={openGoogleMaps} style={{marginTop:8, width:'100%', background: selectedPoint? 'white' : 'rgba(255,255,255,0.1)', color: selectedPoint? 'black':'white', padding:10, borderRadius:10, fontWeight:900, border:'none', boxSizing:'border-box'}}>{selectedPoint? `🧭 تنقل إلى ${selectedPoint.label}` : 'اختار نقطة على الخريطة للتنقل'}</button>
                      </div>
                    )
                  })()}
                </>
              )}
              <div style={{display:'flex', gap:8, marginTop:10, width:'100%', boxSizing:'border-box'}}>
                {r['Delivery Status']==='Pending' && <button onClick={()=>updateStatus(r,'Picked Up')} style={{flex:1, background:'linear-gradient(135deg,#2563eb,#1d4ed8)', color:'white', padding:'12px', borderRadius:10, fontWeight:900, border:'none'}}>استلام - Pickup</button>}
                {r['Delivery Status']==='Picked Up' && <button onClick={()=>updateStatus(r,'On The Way')} style={{flex:1, background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'white', padding:'12px', borderRadius:10, fontWeight:900, border:'none'}}>{`الانتقال الى الزبون ${timers[r['Request ID']]!==undefined? `- ${formatTimer(timers[r['Request ID']])}` : ''}`}</button>}
                {r['Delivery Status']==='On The Way' && <button onClick={()=>{setSelectedOrder(r); setCollected(''); setDriverNote(''); setPaymentMethod(r['Final Payment Method']||'Cash'); setShowConfirm(true)}} style={{flex:1, background:'linear-gradient(135deg,#22c55e,#16a34a)', color:'white', padding:'12px', borderRadius:10, fontWeight:900, border:'none'}}>تأكيد الدفع</button>}
              </div>
            </div>
          )
        })
        )}
      </div>

      {showWallet && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:60, padding:12}}>
          <div style={{background:'white', color:'black', borderRadius:16, width:'100%', maxWidth:400, maxHeight:'80vh', overflow:'hidden', display:'flex', flexDirection:'column'}}>
            <div style={{padding:16, background:'#0a1930', color:'white', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>
                <div style={{fontSize:12, opacity:0.7}}>محفظتي</div>
                <div style={{fontSize:22, fontWeight:900}}>{formatLBP(wallet)}</div>
              </div>
              <button onClick={()=>setShowWallet(false)} style={{background:'rgba(255,255,255,0.2)', border:'none', color:'white', width:32, height:32, borderRadius:8}}>✕</button>
            </div>
            <div style={{flex:1, overflowY:'auto', padding:10}}>
              {walletTx.length===0 && <div style={{textAlign:'center', padding:20, color:'#999'}}>لا يوجد حركات</div>}
              {walletTx.map((t,i)=>{
                const amt = Number(t.Amount||0)
                const type = String(t.Type||'').toUpperCase()
                const isDeduct = type==='DEDUCT' || type==='CASH_OUT' || type==='PENALTY'
                return (
                  <div key={i} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 10px', borderBottom:'1px solid #eee'}}>
                    <div style={{flex:1}}>
                      <div style={{display:'flex', gap:6, alignItems:'center'}}>
                        <span style={{background: isDeduct?'#fee2e2':'#dcfce7', color: isDeduct?'#ef4444':'#16a34a', padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:900}}>{isDeduct?'🔴 حسم':'🟢 ADD'}</span>
                        <span style={{fontWeight:900, fontSize:14, color: isDeduct?'#ef4444':'#16a34a'}}>{isDeduct?'-':'+'}{formatLBP(amt)}</span>
                      </div>
                      <div style={{fontSize:12, marginTop:4, color:'#333'}}>{t.Notes || t.Reason || '-'}</div>
                      <div style={{fontSize:10, opacity:0.5, marginTop:2}}>{t.Date? new Date(t.Date).toLocaleString('ar-LB'):''}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:12}}>
          <div style={{background:'white', color:'black', padding:20, borderRadius:16, width:'100%', maxWidth:360, boxSizing:'border-box'}}>
            <h3 style={{margin:0, fontWeight:900}}>تأكيد الدفع</h3>
            <div style={{background:'#f3f4f6', padding:10, borderRadius:8, marginTop:12, fontSize:13}}>
              <div><b>رقم الاوردر:</b> {selectedOrder?.['Request ID']}</div>
              <div style={{marginTop:6}}><b>المبلغ المستحق:</b> <span style={{fontWeight:900, fontSize:16}}>{formatLBP(selectedOrder?.['Total Amount']||'0')}</span></div>
              {selectedOrder && timers[selectedOrder['Request ID']]>0 && <div style={{marginTop:8, background:'#dcfce7', padding:6, borderRadius:6, textAlign:'center', fontWeight:900}}>⏱ المتبقي: {formatTimer(timers[selectedOrder['Request ID']])}</div>}
            </div>
            <select value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)} style={{width:'100%', padding:10, borderRadius:8, border:'1px solid #ccc', marginTop:12}}>
              <option value="Cash">Cash</option>
              <option value="Wish Money">Wish Money</option>
            </select>
            <input placeholder="كم استلمت" value={collected} onChange={e=>setCollected(e.target.value)} style={{width:'100%', marginTop:10, padding:10, borderRadius:8, border:'2px solid #111', fontWeight:900, boxSizing:'border-box'}}/>
            <textarea placeholder="ملاحظات" value={driverNote} onChange={e=>setDriverNote(e.target.value)} style={{width:'100%', marginTop:8, padding:10, borderRadius:8, border:'1px solid #ccc', minHeight:60, boxSizing:'border-box'}}/>
            <button onClick={confirmDelivery} style={{marginTop:12, width:'100%', background:'#111', color:'white', padding:12, borderRadius:10, fontWeight:900, border:'none'}}>موافق - {selectedOrder?.['Pickup At']? `${Math.ceil((new Date() - new Date(selectedOrder['Pickup At']))/60000)} دقيقة` : ''}</button>
            <button onClick={()=>setShowConfirm(false)} style={{marginTop:8, width:'100%', background:'#eee', padding:10, borderRadius:10, border:'none'}}>إلغاء</button>
          </div>
        </div>
      )}
    </div>
  )
}
