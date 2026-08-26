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

  return (
    <div style={{minHeight:'100vh', background:'#0a1930', color:'white', fontFamily:'sans-serif'}}>
      {/* هيدر responsive */}
      <div style={{background:'#0e2242', borderBottom:'1px solid rgba(255,255,255,0.08)', padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10, position:'sticky', top:0, zIndex:10}}>
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <img src="/logo.png" alt="logo" style={{height:32, width:'auto'}} />
          <div>
            <div style={{fontWeight:'900', fontSize:15}}>أهلاً {me.name}</div>
            <div style={{fontSize:11, opacity:0.7}}>اختصاص: {me.role} {store?.['Store Name'] ? ` - ${store['Store Name']}` : ''}</div>
          </div>
        </div>
        <button onClick={logout} style={{background:'rgba(239,68,68,0.15)', color:'#fca5a5', border:'1px solid rgba(239,68,68,0.3)', padding:'7px 14px', borderRadius:10, fontSize:13}}>خروج</button>
      </div>

      <div style={{maxWidth:1100, margin:'0 auto', width:'100%'}}>
        <div style={{display:'flex', gap:8, padding:12, overflowX:'auto'}}>
          <button onClick={()=>setTab('products')} style={{whiteSpace:'nowrap', padding:'9px 16px', borderRadius:10, border:'none', background: tab==='products'?'#2563eb':'rgba(255,255,255,0.08)', color:'white', fontSize:13}}>منتجاتي ({products.length})</button>
          <button onClick={()=>setTab('orders')} style={{whiteSpace:'nowrap', padding:'9px 16px', borderRadius:10, border:'none', background: tab==='orders'?'#2563eb':'rgba(255,255,255,0.08)', color:'white', fontSize:13}}>طلبات متجري ({orders.length})</button>
          <button onClick={()=>setTab('store')} style={{whiteSpace:'nowrap', padding:'9px 16px', borderRadius:10, border:'none', background: tab==='store'?'#2563eb':'rgba(255,255,255,0.08)', color:'white', fontSize:13}}>المتجر</button>
        </div>

        <div style={{padding:12}}>
          {loading? <div style={{textAlign:'center', marginTop:40, opacity:0.6}}>تحميل...</div> : tab==='products' && (
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:12}}>
              {products.map(p=>(
                <div key={p.supa_id} style={{background:'#f3f1ec', color:'#1a1a1a', borderRadius:14, padding:12}}>
                  <div style={{fontWeight:'bold', fontSize:13}}>{p['Product Name']}</div>
                  <div style={{marginTop:8, fontWeight:'900'}}>{p.Price || p.price}</div>
                </div>
              ))}
            </div>
          )}
          {tab==='orders' && (
            <div style={{background:'#f3f1ec', borderRadius:12, overflow:'hidden'}}>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%', color:'#1a1a1a', fontSize:13, minWidth:400}}>
                  <thead style={{background:'#0e2242', color:'white'}}><tr><th style={{padding:10, textAlign:'right'}}>Product</th><th>Qty</th></tr></thead>
                  <tbody>{orders.map(o=><tr key={o.supa_id} style={{borderBottom:'1px solid #e5ddd1'}}><td style={{padding:10}}>{o['Product ID']}</td><td>{o.Quantity || o.Qty}</td></tr>)}</tbody>
                </table>
              </div>
            </div>
          )}
          {tab==='store' && <div style={{background:'#f3f1ec', color:'#1a1a1a', padding:16, borderRadius:12, fontSize:13}}>{store?.['Store Name']}<br/>{store?.Area}</div>}
        </div>
      </div>
    </div>
  )
}
