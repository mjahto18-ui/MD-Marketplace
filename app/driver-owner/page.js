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
      // جرب order_requuest و orders_history - حسب شو عندك فيه Driver ID
      const { data: reqData } = await supabase.from('order_requuest').select('*').or(`Driver ID.eq.${me.userId},Driver_ID.eq.${me.userId}`).limit(100)
      const { data: histData } = await supabase.from('orders_history').select('*').or(`Driver ID.eq.${me.userId},Driver_ID.eq.${me.userId}`).limit(100)
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
    <div style={{minHeight:'100vh', background:'#0a1930', color:'white'}}>
      <div style={{padding:'14px 20px', display:'flex', justifyContent:'space-between', background:'#0e2242'}}>
        <div><b>سائق: {me.name}</b> <span style={{opacity:0.5, fontSize:12}}>{me.userId}</span></div>
        <button onClick={logout} style={{background:'rgba(239,68,68,0.15)', color:'#fca5a5', padding:'6px 12px', borderRadius:'8px'}}>Logout</button>
      </div>
      <div style={{padding:12}}>
        {loading? 'تحميل...' : requests.map(r=>(
          <div key={r.supa_id} style={{background:'#f3f1ec', color:'#1a1a1a', borderRadius:12, padding:12, marginBottom:10, display:'flex', justifyContent:'space-between'}}>
            <div><b>{r['Request ID'] || r['Order ID']}</b><div style={{fontSize:12}}>{r.Status || r.status} - {r.Area || ''}</div></div>
            <div style={{display:'flex', gap:6}}>
              <button onClick={()=>updateStatus(r,'On the way')} style={{background:'#2563eb', color:'white', padding:'6px 12px', borderRadius:8}}>انطلق</button>
              <button onClick={()=>updateStatus(r,'Delivered')} style={{background:'#22c55e', color:'white', padding:'6px 12px', borderRadius:8}}>تم</button>
            </div>
          </div>
        ))}
        {!loading && requests.length===0 && <div style={{opacity:0.6, textAlign:'center', marginTop:40}}>ما عندك طلبات حاليا</div>}
      </div>
    </div>
  )
}
