"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

export default function StoreDashboard(){
  const [supabase, setSupabase] = useState(null)
  const [me, setMe] = useState(null)
  const [store, setStore] = useState(null)
  const [products, setProducts] = useState([])
  const [reqOrders, setReqOrders] = useState([]) // order_requuest
  const [details, setDetails] = useState([]) // order_details
  const [tab, setTab] = useState('products')
  const [subTab, setSubTab] = useState('preparing')
  const [loading, setLoading] = useState(true)

  // اضافة منتجات
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
      // 1. المتجر
      const { data: storeData } = await supabase.from('stores').select('*').eq('Store ID', me.storeId).maybeSingle()
      setStore(storeData)

      // 2. منتجاتي
      const { data: prodData } = await supabase.from('products').select('*').eq('Store ID', me.storeId).order('Product Name')
      setProducts(prodData||[])

      // 3. الطلبات - الصح: order_details Store ID = تبعي
      const { data: detData } = await supabase.from('order_details').select('*').eq('Store ID', me.storeId).order('Request ID', {ascending:false}).limit(200)
      setDetails(detData||[])

      if(detData?.length){
        const reqIds = [...new Set(detData.map(d=>d['Request ID']).filter(Boolean))]
        if(reqIds.length){
          const { data: reqData } = await supabase.from('order_requuest').select('Request ID, customer ID, Area, Cerated Date, Note, Delivery Adress, Approval Status, Items Cost, Total Amount').in('Request ID', reqIds).order('Cerated Date', {ascending:false})
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
      'Store ID': me.storeId,
      'Product Name': n.name,
      'Unit': n.unit,
      'Price': n.price,
      'Image': n.image,
      'Active': false, // بينزل انكتف للمراجعة
      'Stock Qty': 1
    }))
    if(!toInsert.length) return alert('عبي اسم وسعر')
    const { error } = await supabase.from('products').insert(toInsert)
    if(error) alert(error.message)
    else { alert('انضافو للمراجعة - Active FALSE'); setNewProds([{name:'', unit:'حبة', price:'', image:''}]); location.reload() }
  }

  const logout = async ()=>{ await fetch('/api/admin/logout',{method:'POST'}); window.location.href='/admin/login' }
  if(!me) return <div style={{padding:20, background:'#0a1930', color:'white', minHeight:'100vh'}}>تحميل...</div>

  const preparing = reqOrders.filter(r=> ['Pending','Approved','pending','approved'].includes(String(r['Approval Status'])))
  const lat = store?.['Current Latitude'], lng = store?.['Current Longtitude']

  return (
    <div style={{minHeight:'100vh', background:'#0a1930', color:'white', fontFamily:'sans-serif'}}>
      <div style={{background:'#0e2242', borderBottom:'1px solid rgba(255,255,255,0.08)', padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10, position:'sticky', top:0, zIndex:10}}>
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <img src="/logo.png" alt="logo" style={{height:32}} />
          <div>
            <div style={{fontWeight:'900', fontSize:15}}>أهلاً {me.name}</div>
            <div style={{fontSize:11, opacity:0.7}}>{store?.['Store Name'] || ''} - {me.role}</div>
          </div>
        </div>
        <button onClick={logout} style={{background:'rgba(239,68,68,0.15)', color:'#fca5a5', border:'1px solid rgba(239,68,68,0.3)', padding:'7px 14px', borderRadius:10, fontSize:13}}>خروج</button>
      </div>

      <div style={{maxWidth:1100, margin:'0 auto'}}>
        <div style={{display:'flex', gap:8, padding:12, overflowX:'auto'}}>
          <button onClick={()=>setTab('store')} style={{padding:'9px 16px', borderRadius:10, border:'none', background:tab==='store'?'#2563eb':'rgba(255,255,255,0.08)', color:'white'}}>المتجر</button>
          <button onClick={()=>setTab('products')} style={{padding:'9px 16px', borderRadius:10, border:'none', background:tab==='products'?'#2563eb':'rgba(255,255,255,0.08)', color:'white'}}>منتجاتي ({products.length})</button>
          <button onClick={()=>setTab('orders')} style={{padding:'9px 16px', borderRadius:10, border:'none', background:tab==='orders'?'#2563eb':'rgba(255,255,255,0.08)', color:'white'}}>الطلبات ({reqOrders.length})</button>
          <button onClick={()=>setTab('add')} style={{padding:'9px 16px', borderRadius:10, border:'none', background:tab==='add'?'#2563eb':'rgba(255,255,255,0.08)', color:'white'}}>إضافة منتجات</button>
        </div>

        <div style={{padding:12}}>
          {loading? <div style={{textAlign:'center', marginTop:40, opacity:0.6}}>تحميل...</div> :
          tab==='store' && store && (
            <div style={{background:'#f3f1ec', color:'#1a1a1a', padding:16, borderRadius:14}}>
              <div style={{fontWeight:900, fontSize:16}}>{store['Store Name']} - {store.Category}</div>
              <div style={{marginTop:8, fontSize:13, lineHeight:1.6}}>
                <div>المالك: {store['Owner Name']}</div>
                <div>الموبايل: {store.Mobile}</div>
                <div>المنطقة: {store.Area} - {store.Adress}</div>
                <div>الوصف: {store.Description}</div>
                <div>دوام: {store['Open Time']} - {store['Close Time']} | توصيل: {store['Delivery Available']}</div>
                <div>الكمسيون: {store['Commission Rate']}% | الحالة: {store.Status}</div>
              </div>
              {lat && lng && (
                <div style={{marginTop:12, borderRadius:12, overflow:'hidden', border:'1px solid #ddd'}}>
                  <iframe title="map" width="100%" height="280" style={{border:0}} loading="lazy"
                    src={`https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`} />
                </div>
              )}
            </div>
          )}

          {tab==='products' && (
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(170px, 1fr))', gap:12}}>
              {products.map(p=>(
                <div key={p['Product ID']} style={{background:'#f3f1ec', color:'#1a1a1a', borderRadius:14, padding:12}}>
                  {p.Image && <img src={p.Image} style={{width:'100%', height:90, objectFit:'cover', borderRadius:10}} />}
                  <div style={{fontWeight:700, fontSize:13, marginTop:8}}>{p['Product Name']}</div>
                  <div style={{fontSize:11, opacity:0.7}}>{p.Category} - {p.Unit}</div>
                  <div style={{marginTop:6, fontWeight:900}}>{p.Price} $</div>
                  <button onClick={()=>toggleActive(p)} style={{marginTop:8, width:'100%', padding:'6px', borderRadius:8, border:'none', background: p.Active?'#16a34a':'#9ca3af', color:'white', fontSize:12}}>
                    {p.Active? 'Active - إطفاء' : 'INACTIVE - تشغيل'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab==='orders' && (
            <>
              <div style={{display:'flex', gap:8, marginBottom:12}}>
                <button onClick={()=>setSubTab('preparing')} style={{padding:'7px 14px', borderRadius:8, border:'none', background:subTab==='preparing'?'#fff':'rgba(255,255,255,0.1)', color:subTab==='preparing'?'#000':'#fff', fontSize:12}}>قيد التحضير ({preparing.length})</button>
                <button onClick={()=>setSubTab('sales')} style={{padding:'7px 14px', borderRadius:8, border:'none', background:subTab==='sales'?'#fff':'rgba(255,255,255,0.1)', color:subTab==='sales'?'#000':'#fff', fontSize:12}}>المبيعات والكمسيون</button>
              </div>
              {subTab==='preparing'? (
                <div style={{display:'grid', gap:10}}>
                  {preparing.map(r=>{
                    const items = details.filter(d=>d['Request ID']===r['Request ID'])
                    return (
                      <div key={r['Request ID']} style={{background:'#f3f1ec', color:'#1a1a1a', borderRadius:12, padding:12}}>
                        <div style={{display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:700}}>
                          <span>طلب #{r['Request ID']?.slice(0,8)}</span><span style={{background:'#fde68a', padding:'2px 8px', borderRadius:6}}>{r['Approval Status']}</span>
                        </div>
                        <div style={{fontSize:11, opacity:0.7, marginTop:4}}>{r['Cerated Date']} - {r['Delivery Adress']}</div>
                        <div style={{marginTop:8, fontSize:12}}>{items.map(it=> <div key={it['Detail ID']}>• {it['Product ID']} - كمية {it.Qty} بسعر {it['Unit Price']}</div>)}</div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{background:'#f3f1ec', color:'#1a1a1a', padding:14, borderRadius:12, fontSize:13}}>
                  <div>إجمالي المبيعات اليوم: {details.reduce((s,d)=>s+Number(d['Line Total']||0),0).toFixed(2)} $ (نحنا منحسبها)</div>
                  <div>الكمسيون: {store?.['Commission Rate']}% من المبيعات - يحسب تلقائي من Commission Amount</div>
                </div>
              )}
            </>
          )}

          {tab==='add' && (
            <div style={{background:'#f3f1ec', color:'#1a1a1a', padding:14, borderRadius:12}}>
              <div style={{fontWeight:900, marginBottom:10}}>إضافة منتجات - بتنزل Active FALSE للمراجعة</div>
              {newProds.map((np,i)=>(
                <div key={i} style={{display:'grid', gridTemplateColumns:'1fr 80px 80px 1fr', gap:8, marginBottom:8}}>
                  <input placeholder="اسم المنتج" value={np.name} onChange={e=>{const c=[...newProds]; c[i].name=e.target.value; setNewProds(c)}} style={{padding:8, borderRadius:8, border:'1px solid #ccc'}} />
                  <input placeholder="وحدة" value={np.unit} onChange={e=>{const c=[...newProds]; c[i].unit=e.target.value; setNewProds(c)}} style={{padding:8, borderRadius:8, border:'1px solid #ccc'}} />
                  <input placeholder="سعر" value={np.price} onChange={e=>{const c=[...newProds]; c[i].price=e.target.value; setNewProds(c)}} style={{padding:8, borderRadius:8, border:'1px solid #ccc'}} />
                  <input placeholder="رابط الصورة" value={np.image} onChange={e=>{const c=[...newProds]; c[i].image=e.target.value; setNewProds(c)}} style={{padding:8, borderRadius:8, border:'1px solid #ccc'}} />
                </div>
              ))}
              <button onClick={()=>setNewProds([...newProds, {name:'', unit:'حبة', price:'', image:''}])} style={{padding:'6px 12px', borderRadius:8, border:'1px solid #ccc', marginRight:8}}> + منتج</button>
              <button onClick={addProducts} style={{padding:'8px 16px', borderRadius:8, border:'none', background:'#2563eb', color:'white'}}>إرسال للمراجعة</button>

              <div style={{marginTop:20, borderTop:'1px solid #ddd', paddingTop:12}}>
                <div style={{fontWeight:700, fontSize:13}}>طلب تغيير سعر</div>
                <div style={{display:'flex', gap:8, marginTop:8}}>
                  <input placeholder="كود المنتج Product ID" value={priceReq.code} onChange={e=>setPriceReq({...priceReq, code:e.target.value})} style={{padding:8, borderRadius:8, border:'1px solid #ccc', flex:1}} />
                  <div style={{padding:8, background:'#e5e7eb', borderRadius:8, fontSize:12}}>قديم: {products.find(p=>p['Product ID']===priceReq.code)?.Price || '-'}</div>
                  <input placeholder="سعر جديد" value={priceReq.newPrice} onChange={e=>setPriceReq({...priceReq, newPrice:e.target.value})} style={{padding:8, borderRadius:8, border:'1px solid #ccc', width:100}} />
                  <button onClick={async()=>{
                    const prod = products.find(p=>p['Product ID']===priceReq.code)
                    if(!prod) return alert('كود غلط')
                    // منخليها طلب - منعمل تحديث بس مع Active FALSE لترجع مراجعة
                    await supabase.from('products').update({Price: priceReq.newPrice, Active:false}).eq('Product ID', priceReq.code)
                    alert('انبعت طلب تغيير سعر - رجع انكتف للمراجعة')
                  }} style={{padding:'8px 14px', borderRadius:8, background:'#16a34a', color:'white', border:'none'}}>موافق</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
