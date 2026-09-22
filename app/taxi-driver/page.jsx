"use client"
import { useEffect, useState, useRef } from "react"
import { createClient } from "@supabase/supabase-js"
import { Star } from "lucide-react"
import dynamic from 'next/dynamic'

const TaxiNearbyMap = dynamic(() => import('@/components/taxi/TaxiNearbyMap'), { ssr: false })
const TaxiActiveMap = dynamic(() => import('@/components/taxi/TaxiActiveMap'), { ssr: false })

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

function normalizeVehicleType(t) {
  if (!t) return 'car';
  const v = String(t).toLowerCase();
  if (v === 'tuktuk') return 'toktok';
  if (v === 'touristic_van' || v === 'touristic_van_11') return 'van';
  if (v === 'moto' || v === 'motor' || v === 'motorcycle') return 'moto';
  return v;
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
  const [showBalance, setShowBalance] = useState(false)
  const [showCodePad, setShowCodePad] = useState(false)
  const [codeInput, setCodeInput] = useState("")
  const [amountReceived, setAmountReceived] = useState("")
  const [driverStats, setDriverStats] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [expandedRoutes, setExpandedRoutes] = useState({})
  const [pricingBundle, setPricingBundle] = useState(null)
  // SOS - نفس الزبون بس سيزن السائق
  const [showSos, setShowSos] = useState(false)
  const [sosComment, setSosComment] = useState("")

  const locationWatchRef = useRef(null)
  const selectedOrderRef = useRef(null)
  const lastTrackTime = useRef(0)
  useEffect(()=>{ selectedOrderRef.current = selectedOrder }, [selectedOrder])

  useEffect(()=>{
    setSupabase(createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
    fetch('/api/admin/me', {cache:'no-store', credentials:'include'}).then(r=>r.json()).then(d=>{ setMe(d); setIsOnline(d.is_online?? true) })
  },[])

  useEffect(()=>{
    if(!supabase) return
    const loadPricing = async () => {
      try {
        const [pricingRes, fuelRes, enginesRes, baseFaresRes] = await Promise.all([
          supabase.from('taxi_pricing_config').select('*').eq('is_active', true).order('created_at', {ascending:false}).limit(1).single(),
          supabase.from('taxi_fuel_config').select('*').eq('is_active', true).order('effective_date', {ascending:false}).limit(1).single(),
          supabase.from('taxi_engines').select('*').eq('is_active', true),
          supabase.from('taxi_base_fares').select('*').eq('is_active', true)
        ])
        if(pricingRes.data && fuelRes.data && enginesRes.data){
          setPricingBundle({
            pricing: pricingRes.data,
            fuel: fuelRes.data,
            engines: Object.fromEntries(enginesRes.data.map(e => [e.code, e])),
            enginesList: enginesRes.data,
            baseFares: baseFaresRes.data || []
          })
        }
      } catch(e){ console.log('pricing bundle fallback to default', e.message) }
    }
    loadPricing()
  }, [supabase])

  const formatLBP = (n) => {
    if(!n && n!==0) return '0 ل.ل'
    const num = parseFloat(String(n).replace(/,/g,'')) || 0
    return new Intl.NumberFormat('en-LB').format(num) + ' ل.ل'
  }

  const getWhatsappLink = (phone, driverName, orderCode) => {
    if(!phone) return null
    let clean = String(phone).replace(/[^0-9]/g,'').replace(/^0+/,'')
    if(!clean) return null
    const full = clean.startsWith('961')? clean : `961${clean}`
    const msg = `مرحبا انا السائق ${driverName} من MD-TAXI رحلة رقم ${orderCode}`
    return `https://wa.me/${full}?text=${encodeURIComponent(msg)}`
  }

  const getDriverPreviewPrice = (order) => {
    try {
      if(!pricingBundle ||!me) return null
      const rawEngine = me.Taxi_Engine || me.engine_cc || me.taxi_engine_cc || me.engine_code || '1500'
      const code = String(rawEngine).trim()
      const engine = pricingBundle.engines[code] || pricingBundle.enginesList.find(e=> normalizeVehicleType(e.vehicle_type) === normalizeVehicleType(me.vehicle_type))
      if(!engine) return null
      const totalKm = Number(order.distance_traveled) || 0
      const fuelPerLiter = Number(pricingBundle.fuel.tank_price_lbp) / Number(pricingBundle.fuel.tank_liters)
      const fuelPerKm = Number(engine.consumption_l_per_km) * fuelPerLiter
      const vt = normalizeVehicleType(me.vehicle_type || order.taxi_vehicle_type)
      let baseRow = pricingBundle.baseFares.find(r=> r.area === 'default' && normalizeVehicleType(r.vehicle_type) === vt)
      const base = baseRow?.base_fare_lbp || (vt==='moto'?80000: vt==='toktok'?90000: vt==='van'?250000:150000)
      const cityProfit = pricingBundle.pricing.city_per_km_day_lbp
      let fare = base + totalKm * (cityProfit * Number(engine.factor) + fuelPerKm)
      const minFare = baseRow?.min_fare_lbp || pricingBundle.pricing.min_fare_lbp
      if(fare < minFare) fare = minFare
      return Math.round(fare)
    } catch { return null }
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
      const { data: myOrders } = await supabase.from('taxi_orders').select('*').eq('taxi_id', driverId).in('status',['accepted','on_the_way','arrived','in_progress','code_verified']).order('created_at',{ascending:false})
      setOrders(myOrders||[])
      if(myOrders?.[0] &&!selectedOrderRef.current) setSelectedOrder(myOrders[0])
      if(myOrders?.length>0){ setNearby([]); return; }
      if(myLocation){
        const { data: pending } = await supabase.from('taxi_orders').select('*').eq('status','pending').gte('created_at', new Date(Date.now() - 30*60*1000).toISOString()).order('created_at',{ascending:false}).limit(50)
        const filtered = (pending||[]).filter(o=>{
          if(!o.origin_lat ||!o.origin_lng) return false
          if(o.taxi_vehicle_type && me.vehicle_type && o.taxi_vehicle_type!== me.vehicle_type) return false
          return haversine(myLocation.lat, myLocation.lng, Number(o.origin_lat), Number(o.origin_lng)) <= 5
        }).map(o=>{
          const preview = getDriverPreviewPrice(o)
          return {...o, distance_km: haversine(myLocation.lat, myLocation.lng, Number(o.origin_lat), Number(o.origin_lng)).toFixed(1), preview_price: preview}
        }).sort((a,b)=>parseFloat(a.distance_km) - parseFloat(b.distance_km))
        setNearby(filtered)
      }
    }
    load()
    const interval = setInterval(load, 5000)
    const channel = supabase.channel('taxi_orders_live').on('postgres_changes',{event:'*',schema:'public',table:'taxi_orders'},()=>load()).subscribe()
    return ()=>{ clearInterval(interval); supabase.removeChannel(channel) }
  },[supabase, me, myLocation, pricingBundle])

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

  // SOS للسائق - نفس API الزبون بس سيزن ادمن
  const handleSos = async ()=>{
    if(!selectedOrder) return
    if(!sosComment.trim()) return alert('اكتب شو صار')
    const res = await fetch('/api/taxi/sos', { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify({ order_id: selectedOrder.id, comment: sosComment }) }).then(r=>r.json()).catch(()=>null)
    if(res?.error) alert(res.error)
    else { alert('تم ارسال بلاغ SOS - الادارة رح تتواصل معك'); setShowSos(false); setSosComment('') }
  }

  const logout = async ()=>{
    await fetch('/api/admin/logout',{method:'POST', credentials:'include'});
    window.location.href='/admin/login'
  }

  const Numpad = ()=>(
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999}}>
      <div style={{background:'white', color:'black', borderRadius:16, width:320, padding:16, position:'relative', zIndex:10000}}>
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

  if(!me) return <div style={{padding:20, background:'#0a1930', color:'white', display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh'}}>تحميل...</div>

  const isTripStarted = selectedOrder? (selectedOrder.is_code_verified || ['code_verified','in_progress'].includes(selectedOrder.status)) : false

  return (
    <div dir="rtl" style={{minHeight:'100vh', background:'#0a1930', color:'white', fontFamily:'Cairo', width:'100%', maxWidth:'100vw', overflowX:'hidden'}}>
      {/* مضغوط عقد التلفون - 480px max */}
      <div style={{maxWidth:480, margin:'0 auto', width:'100%', minHeight:'100vh', background:'#0a1930', position:'relative'}}>

      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', background:'#0e2242', padding:'10px 12px', position:'sticky', top:0, zIndex:20, borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
        <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
          <span style={{fontSize:13, fontWeight:900}}>أهلاً {me.name}</span>
          {driverStats && (
            <div style={{display:'flex', alignItems:'center', gap:4, background:'rgba(255,255,255,0.1)', padding:'3px 8px', borderRadius:20}}>
              <Stars rating={driverStats.average_rating} size={12} />
              <span style={{fontSize:11, color:'#facc15', fontWeight:900}}>{Number(driverStats.average_rating||0).toFixed(1)}</span>
            </div>
          )}
          <button onClick={toggleOnline} style={{background:isOnline?'#22c55e':'#ef4444', padding:'4px 10px', borderRadius:20, fontWeight:900, border:'none', color:'white', fontSize:11}}>{isOnline?'🟢':'🔴'} {isOnline?'Online':'Offline'}</button>
        </div>
        <div style={{display:'flex', gap:6, alignItems:'center'}}>
          <a href="/taxi/driver/history" style={{background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', color:'white', padding:'5px 10px', borderRadius:8, textDecoration:'none', fontSize:11, fontWeight:900}}>📜</a>
          <button onClick={logout} style={{background:'rgba(239,68,68,0.2)', border:'1px solid #ef4444', color:'#fca5a5', padding:'5px 10px', borderRadius:8, fontSize:11}}>خروج</button>
        </div>
      </div>

      <div style={{padding:10}}>
      <div style={{background:'linear-gradient(135deg,#10b981,#059669)', color:'white', borderRadius:14, padding:12, display:'flex', justifyContent:'space-between', alignItems:'center', border:'2px solid rgba(255,255,255,0.15)'}}>
        <div onClick={()=>setShowWallet(true)} style={{flex:1, cursor:'pointer'}}>
          <div style={{fontSize:10, opacity:0.8}}>👛 محفظتي</div>
          <div style={{fontSize:20, fontWeight:900, marginTop:1}}>{showBalance? formatLBP(wallet) : '••••••••'}</div>
        </div>
        <div style={{display:'flex', gap:6, alignItems:'center'}}>
          <button onClick={()=>setShowBalance(!showBalance)} style={{background:'white', color:'#059669', padding:'6px 12px', borderRadius:20, fontWeight:900, border:'none', fontSize:11}}>{showBalance?'🙈':'👁'}</button>
        </div>
      </div>

      {myLocation && <div style={{fontSize:9, opacity:0.4, marginTop:6, textAlign:'center'}}>📍 {myLocation.lat.toFixed(4)},{myLocation.lng.toFixed(4)} - مباشر</div>}

      {selectedOrder && (
        <div style={{background:'white', color:'black', borderRadius:14, padding:10, marginTop:10, border:'2px solid #22c55e'}}>
          <div style={{fontSize:12, fontWeight:900, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>#{selectedOrder.order_code} - {selectedOrder.customer_name} - {selectedOrder.customer_phone}</div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginTop:8}}>
            <a href={`tel:${selectedOrder.customer_phone}`} style={{background:'#111', color:'white', padding:10, borderRadius:10, textAlign:'center', fontWeight:900, textDecoration:'none', fontSize:12}}>📞 {selectedOrder.customer_phone}</a>
            <a href={getWhatsappLink(selectedOrder.customer_phone, me.name, selectedOrder.order_code)} target="_blank" style={{background:'#25D366', color:'white', padding:10, borderRadius:10, textAlign:'center', fontWeight:900, textDecoration:'none', fontSize:12}}>💬 واتساب</a>
          </div>
          <div style={{fontSize:11, marginTop:6, background:'#f0fdf4', padding:6, borderRadius:8, border:'1px solid #bbf7d0'}}>
            <div>📍 {selectedOrder.origin_name}</div>
            <div style={{marginTop:2}}>🎯 {selectedOrder.dest_name}</div>
          </div>
          <div style={{marginTop:8, borderRadius:10, overflow:'hidden', border:'1px solid #e5e7eb', height:260}}>
            <TaxiActiveMap myLocation={myLocation} origin_lat={selectedOrder.origin_lat} origin_lng={selectedOrder.origin_lng} dest_lat={selectedOrder.dest_lat} dest_lng={selectedOrder.dest_lng} />
          </div>

          <div style={{marginTop:8}}>
            {!isTripStarted? (
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${selectedOrder.origin_lat},${selectedOrder.origin_lng}`} target="_blank" style={{display:'block', background:'#3b82f6', color:'white', padding:12, borderRadius:10, textAlign:'center', fontWeight:900, textDecoration:'none', fontSize:13}}>🔵 خذني لعند الزبون</a>
            ) : (
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${selectedOrder.dest_lat},${selectedOrder.dest_lng}`} target="_blank" style={{display:'block', background:'#111', color:'white', padding:12, borderRadius:10, textAlign:'center', fontWeight:900, textDecoration:'none', fontSize:13}}>🎯 الى الوجهة</a>
            )}
          </div>

          <div style={{marginTop:8, fontWeight:900, fontSize:13, display:'flex', justifyContent:'space-between'}}>
            <span>💰 {selectedOrder.total_amount?.toLocaleString()} ل.ل</span><span style={{fontSize:11, opacity:0.6}}>{selectedOrder.distance_traveled} كم</span>
          </div>

          {/* الكود - مرتاح متل ما هو */}
          <div style={{marginTop:8, display:'flex', gap:6}}>
            {selectedOrder.status === 'accepted' && <button onClick={()=>setShowCodePad(true)} style={{flex:1, background:'#111', color:'white', padding:11, borderRadius:10, fontWeight:900, fontSize:13}}>تأكيد الكود</button>}
            {(selectedOrder.status === 'in_progress' || selectedOrder.status === 'code_verified') && (<><input placeholder="المبلغ" value={amountReceived} onChange={e=>setAmountReceived(e.target.value)} style={{flex:1, padding:10, border:'2px solid #111', borderRadius:10, color:'black', fontSize:13}}/><button onClick={handleComplete} style={{background:'#22c55e', color:'white', padding:10, borderRadius:10, fontWeight:900, border:'none', fontSize:13}}>انهاء</button></>)}
          </div>

          {/* SOS - نفس الزبون */}
          <div style={{marginTop:8, display:'grid', gridTemplateColumns:'1fr', gap:6}}>
            <button onClick={()=>setShowSos(!showSos)} style={{padding:12, borderRadius:10, background:'#dc2626', color:'white', fontWeight:900, fontSize:13, border:'none'}}>🆘 SOS طوارئ - نفس رقم الرحلة</button>
          </div>

          {showSos && (
            <div style={{marginTop:8, background:'#fee2e2', padding:10, borderRadius:10, border:'1px solid #fecaca'}}>
              <div style={{fontSize:11, fontWeight:900, color:'#dc2626', marginBottom:6}}>بلاغ طوارئ - الرحلة #{selectedOrder.order_code} - المرسل: السائق {me.name}</div>
              <textarea value={sosComment} onChange={e=>setSosComment(e.target.value)} placeholder="شو صار؟ اكتب المشكلة..." style={{width:'100%', padding:10, borderRadius:8, border:'1px solid #fecaca', fontSize:12, boxSizing:'border-box'}} rows={3}/>
              <button onClick={handleSos} style={{marginTop:6, width:'100%', padding:10, borderRadius:8, background:'#dc2626', color:'white', fontWeight:900, border:'none', fontSize:13}}>ارسال البلاغ - نفس الرحلة</button>
              <div style={{fontSize:9, opacity:0.6, marginTop:4, textAlign:'center'}}>رقم الرحلة ما بيتغير - بس المرسل سائق</div>
            </div>
          )}

          <div style={{marginTop:6, fontSize:10, background:'#fef3c7', padding:6, borderRadius:8, color:'#92400e', textAlign:'center'}}>⛔ ما فيك تاخد طلب تاني حتى تخلص هيدا</div>
        </div>
      )}

      {!selectedOrder && (
      <div style={{marginTop:12}}>
        <h3 style={{fontWeight:900, fontSize:13}}>🔍 قريب 5 كم ({nearby.length})</h3>
        {nearby.map(o=>{
          const preview = o.preview_price
          const isDifferent = preview && preview!== o.total_amount
          return (
          <div key={o.id} style={{background:'#132a54', borderRadius:12, padding:10, marginTop:6, border: expandedId===o.id?'2px solid #22c55e':'1px solid #1e3a6e'}}>
            <div style={{display:'flex', justifyContent:'space-between', fontSize:11}}><span>#{o.order_code}</span><span style={{background:'#FFC107', color:'black', padding:'2px 6px', borderRadius:8, fontWeight:900}}>{o.distance_km} كم</span></div>
            <div style={{fontSize:10, opacity:0.7, marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{o.origin_name?.slice(0,40)} → {o.dest_name?.slice(0,30)}</div>
            <div style={{display:'flex', justifyContent:'space-between', marginTop:4, fontWeight:900, fontSize:11}}>
              <span>{o.customer_name} - {o.taxi_vehicle_type}</span>
              <span>{o.total_amount?.toLocaleString()}</span>
            </div>
            {preview && (
              <div style={{marginTop:4, background: isDifferent?'#dcfce7':'#f3f4f6', color: isDifferent?'#166534':'#111', padding:'4px 8px', borderRadius:6, fontSize:11, fontWeight:900}}>
                تسعيرتك: {preview.toLocaleString()} ل.ل
              </div>
            )}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginTop:6}}>
              <button onClick={()=>toggleExpand(o)} style={{background:'#1e3a6e', padding:8, borderRadius:8, fontWeight:700, border:'none', color:'white', fontSize:11}}>{expandedId===o.id?'🔼':'📍'} طريق</button>
              <button onClick={()=>handleAccept(o)} style={{background:'#22c55e', padding:8, borderRadius:8, fontWeight:900, border:'none', color:'white', fontSize:11}}>✅ قبول</button>
            </div>
            {expandedId===o.id && (
              <div style={{background:'#0a1930', borderRadius:8, marginTop:6, overflow:'hidden'}}>
                <TaxiNearbyMap myLocation={myLocation} origin_lat={o.origin_lat} origin_lng={o.origin_lng} dest_lat={o.dest_lat} dest_lng={o.dest_lng} routeCoords={expandedRoutes[o.id]} />
              </div>
            )}
          </div>
          )
        })}
        {nearby.length===0 && <div style={{textAlign:'center', padding:20, opacity:0.5, fontSize:12}}>لا يوجد طلبات قريبة</div>}
      </div>
      )}
      </div>
      </div>

      {showCodePad && <Numpad/>}
      {showWallet && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:60, padding:12}}>
          <div style={{background:'white', color:'black', borderRadius:16, width:'100%', maxWidth:360, maxHeight:'80vh', overflow:'hidden', display:'flex', flexDirection:'column'}}>
            <div style={{padding:12, background:'#0a1930', color:'white', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div><div style={{fontSize:11, opacity:0.7}}>محفظتي</div><div style={{fontSize:18, fontWeight:900}}>{showBalance? formatLBP(wallet) : '••••••••'}</div></div>
              <button onClick={()=>setShowWallet(false)} style={{background:'rgba(255,255,255,0.2)', border:'none', color:'white', width:28, height:28, borderRadius:8}}>✕</button>
            </div>
            <div style={{flex:1, overflowY:'auto', padding:8}}>
              {walletTx.map((t,i)=>{
                const amt = Number(t.Amount||0)
                const type = String(t.Type||'').toUpperCase()
                const isDeduct = type==='DEDUCT' || type==='CASH_OUT' || type==='PENALTY'
                return (
                  <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'10px 8px', borderBottom:'1px solid #eee', fontSize:12}}>
                    <div><span style={{background: isDeduct?'#fee2e2':'#dcfce7', padding:'2px 6px', borderRadius:10, fontSize:10}}>{isDeduct?'🔴':'🟢'}</span> {formatLBP(amt)}</div>
                    <div style={{fontSize:10, opacity:0.5}}>{t.Date? new Date(t.Date).toLocaleString('ar-LB'):''}</div>
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
