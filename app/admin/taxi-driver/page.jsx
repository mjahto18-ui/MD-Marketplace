"use client"
import { useEffect, useState, useRef } from "react"
import { createClient } from "@supabase/supabase-js"

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default function TaxiDriverDashboard(){
  const [supabase, setSupabase] = useState(null)
  const [me, setMe] = useState(null)
  const [orders, setOrders] = useState([])
  const [nearby, setNearby] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [myLocation, setMyLocation] = useState(null)
  const [isOnline, setIsOnline] = useState(true)
  const [wallet, setWallet] = useState(0)
  const [showCodePad, setShowCodePad] = useState(false)
  const [codeInput, setCodeInput] = useState("")
  const [amountReceived, setAmountReceived] = useState("")

  const locationWatchRef = useRef(null)
  const selectedOrderRef = useRef(null)
  const lastTrackTime = useRef(0)
  useEffect(()=>{ selectedOrderRef.current = selectedOrder }, [selectedOrder])

  useEffect(()=>{
    setSupabase(createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
    fetch('/api/admin/me', {cache:'no-store'}).then(r=>r.json()).then(d=>{ setMe(d); setIsOnline(d.is_online?? true) })
  },[])

  // تتبع حي + كتابة بـ live_tracking
  useEffect(()=>{
    if(!supabase ||!me ||!isOnline) return
    const driverId = me.relatedId || me.userId
    if(!driverId) return

    locationWatchRef.current = navigator.geolocation.watchPosition(async pos=>{
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      setMyLocation({lat,lng})
      const now = Date.now()

      // حدث جدول السواقين كل مرة
      await supabase.from('taxi_drivers').update({
        lat, lng,
        "Current Latitude": lat,
        "Current Longitude": lng,
        "Last Location Update": new Date().toISOString(),
        is_online: true
      }).eq('Taxi_ID', driverId)

      // اذا في طلب مقبول
      if(selectedOrderRef.current){
        // حدث live بالاوردر (للأدمن)
        await supabase.from('taxi_orders').update({
          taxi_lat_live: lat,
          taxi_lng_live: lng,
          updated_at: new Date().toISOString()
        }).eq('id', selectedOrderRef.current.id)

        // ✅ اكتب بـ taxi_live_tracking كل 5 ثواني بس مشان ما تفلل الجدول
        if(now - lastTrackTime.current > 5000){
          lastTrackTime.current = now
          await supabase.from('taxi_live_tracking').insert({
            order_id: selectedOrderRef.current.id,
            taxi_id: driverId,
            lat, lng,
            speed: pos.coords.speed || 0,
            heading: pos.coords.heading || 0
          })
        }
      }
    }, (err)=>{ console.log('geo error', err) }, {enableHighAccuracy:true, maximumAge:3000, timeout:10000})

    return ()=>{ if(locationWatchRef.current) navigator.geolocation.clearWatch(locationWatchRef.current) }
  },[supabase, me, isOnline])

  useEffect(()=>{
    if(!supabase ||!me) return
    const load = async ()=>{
      const driverId = me.relatedId || me.userId
      if(!driverId) return

      const { data: w } = await supabase.from('wallets').select('balance').eq('taxi_id', driverId).single()
      if(w) setWallet(w.balance)

      const { data: myOrders } = await supabase.from('taxi_orders').select('*')
     .eq('taxi_id', driverId)
     .in('status',['accepted','on_the_way','arrived','in_progress'])
     .order('created_at',{ascending:false})
      setOrders(myOrders||[])
      if(myOrders?.[0] &&!selectedOrderRef.current) setSelectedOrder(myOrders[0])

      if(myLocation){
        const { data: pending } = await supabase.from('taxi_orders').select('*')
       .eq('status','pending')
       .gte('created_at', new Date(Date.now() - 30*60*1000).toISOString())
       .order('created_at',{ascending:false}).limit(50)

        const filtered = (pending||[]).filter(o=>{
          if(!o.origin_lat ||!o.origin_lng) return false
          if(o.taxi_vehicle_type && me.vehicle_type && o.taxi_vehicle_type!== me.vehicle_type) return false
          return haversine(myLocation.lat, myLocation.lng, Number(o.origin_lat), Number(o.origin_lng)) <= 5
        }).map(o=>({...o, distance_km: haversine(myLocation.lat, myLocation.lng, Number(o.origin_lat), Number(o.origin_lng)).toFixed(1)}))
     .sort((a,b)=>parseFloat(a.distance_km) - parseFloat(b.distance_km))

        setNearby(filtered)
      }
    }
    load()
    const interval = setInterval(load, 5000)
    const channel = supabase.channel('taxi_orders_live').on('postgres_changes',{event:'*',schema:'public',table:'taxi_orders'},()=>load()).subscribe()
    return ()=>{ clearInterval(interval); supabase.removeChannel(channel) }
  },[supabase, me, myLocation])

  const toggleOnline = async ()=>{
    const driverId = me.relatedId || me.userId
    const newVal =!isOnline
    await supabase.from('taxi_drivers').update({
      is_online: newVal,
      "Last Location Update": new Date().toISOString()
    }).eq('Taxi_ID', driverId)
    setIsOnline(newVal)
  }

  const handleAccept = async (order)=>{
    const res = await fetch('/api/taxi/accept',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ order_id: order.id, taxi_id: me.relatedId || me.userId })
    }).then(r=>r.json())
    if(res.error) alert(res.error)
    else {
      setSelectedOrder(res.order)
      setOrders([res.order])
      setNearby(prev=>prev.filter(o=>o.id!==order.id))
    }
  }

  const handleVerifyCode = async ()=>{
    if(codeInput.length!== 4) return
    const res = await fetch('/api/taxi/verify-code',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ order_id: selectedOrder.id, taxi_id: me.relatedId || me.userId, code: codeInput })
    }).then(r=>r.json())
    if(res.error) alert(res.error)
    else {
      alert(`تم التأكيد - الرحلة انطلقت - السعر ${res.order.total_amount?.toLocaleString()}`)
      setShowCodePad(false); setCodeInput("");
      setSelectedOrder(res.order)
      const { data: w } = await supabase.from('wallets').select('balance').eq('taxi_id', me.relatedId || me.userId).single()
      if(w) setWallet(w.balance)
    }
  }

  const handleComplete = async ()=>{
    const res = await fetch('/api/taxi/complete',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ order_id: selectedOrder.id, taxi_id: me.relatedId || me.userId, amount_received: amountReceived || selectedOrder.total_amount })
    }).then(r=>r.json())
    if(res.error) alert(res.error)
    else location.reload()
  }

  const Numpad = ()=>(
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50}}>
      <div style={{background:'white', color:'black', borderRadius:16, width:320, padding:16}}>
        <h3 style={{textAlign:'center', fontWeight:900}}>أدخل كود الزبون</h3>
        <div style={{display:'flex', gap:8, justifyContent:'center', margin:'12px 0'}}>
          {[0,1,2,3].map(i=><div key={i} style={{width:40,height:50,border:'2px solid #111',borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:20}}>{codeInput[i]||''}</div>)}
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8}}>
          {[1,2,3,4,5,6,7,8,9].map(n=><button key={n} onClick={()=>{ if(codeInput.length<4) setCodeInput(codeInput+n)}} style={{padding:14, borderRadius:10, background:'#f3f4f6', fontWeight:900, fontSize:18}}>{n}</button>)}
          <button onClick={()=>setCodeInput(codeInput.slice(0,-1))} style={{padding:14, borderRadius:10, background:'#fee2e2'}}>⌫</button>
          <button onClick={()=>{ if(codeInput.length<4) setCodeInput(codeInput+'0')}} style={{padding:14, borderRadius:10, background:'#f3f4f6', fontWeight:900, fontSize:18}}>0</button>
          <button onClick={handleVerifyCode} style={{padding:14, borderRadius:10, background:'#FFC107', fontWeight:900}}>تأكيد</button>
        </div>
        <button onClick={()=>{setShowCodePad(false); setCodeInput("")}} style={{marginTop:10, width:'100%', padding:10, background:'#eee', borderRadius:10}}>إلغاء</button>
      </div>
    </div>
  )

  if(!me) return <div style={{padding:20, background:'#0a1930', color:'white'}}>تحميل...</div>

  return (
    <div style={{minHeight:'100vh', background:'#0a1930', color:'white', padding:12}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', background:'#0e2242', padding:10, borderRadius:12}}>
        <span>أهلاً {me.name} - {me.engine_cc || ''} - محفظتي {wallet.toLocaleString()} ل.ل</span>
        <button onClick={toggleOnline} style={{background:isOnline?'#22c55e':'#ef4444', padding:'6px 14px', borderRadius:20, fontWeight:900, border:'none', color:'white'}}>{isOnline?'🟢 Online':'🔴 Offline'}</button>
      </div>
      {myLocation && <div style={{fontSize:10, opacity:0.5, marginTop:6}}>📍 {myLocation.lat.toFixed(5)},{myLocation.lng.toFixed(5)} - يبث مباشر</div>}
      {selectedOrder && (
        <div style={{background:'white', color:'black', borderRadius:14, padding:14, marginTop:12}}>
          <b>#{selectedOrder.order_code || selectedOrder.id.slice(0,8)} - {selectedOrder.customer_name}</b>
          <div style={{fontSize:12, marginTop:4}}>📍 من: {selectedOrder.origin_name}</div>
          <div style={{fontSize:12}}>🎯 إلى: {selectedOrder.dest_name}</div>
          <div style={{marginTop:6, fontWeight:900}}>💰 {selectedOrder.total_amount?.toLocaleString()} - {selectedOrder.distance_traveled} كم - {selectedOrder.taxi_engine_cc}</div>
          <div style={{marginTop:10, display:'flex', gap:8}}>
            {selectedOrder.status === 'accepted' && <button onClick={()=>setShowCodePad(true)} style={{flex:1, background:'#111', color:'white', padding:12, borderRadius:10, fontWeight:900}}>تأكيد الكود</button>}
            {selectedOrder.status === 'in_progress' && (<><input placeholder="المبلغ المستلم" value={amountReceived} onChange={e=>setAmountReceived(e.target.value)} style={{flex:1, padding:10, border:'2px solid #111', borderRadius:10, color:'black'}}/><button onClick={handleComplete} style={{background:'#22c55e', color:'white', padding:10, borderRadius:10, fontWeight:900, border:'none'}}>انهاء</button></>)}
          </div>
        </div>
      )}
      <div style={{marginTop:16}}>
        <h3 style={{fontWeight:900}}>🔍 طلبات قريبة 5 كم ({nearby.length})</h3>
        {nearby.map(o=>(
          <div key={o.id} style={{background:'#132a54', borderRadius:12, padding:12, marginTop:8, border:'1px solid #1e3a6e'}}>
            <div style={{display:'flex', justifyContent:'space-between'}}><span style={{fontSize:12}}>#{o.order_code || o.id.slice(0,6)}</span><span style={{background:'#FFC107', color:'black', padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:900}}>{o.distance_km} كم</span></div>
            <div style={{fontSize:11, opacity:0.7, marginTop:2}}>→ {o.dest_name?.slice(0,40)}</div>
            <div style={{display:'flex', justifyContent:'space-between', marginTop:6, fontWeight:900, fontSize:12}}><span>{o.customer_name} - {o.taxi_vehicle_type}</span><span>{o.total_amount?.toLocaleString()} ل.ل</span></div>
            <button onClick={()=>handleAccept(o)} style={{width:'100%', marginTop:8, background:'#22c55e', padding:10, borderRadius:10, fontWeight:900, border:'none', color:'white'}}>✅ قبول</button>
          </div>
        ))}
      </div>
      {showCodePad && <Numpad/>}
    </div>
  )
}
