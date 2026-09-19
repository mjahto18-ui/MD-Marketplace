"use client"
import { useEffect, useState, useRef } from "react"
import { createClient } from "@supabase/supabase-js"
import dynamic from "next/dynamic"
const DriverMap = dynamic(() => import("@/components/Stars"), { ssr: false })

// نفس فكرة ملف الدلفري بس للتاكسي
export default function TaxiDriverDashboard(){
  const [supabase, setSupabase] = useState(null)
  const [me, setMe] = useState(null)
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [myLocation, setMyLocation] = useState(null)
  const [isOnline, setIsOnline] = useState(true)
  const [wallet, setWallet] = useState(0)
  const [showCodePad, setShowCodePad] = useState(false)
  const [codeInput, setCodeInput] = useState("")
  const [amountReceived, setAmountReceived] = useState("")

  const locationWatchRef = useRef(null)

  useEffect(()=>{
    setSupabase(createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
    fetch('/api/admin/me').then(r=>r.json()).then(setMe)
  },[])

  // نفس منطق الدلفري - تتبع حي كل شوي
  useEffect(()=>{
    if(!supabase || !me || !isOnline) return
    const driverId = me.relatedId || me.userId
    if(!driverId) return
    locationWatchRef.current = navigator.geolocation.watchPosition(async pos=>{
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      setMyLocation({lat,lng})
      await supabase.from('taxi_drivers').update({
        lat, lng,
        "Last Location Update": new Date().toISOString(),
        is_online: true
      }).eq('Taxi_ID', driverId)
      // حدث موقعك الحي بالطلب الحالي كمان
      if(selectedOrder){
        await supabase.from('taxi_orders').update({ taxi_lat_live: lat, taxi_lng_live: lng }).eq('id', selectedOrder.id)
      }
    }, ()=>{}, {enableHighAccuracy:true})
    return ()=>{ if(locationWatchRef.current) navigator.geolocation.clearWatch(locationWatchRef.current) }
  },[supabase, me, isOnline, selectedOrder])

  useEffect(()=>{
    if(!supabase || !me) return
    const load = async ()=>{
      const driverId = me.relatedId || me.userId
      // محفظة
      const { data: w } = await supabase.from('wallets').select('balance').eq('taxi_id', driverId).single()
      if(w) setWallet(w.balance)
      // طلباتي - pending قريب مني + accepted
      const { data } = await supabase.from('taxi_orders').select('*').eq('taxi_id', driverId).in('status',['accepted','on_the_way','arrived','in_progress']).order('created_at',{ascending:false})
      setOrders(data||[])
      if(data && data[0]) setSelectedOrder(data[0])
    }
    load()
    const channel = supabase.channel('taxi_orders').on('postgres_changes',{event:'*',schema:'public',table:'taxi_orders'},()=>load()).subscribe()
    return ()=>{ supabase.removeChannel(channel) }
  },[supabase, me])

  const toggleOnline = async ()=>{
    const driverId = me.relatedId || me.userId
    await supabase.from('taxi_drivers').update({ is_online: !isOnline }).eq('Taxi_ID', driverId)
    setIsOnline(!isOnline)
  }

  const handleVerifyCode = async ()=>{
    if(codeInput.length !== 4) return
    const res = await fetch('/api/taxi/verify-code',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ order_id: selectedOrder.id, taxi_id: me.relatedId, code: codeInput })}).then(r=>r.json())
    if(res.error) alert(res.error)
    else {
      alert(`تم التأكيد - خصم ${res.commission_deducted} ل.ل - رصيدك ${res.new_wallet_balance}`)
      setShowCodePad(false); setCodeInput(""); setWallet(res.new_wallet_balance)
    }
  }

  const handleComplete = async ()=>{
    await supabase.from('taxi_orders').update({ status:'completed', amount_received: parseInt(amountReceived)||0, actual_end_at: new Date().toISOString() }).eq('id', selectedOrder.id)
    location.reload()
  }

  const Numpad = ()=>(
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50}}>
      <div style={{background:'white', color:'black', borderRadius:16, width:320, padding:16}}>
        <h3 style={{textAlign:'center', fontWeight:900}}>أدخل كود التوصيل</h3>
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
        <span>أهلاً {me.name} - محفظتي {wallet} ل.ل</span>
        <button onClick={toggleOnline} style={{background:isOnline?'#22c55e':'#ef4444', padding:'6px 14px', borderRadius:20, fontWeight:900}}>{isOnline?'🟢 Online':'🔴 Offline'}</button>
      </div>

      {selectedOrder && (
        <div style={{background:'white', color:'black', borderRadius:14, padding:14, marginTop:12}}>
          <b>#{selectedOrder.id.slice(0,8)} - {selectedOrder.origin_name} → {selectedOrder.dest_name}</b>
          <div>المبلغ: {selectedOrder.total_amount} ل.ل - {selectedOrder.taxi_vehicle_type}</div>
          <div style={{marginTop:10, display:'flex', gap:8}}>
            {selectedOrder.status === 'accepted' && <button onClick={()=>setShowCodePad(true)} style={{flex:1, background:'#111', color:'white', padding:12, borderRadius:10, fontWeight:900}}>تأكيد الرحلة - أدخل كود الزبونة</button>}
            {selectedOrder.status === 'in_progress' && (
              <>
                <input placeholder="المبلغ المستلم كاش" value={amountReceived} onChange={e=>setAmountReceived(e.target.value)} style={{flex:1, padding:10, border:'2px solid #111', borderRadius:10}}/>
                <button onClick={handleComplete} style={{background:'#22c55e', color:'white', padding:10, borderRadius:10, fontWeight:900}}>انهاء الرحلة</button>
              </>
            )}
          </div>
        </div>
      )}

      {showCodePad && <Numpad/>}
    </div>
  )
}
