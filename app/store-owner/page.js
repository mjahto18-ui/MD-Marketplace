"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

export default function StoreDashboard(){
  const [supabase, setSupabase] = useState(null)
  const [me, setMe] = useState(null)
  const [store, setStore] = useState(null)
  const [products, setProducts] = useState([])
  const [reqOrders, setReqOrders] = useState([])
  const [details, setDetails] = useState([])
  const [tab, setTab] = useState('products')
  const [subTab, setSubTab] = useState('preparing')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showBarcode, setShowBarcode] = useState({})

  const [newProds, setNewProds] = useState([{name:'', unit:'حبة', price:'', image:''}])
  const [priceReq, setPriceReq] = useState({code:'', newPrice:''})

  useEffect(()=>{
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1','').replace(/\/$/,'')
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    setSupabase(createClient(url, key))
    fetch('/api/admin/me').then(r=>r.json()).then(setMe)
  },[])

  useEffect(()=>{
    if(!supabase ||!me?.storeId) return
    const load = async ()=>{
      setLoading(true)
      const { data: storeData } = await supabase.from('stores').select('*').eq('Store ID', me.storeId).maybeSingle()
      setStore(storeData)
      const { data: prodData } = await supabase.from('products').select('*').eq('Store ID', me.storeId).order('Product Name').limit(300)
      setProducts(prodData||[])
      const { data: detData } = await supabase.from('order_details').select('*').eq('Store ID', me.storeId).order('Request ID', {ascending:false}).limit(200)
      setDetails(detData||[])
      if(detData?.length){
        const reqIds = [...new Set(detData.map(d=>d['Request ID']).filter(Boolean))]
        if(reqIds.length){
          const { data: reqData } = await supabase.from('order_requuest').select('Request ID, Cerated Date, Note, Delivery Adress, Approval Status').in('Request ID', reqIds).order('Cerated Date', {ascending:false})
          setReqOrders(reqData||[])
        }
      }
      setLoading(false)
    }
    load()
  },[supabase, me])

  const toggleActive = async (p)=>{
    const newVal =!p.Active
    await supabase.from('products').update({Active: newVal}).eq('Product ID', p['Product ID'])
    setProducts(prev=>prev.map(x=> x['Product ID']===p['Product ID']? {...x, Active:newVal}:x))
  }

  const addProducts = async ()=>{
    const toInsert = newProds.filter(n=>n.name && n.price).map(n=>({
      'Store ID': me.storeId, 'Product Name': n.name, 'Unit': n.unit, 'Price': n.price, 'Image': n.image, 'Active': false, 'Stock Qty': 1
    }))
    if(!toInsert.length) return alert('عبي اسم وسعر')
    const { error } = await supabase.from('products').insert(toInsert)
    if(error) alert(error.message)
    else { alert('انضافو للمراجعة'); setNewProds([{name:'', unit:'حبة', price:'', image:''}]); location.reload() }
  }

  const logout = async ()=>{ await fetch('/api/admin/logout',{method:'POST'}); window.location.href='/admin/login' }
  if(!me) return <div style={{padding:20, background:'#0a1930', color:'white', minHeight:'100vh'}}>تحميل...</div>

  const preparing = reqOrders.filter(r=> ['Pending','Approved'].includes(String(r['Approval Status'])))
  const lat = store?.['Current Latitude'], lng = store?.['Current Longtitude']
  const commissionText = store?.['Commission Rate']? String(store['Commission Rate']).replace('%%','%') : ''

  // فلترة بحث
  const filteredProducts = products.filter(p=>
    (p['Product Name']||'').toLowerCase().includes(search.toLowerCase()) ||
    (p['Product ID']||'').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{minHeight:'100vh', background:'#0a1930', color:'white', fontFamily:'sans-serif'}}>
      <div style={{background:'#0e2242', borderBottom:'1px solid rgba(255,255,255,0.08)', padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10}}>
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <img src="/logo.png" alt="logo" style={{height:32}} />
          <div><div style={{fontWeight:'900', fontSize:15}}>أهلاً {me.name}</div><div style={{fontSize:11, opacity:0.7}}>{store?.['Store Name'] || ''}</div></div>
        </div>
        <button onClick={logout} style={{background:'rgba(239,68,68,0.15)', color:'#fca5a5', border:'1px solid rgba(239,68,68,0.3)', padding:'7px 14px', borderRadius:10, fontSize:13}}>خروج</button>
      </div>

      <div style={{maxWidth:1150, margin:'0 auto'}}>
        <div style={{display:'flex', gap:8, padding:12, overflowX:'auto'}}>
          <button onClick={()=>setTab('store')} style={{padding:'9px 16px', borderRadius:10, border:'none', background:tab==='store'?'#2563eb':'rgba(255,255,255,0.08)', color:'white'}}>المتجر</button>
          <button onClick={()=>setTab('products')} style={{padding:'9px 16px', borderRadius:10, border:'none', background:tab==='products'?'#2563eb':'rgba(255,255,255,0.08)', color:'white'}}>منتجاتي ({filteredProducts.length})</button>
          <button onClick={()=>setTab('orders')} style={{padding:'9px 16px', borderRadius:10, border:'none', background:tab==='orders'?'#2563eb':'rgba(255,255,255,0.08)', color:'white'}}>الطلبات ({reqOrders.length})</button>
          <button onClick={()=>setTab('add')} style={{padding:'9px 16px', borderRadius:10, border:'none', background:tab==='add'?'#2563eb':'rgba(255,255,255,0.08)', color:'white'}}>إضافة منتجات</button>
        </div>

        <div style={{padding:12}}>
          {loading? <div style={{textAlign:'center', marginTop:40}}>تحميل...</div> :

          tab==='store' && store && (
            <div style={{background:'#f3f1ec', color:'#1a1a1a', padding:16, borderRadius:14}}>
              <div style={{fontWeight:900, fontSize:18}}>{store['Store Name']}</div>
              <div style={{marginTop:10, fontSize:13, lineHeight:1.8, display:'grid', gap:2}}>
                <div>المالك: {store['Owner Name']} | الموبايل: {store.Mobile}</div>
                <div>المنطقة: {store.Area} - {store.Adress}</div>
                <div>الوصف: {store.Description}</div>
                <div>دوام: {store['Open Time']} - {store['Close Time']} | توصيل: {store['Delivery Available']}</div>
                <div>الكمسيون: {commissionText} | الحالة: {store.Status}</div>
              </div>
              {lat && lng && (
                <div style={{marginTop:14, borderRadius:12, overflow:'hidden', border:'1px solid #ddd'}}>
                  <iframe title="map" width="100%" height="320" style={{border:0}} loading="lazy" src={`https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`} />
                </div>
              )}
            </div>
          )}

          {tab==='products' && (
            <>
              <input placeholder="بحث باسم المنتج أو الباركود..." value={search} onChange={e=>setSearch(e.target.value)}
                style={{width:'100%', padding:'12px 14px', borderRadius:12, border:'none', background:'#f3f1ec', color:'#1a1a1a', marginBottom:12, fontSize:14}} />
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(165px, 1fr))', gap:12}}>
                {filteredProducts.map(p=>(
                  <div key={p['Product ID']} style={{background:'#f3f1ec', color:'#1a1a1a', borderRadius:14, padding:10, display:'flex', flexDirection:'column'}}>
                    <div style={{background:'white', borderRadius:10, height:110, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden'}}>
                      {p.Image? <img src={p.Image} style={{maxWidth:'100%', maxHeight:'100%', objectFit:'contain'}} /> : <span style={{opacity:0.3}}>لا صورة</span>}
                    </div>
                    <div style={{fontWeight:700, fontSize:12, marginTop:8, lineHeight:1.3, minHeight:32}}>{p['Product Name']}</div>
                    <div style={{fontSize:10, opacity:0.6}}>{p.Unit}</div>
                    <div style={{marginTop:6, display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                      <div style={{fontWeight:900, fontSize:13}}>{Number(p.Price||0).toLocaleString('ar-LB')} ل.ل</div>
                      <button onClick={()=>setShowBarcode(s=>({...s, [p['Product ID']]:!s[p['Product ID']]}))} style={{background:'none', border:'none', cursor:'pointer', fontSize:16}}>👁️</button>
                    </div>
                    {showBarcode[p['Product ID']] && (
                      <div style={{marginTop:6, background:'#fff', border:'1px dashed #ccc', padding:6, borderRadius:8, fontSize:10, wordBreak:'break-all'}}>
                        باركود: {p['Product ID']}<br/>Base: {p['Products_Base_ID']||'-'}
                      </div>
                    )}
                    <button onClick={()=>toggleActive(p)} style={{marginTop:8, width:'100%', padding:'7px', borderRadius:8, border:'none', background: p.Active?'#16a34a':'#6b7280', color:'white', fontSize:11, fontWeight:700}}>
                      {p.Active? 'Active - إطفاء' : 'INACTIVE'}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab==='orders' && (
            <div style={{display:'grid', gap:10}}>
              {preparing.map(r=>{
                const items = details.filter(d=>d['Request ID']===r['Request ID'])
                return (
                  <div key={r['Request ID']} style={{background:'#f3f1ec', color:'#1a1a1a', borderRadius:12, padding:12}}>
                    <div style={{display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:700}}>
                      <span>طلب #{r['Request ID']?.slice(0,8)}</span><span style={{background:'#fde68a', padding:'2px 8px', borderRadius:6}}>{r['Approval Status']}</span>
                    </div>
                    <div style={{fontSize:11, opacity:0.7, marginTop:4}}>{r['Cerated Date']} - {r['Delivery Adress']}</div>
                    <div style={{marginTop:8, fontSize:12}}>{items.map(it=> <div key={it['Detail ID']}>• كمية {it.Qty} بسعر {Number(it['Unit Price']||0).toLocaleString()} ل.ل</div>)}</div>
                  </div>
                )
              })}
            </div>
          )}

          {tab==='add' && (
            <div style={{background:'#f3f1ec', color:'#1a1a1a', padding:14, borderRadius:12}}>
              <div style={{fontWeight:900, marginBottom:10}}>إضافة منتجات - Active FALSE للمراجعة</div>
              {newProds.map((np,i)=>(
                <div key={i} style={{display:'grid', gridTemplateColumns:'1fr 70px 100px 1fr', gap:6, marginBottom:8}}>
                  <input placeholder="اسم" value={np.name} onChange={e=>{const c=[...newProds]; c[i].name=e.target.value; setNewProds(c)}} style={{padding:8, borderRadius:8, border:'1px solid #ccc'}} />
                  <input placeholder="وحدة" value={np.unit} onChange={e=>{const c=[...newProds]; c[i].unit=e.target.value; setNewProds(c)}} style={{padding:8, borderRadius:8, border:'1px solid #ccc'}} />
                  <input placeholder="سعر ل.ل" value={np.price} onChange={e=>{const c=[...newProds]; c[i].price=e.target.value; setNewProds(c)}} style={{padding:8, borderRadius:8, border:'1px solid #ccc'}} />
                  <input placeholder="رابط الصورة" value={np.image} onChange={e=>{const c=[...newProds]; c[i].image=e.target.value; setNewProds(c)}} style={{padding:8, borderRadius:8, border:'1px solid #ccc'}} />
                </div>
              ))}
              <button onClick={()=>setNewProds([...newProds, {name:'', unit:'حبة', price:'', image:''}])} style={{padding:'6px 12px', borderRadius:8, border:'1px solid #ccc'}}> + منتج</button>
              <button onClick={addProducts} style={{padding:'8px 16px', borderRadius:8, border:'none', background:'#2563eb', color:'white', marginLeft:8}}>إرسال للمراجعة</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
