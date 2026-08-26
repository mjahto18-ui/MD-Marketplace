"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

export default function StoreDashboard(){
  const [supabase, setSupabase] = useState(null)
  const [me, setMe] = useState(null)
  const [store, setStore] = useState(null)
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [tab, setTab] = useState('products')
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1','').replace(/\/$/,'')
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    setSupabase(createClient(url, key))
    fetch('/api/admin/me').then(r=>r.json()).then(setMe)
  },[])

  useEffect(()=>{
    if(!supabase || !me?.storeId) return
    const load = async ()=>{
      setLoading(true)
      const { data: storeData } = await supabase.from('stores').select('*').eq('Store ID', me.storeId).maybeSingle()
      setStore(storeData)
      const { data: prodData } = await supabase.from('products').select('*').eq('Store ID', me.storeId).limit(100)
      setProducts(prodData||[])
      
      if(prodData?.length){
        const pIds = prodData.map(p=>p['Product ID'])
        const { data: orderDet } = await supabase.from('order_details').select('*').in('Product ID', pIds).limit(100)
        setOrders(orderDet||[])
      }
      setLoading(false)
    }
    load()
  },[supabase, me])

  const logout = async ()=>{ await fetch('/api/admin/logout',{method:'POST'}); window.location.href='/admin/login' }

  if(!me) return <div style={{padding:20, background:'#0a1930', color:'white', minHeight:'100vh'}}>تحميل...</div>
  if(me.role!=='Store Owner' && me.role!=='Admin') { window.location.href='/admin/login'; return null }

  return (
    <div style={{minHeight:'100vh', background:'#0a1930', color:'white', fontFamily:'sans-serif'}}>
      <div style={{padding:'14px 20px', display:'flex', justifyContent:'space-between', background:'#0e2242', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
        <div><b>{store?.['Store Name'] || 'متجري'}</b> <span style={{opacity:0.5, fontSize:12, marginLeft:8}}>{me.storeId}</span></div>
        <button onClick={logout} style={{background:'rgba(239,68,68,0.15)', color:'#fca5a5', border:'1px solid rgba(239,68,68,0.3)', padding:'6px 12px', borderRadius:'8px'}}>Logout</button>
      </div>

      <div style={{display:'flex', gap:8, padding:12}}>
        <button onClick={()=>setTab('products')} style={{padding:'8px 16px', borderRadius:8, background: tab==='products'?'#2563eb':'rgba(255,255,255,0.08)'}}>منتجاتي ({products.length})</button>
        <button onClick={()=>setTab('orders')} style={{padding:'8px 16px', borderRadius:8, background: tab==='orders'?'#2563eb':'rgba(255,255,255,0.08)'}}>طلبات متجري ({orders.length})</button>
        <button onClick={()=>setTab('store')} style={{padding:'8px 16px', borderRadius:8, background: tab==='store'?'#2563eb':'rgba(255,255,255,0.08)'}}>معلومات المتجر</button>
      </div>

      <div style={{padding:12}}>
        {loading? 'تحميل...' : tab==='products' && (
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:12}}>
            {products.map(p=>(
              <div key={p.supa_id} style={{background:'#f3f1ec', color:'#1a1a1a', borderRadius:12, padding:12}}>
                <div style={{fontWeight:'bold'}}>{p['Product Name']}</div>
                <div style={{fontSize:12, opacity:0.6}}>{p['Product ID']}</div>
                <div style={{marginTop:8, fontWeight:'bold'}}>{p.Price || p.price}</div>
              </div>
            ))}
          </div>
        )}
        {tab==='orders' && (
          <table style={{width:'100%', background:'#f3f1ec', color:'#1a1a1a', borderRadius:10, fontSize:13}}>
            <thead style={{background:'#0e2242', color:'white'}}><tr><th style={{padding:10}}>Product ID</th><th>Detail ID</th><th>Qty</th></tr></thead>
            <tbody>{orders.map(o=><tr key={o.supa_id} style={{borderBottom:'1px solid #e5ddd1'}}><td style={{padding:10}}>{o['Product ID']}</td><td>{o['Detail ID']}</td><td>{o.Quantity || o.Qty}</td></tr>)}</tbody>
          </table>
        )}
        {tab==='store' && <pre style={{background:'#f3f1ec', color:'#1a1a1a', padding:16, borderRadius:10}}>{JSON.stringify(store,null,2)}</pre>}
      </div>
    </div>
  )
}
