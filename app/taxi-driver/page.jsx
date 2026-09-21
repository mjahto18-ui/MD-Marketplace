"use client"
export const dynamic = 'force-dynamic'
export const dynamicParams = true

import { useEffect, useState, useRef } from "react"
import { createClient } from "@supabase/supabase-js"
import { Star } from "lucide-react"
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const originIcon = L.icon({ iconUrl: 'https://raw.githubusercontent.[STRIPPED 65 bytes].png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', iconSize:[25,41], iconAnchor:[12,41] })
const destIcon = L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', iconSize:[25,41], iconAnchor:[12,41] })

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

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
      {[...Array(full)].map((_, i) => <Star key={`f-${i}`} size={size} style={{fill:'#facc15', color:'#facc15'}} />)}
      {half && <div style={{position:'relative', width:size, height:size}}><Star size={size} style={{position:'absolute', color:'rgba(255,255,255,0.2)'}} /><div style={{position:'absolute', overflow:'hidden', width:'50%'}}><Star size={size} style={{fill:'#facc15', color:'#facc15'}} /></div></div>}
      {[...Array(empty)].map((_, i) => <Star key={`e-${i}`} size={size} style={{color:'rgba(255,255,255,0.2)'}} />)}
    </div>
  );
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
  const [walletTx, setWalletTx] = useState([])
  const [showWallet, setShowWallet] = useState(false)
  const [showCodePad, setShowCodePad] = useState(false)
  const [codeInput, setCodeInput] = useState("")
  const [amountReceived, setAmountReceived] = useState("")
  const [driverStats, setDriverStats] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [expandedRoutes, setExpandedRoutes] = useState({})

  const locationWatchRef = useRef(null)
  const selectedOrderRef = useRef(null)
  const lastTrackTime = useRef(0)
  useEffect(()=>{ selectedOrderRef.current = selectedOrder }, [selectedOrder])

  useEffect(()=>{
    setSupabase(createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
    fetch('/api/admin/me', {cache:'no-store'}).then(r=>r.json()).then(d=>{ setMe(d); setIsOnline(d.is_online?? true) })
  },[])

  const formatLBP = (n) => {
    if(!n && n!==0) return '0 ل.ل'
    const num = parseFloat(String(n).replace(/,/g,'')) || 0
    return new Intl.NumberFormat('en-LB').format(num) + ' ل.ل'
  }

  useEffect(()=>{
    if(!supabase ||!me ||!isOnline) return
    const driverId = me.Taxi_ID || me.taxiId || me.relatedId || me.userId
    if(!driverId) return
    locationWatchRef.current = navigator.geolocation.watchPosition(async pos=>{
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      setMyLocation({lat,lng})
      const now = Date.now()
      await supabase.from('taxi_drivers').update({
        lat, lng,
        "Current Latitude": lat,
        "Current Longitude": lng,
        "Last Location Update": new Date().toISOString(),
        is_online: true
      }).eq('"Taxi_ID"', driverId)
      if(selectedOrderRef.current){
        await supabase.from('taxi_orders').update({
          taxi_lat_live: lat,
          taxi_lng_live: lng,
          updated_at: new Date().toISOString()
        }).eq('id', selectedOrderRef.current.id)
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
      const driverId = me.Taxi_ID || me.taxiId || me.relatedId || me.userId
      if(!driverId) return
      try{
        const wr = await fetch(`/api/wallet/me?userId=${me.userId}`, {cache:'no-store'}).then(r=>r.json())
        if(wr.success){ setWallet(wr.wallet||0); setWalletTx(wr.transactions||[]) }
      }catch{}
      const { data: drv } = await supabase.from('taxi_drivers').select('average_rating, total_orders, rating_level').eq('"Taxi_ID"', driverId).single()
      if(drv) setDriverStats(drv)
      const { data: myOrders } = await supabase.from('taxi_orders').select('*')
   .eq('taxi_id', driverId)
   .in('status',['accepted','on_the_way','arrived','in_progress','code_verified'])
   .order('created_at',{ascending:false})
      setOrders(myOrders||[])
      if(myOrders?.[0] &&!selectedOrderRef.current) setSelectedOrder(myOrders[0])
      if(myOrders?.length>0){ setNearby([]); return; }
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
    const driverId = me.Taxi_ID || me.taxiId || me.relatedId || me.userId
    const newVal =!isOnline
    await supabase.from('taxi_drivers').update({ is_online: newVal, "Last Location Update": new Date().toISOString() }).eq('"Taxi_ID"', driverId)
    setIsOnline(newVal)
  }

  const toggleExpand = async (o)=>{
    if(expandedId===o.id){ setExpandedId(null); return; }
    setExpandedId(o.id)
    if(!expandedRoutes[o.id] && o.origin_lat && o.dest_lat){
      try{
        const url=`https://router.project-osrm.org/route/v1/driving/${o.origin_lng},${o.origin_lat};${o.dest_lng},${o.dest_lat}?overview=full&geometries=geojson`
        const res=await fetch(url).then(r=>r.json())
        if(res.routes?.[0]) setExpandedRoutes(prev=>({...prev, [o.id]: res.routes[0].geometry.coordinates.map(c=>[c[1],c[0]])}))
      }catch{}
    }
  }

  const handleAccept = async (order)=>{
    const driverId = me.Taxi_ID || me.taxiId || me.relatedId || me.userId
    const res = await fetch('/api/taxi/accept',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ order_id: order.id, taxi_id: driverId }) }).then(r=>r.json())
    if(res.error) alert(res.error)
    else { setSelectedOrder(res.order); setOrders([res.order]); setNearby([]) }
  }

  const handleVerifyCode = async ()=>{
    if(codeInput.length!== 4) return
    const driverId = me.Taxi_ID || me.taxiId || me.relatedId || me.userId
    const res = await fetch('/api/taxi/verify-code',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ order_id: selectedOrder.id, taxi_id: driverId, code: codeInput }) }).then(r=>r.json())
    if(res.error) alert(res.error)
    else {
      alert(`تم التأكيد - الرحلة انطلقت - السعر ${res.order.total_amount?.toLocaleString()}`)
      setShowCodePad(false); setCodeInput(""); setSelectedOrder(res.order)
      const wr = await fetch(`/api/wallet/me?userId=${me.userId}`, {cache:'no-store'}).then(r=>r.json())
      if(wr.success) setWallet(wr.wallet||0)
    }
  }

  const handleComplete = async ()=>{
    const driverId = me.Taxi_ID || me.taxiId || me.relatedId || me.userId
    const res = await fetch('/api/taxi/complete',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ order_id: selectedOrder.id, taxi_id: driverId, amount_received: amountReceived || selectedOrder.total_amount }) }).then(r=>r.json())
    if(res.error) alert(res.error)
    else { setSelectedOrder(null); setOrders([]); setAmountReceived(""); }
  }

  const logout = async ()=>{ await fetch('/api/admin/logout',{method:'POST'}); window.location.href='/admin/login' }

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
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', background:'#0e2242', padding:10, borderRadius:12, position:'sticky', top:0, zIndex:20}}>
        <div style={{display:'flex', alignItems:'center', gap:10, flexWrap:'wrap'}}>
          <span>أهلاً {me.name} - {me.engine_cc || ''}</span>
          {driverStats && (
            <div style={{display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.1)', padding:'4px 10px', borderRadius:20}}>
              <Stars rating={driverStats.average_rating} size={14} />
              <span style={{fontSize:12, color:'#facc15', fontWeight:900}}>{Number(driverStats.average_rating||0).toFixed(1)}</span>
              <span style={{fontSize:11, opacity:0.6}}>({driverStats.rating_level}) • {driverStats.total_orders||0} رحلة</span>
            </div>
          )}
          <button onClick={toggleOnline} style={{background:isOnline?'#22c55e':'#ef4444', padding:'6px 14px', borderRadius:20, fontWeight:900, border:'none', color:'white'}}>{isOnline?'🟢 Online':'🔴 Offline'}</button>
        </div>
        <button onClick={logout} style={{background:'#ef444444', border:'1px solid #ef4444', color:'#fca5a5', padding:'6px 12px', borderRadius:8}}>خروج</button>
      </div>

      <div onClick={()=>setShowWallet(true)} style={{marginTop:12, background:'linear-gradient(135deg,#10b981,#059669)', color:'white', borderRadius:16, padding:14, display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', border:'2px solid rgba(255,255,255,0.2)'}}>
        <div>
          <div style={{fontSize:11, opacity:0.8}}>👛 محفظتي</div>
          <div style={{fontSize:26, fontWeight:900, marginTop:2}}>{formatLBP(wallet)}</div>
          <div style={{fontSize:11, opacity:0.7, marginTop:2}}>اضغط لعرض التفاصيل</div>
        </div>
        <div style={{fontSize:32}}>💳</div>
      </div>

      {myLocation && <div style={{fontSize:10, opacity:0.5, marginTop:8}}>📍 {myLocation.lat.toFixed(5)},{myLocation.lng.toFixed(5)} - يبث مباشر</div>}

      {selectedOrder && (
        <div style={{background:'white', color:'black', borderRadius:14, padding:14, marginTop:12, border:'3px solid #22c55e'}}>
          <b>#{selectedOrder.order_code || selectedOrder.id.slice(0,8)} - {selectedOrder.customer_name} - طلبك الحالي</b>
          <div style={{fontSize:12, marginTop:4}}>📍 من: {selectedOrder.origin_name}</div>
          <div style={{fontSize:12}}>🎯 إلى: {selectedOrder.dest_name}</div>
          <div style={{marginTop:6, fontWeight:900}}>💰 {selectedOrder.total_amount?.toLocaleString()} - {selectedOrder.distance_traveled} كم - {selectedOrder.taxi_engine_cc}</div>
          <div style={{marginTop:10, display:'flex', gap:8}}>
            {selectedOrder.status === 'accepted' && <button onClick={()=>setShowCodePad(true)} style={{flex:1, background:'#111', color:'white', padding:12, borderRadius:10, fontWeight:900}}>تأكيد الكود</button>}
            {selectedOrder.status === 'in_progress' && (<><input placeholder="المبلغ المستلم" value={amountReceived} onChange={e=>setAmountReceived(e.target.value)} style={{flex:1, padding:10, border:'2px solid #111', borderRadius:10, color:'black'}}/><button onClick={handleComplete} style={{background:'#22c55e', color:'white', padding:10, borderRadius:10, fontWeight:900, border:'none'}}>انهاء</button></>)}
          </div>
          <div style={{marginTop:8, fontSize:11, background:'#fef3c7', padding:8, borderRadius:8, color:'#92400e'}}>⛔ ما فيك تاخد طلب تاني حتى تخلص هاد</div>
        </div>
      )}

      {!selectedOrder? (
      <div style={{marginTop:16}}>
        <h3 style={{fontWeight:900}}>🔍 طلبات قريبة 5 كم ({nearby.length})</h3>
        {nearby.map(o=>(
          <div key={o.id} style={{background:'#132a54', borderRadius:12, padding:12, marginTop:8, border: expandedId===o.id?'2px solid #22c55e':'1px solid #1e3a6e'}}>
            <div style={{display:'flex', justifyContent:'space-between'}}><span style={{fontSize:12}}>#{o.order_code || o.id.slice(0,6)}</span><span style={{background:'#FFC107', color:'black', padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:900}}>{o.distance_km} كم</span></div>
            <div style={{fontSize:11, opacity:0.7, marginTop:2}}>📍 {o.origin_name?.slice(0,50)} → {o.dest_name?.slice(0,40)}</div>
            <div style={{display:'flex', justifyContent:'space-between', marginTop:6, fontWeight:900, fontSize:12}}><span>{o.customer_name} - {o.taxi_vehicle_type} - {o.distance_traveled} كم</span><span>{o.total_amount?.toLocaleString()} ل.ل</span></div>
            <div style={{display:'flex', gap:8, marginTop:8}}>
              <button onClick={()=>toggleExpand(o)} style={{flex:1, background:'#1e3a6e', padding:10, borderRadius:10, fontWeight:700, border:'none', color:'white'}}>{expandedId===o.id?'🔼 اخفاء':'📍 شوف الطريق'}</button>
              <button onClick={()=>handleAccept(o)} style={{flex:1, background:'#22c55e', padding:10, borderRadius:10, fontWeight:900, border:'none', color:'white'}}>✅ قبول</button>
            </div>
            {expandedId===o.id && (
              <div style={{marginTop:10, borderRadius:10, overflow:'hidden', background:'#0a1930'}}>
                <div style={{height:180}}>
                  <MapContainer center={[Number(o.origin_lat), Number(o.origin_lng)]} zoom={13} style={{height:'100%', width:'100%'}} zoomControl={false} dragging={false} scrollWheelZoom={false}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {expandedRoutes[o.id] && <Polyline positions={expandedRoutes[o.id]} color="#22c55e" weight={5} />}
                    <Marker position={[Number(o.origin_lat), Number(o.origin_lng)]} icon={originIcon} />
                    <Marker position={[Number(o.dest_lat), Number(o.dest_lng)]} icon={destIcon} />
                  </MapContainer>
                </div>
                <div style={{padding:8, fontSize:11, display:'flex', justifyContent:'space-between', background:'rgba(0,0,0,0.4)'}}><span>🟢 انطلاق</span><span>📏 {o.distance_traveled} كم طريق</span><span>🔴 وصول</span></div>
                <a href={`https://www.google.com/maps/dir/?api=1&origin=${o.origin_lat},${o.origin_lng}&destination=${o.dest_lat},${o.dest_lng}`} target="_blank" style={{display:'block', textAlign:'center', padding:8, fontSize:12, background:'#0e2242', color:'#60a5fa'}}>افتح بغوغل ماب 🗺</a>
              </div>
            )}
          </div>
        ))}
      </div>
      ) : (
        <div style={{marginTop:16, background:'#f59e0b22', border:'1px dashed #f59e0b', padding:16, borderRadius:12, textAlign:'center'}}><b>🚕 عندك طلب شغال</b><div style={{fontSize:12, marginTop:4}}>ما فيك تشوف طلبات جديدة حتى تخلص الحالي</div></div>
      )}

      {showCodePad && <Numpad/>}
      {showWallet && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:60, padding:12}}>
          <div style={{background:'white', color:'black', borderRadius:16, width:'100%', maxWidth:400, maxHeight:'80vh', overflow:'hidden', display:'flex', flexDirection:'column'}}>
            <div style={{padding:16, background:'#0a1930', color:'white', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div><div style={{fontSize:12, opacity:0.7}}>محفظتي</div><div style={{fontSize:22, fontWeight:900}}>{formatLBP(wallet)}</div></div>
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
    </div>
  )
}
