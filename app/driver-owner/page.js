"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

export default function DriverDashboard(){
  const [supabase, setSupabase] = useState(null)
  const [me, setMe] = useState(null)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1','').replace(/\/$/,'')
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    setSupabase(createClient(url, key))
    fetch('/api/admin/me').then(r=>r.json()).then(setMe)
  },[])

  useEffect(()=>{
    if(!supabase || !me) return
    const load = async ()=>{
      setLoading(true)
      const driverId = me.relatedId || me.userId // Related ID هو الكود الحقيقي
      const { data: reqData } = await supabase.from('order_requuest').select('*').eq('Driver ID', driverId).limit(100)
      const { data: histData } = await supabase.from('orders_history').select('*').eq('Driver ID', driverId).limit(100)
      setRequests([...(reqData||[]), ...(histData||[])])
      setLoading(false)
    }
    load()
  },[supabase, me])

  const updateStatus = async (row, newStatus)=>{
    await supabase.from('order_requuest').update({ Status: newStatus }).eq('supa_id', row.supa_id)
    location.reload()
  }
  const logout = async ()=>{ await fetch('/api/admin/logout',{method:'POST'}); window.location.href='/admin/login' }

  if(!me) return <div style={{padding:20, background:'#0a1930', color:'white', minHeight:'100vh'}}>تحميل...</div>

  return (
    <div style={{minHeight:'100vh', background:'#0a1930', color:'white', fontFamily:'sans-serif'}}>
      {/* هيدر responsive */}
      <div style={{background:'#0e2242', borderBottom:'1px solid rgba(255,255,255,0.08)', padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10}}>
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <img src="/logo.png" alt="logo" style={{height:32, width:'auto', objectFit:'contain'}} />
          <div>
            <div style={{fontWeight:'900', fontSize:15}}>أهلاً {me.name}</div>
            <div style={{fontSize:11, opacity:0.7}}>اختصاص: {me.role}</div>
          </div>
        </div>
        <button onClick={logout} style={{background:'rgba(239,68,68,0.15)', color:'#fca5a5', border:'1px solid rgba(239,68,68,0.3)', padding:'7px 14px', borderRadius:10, fontSize:13}}>خروج</button>
      </div>

      <div style={{padding:12, maxWidth:900, margin:'0 auto', width:'100%'}}>
        {loading? <div style={{textAlign:'center', marginTop:40, opacity:0.6}}>تحميل...</div> : requests.map(r=>(
          <div key={r.supa_id} style={{background:'#f3f1ec', color:'#1a1a1a', borderRadius:14, padding:14, marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10}}>
            <div style={{minWidth:140}}><b style={{fontSize:14}}>{r['Request ID'] || r['Order ID'] || r.supa_id.slice(0,8)}</b><div style={{fontSize:12, opacity:0.7, marginTop:3}}>{r.Status || r.status} - {r.Area || ''}</div></div>
            <div style={{display:'flex', gap:8}}>
              <button onClick={()=>updateStatus(r,'On the way')} style={{background:'#2563eb', color:'white', padding:'8px 14px', borderRadius:10, border:'none', fontSize:13}}>انطلق</button>
              <button onClick={()=>updateStatus(r,'Delivered')} style={{background:'#22c55e', color:'white', padding:'8px 14px', borderRadius:10, border:'none', fontSize:13}}>تم</button>
            </div>
          </div>
        ))}
        {!loading && requests.length===0 && <div style={{opacity:0.6, textAlign:'center', marginTop:60}}>ما عندك طلبات حاليا</div>}
      </div>
    </div>
  )
}
