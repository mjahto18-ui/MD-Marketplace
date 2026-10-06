"use client"
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

export default function StoreDashboard(){
  const [supabase, setSupabase] = useState(null)
  const [me, setMe] = useState(null)
  const [store, setStore] = useState(null)
  const [products, setProducts] = useState([])
  const [reqOrders, setReqOrders] = useState([])
  const [details, setDetails] = useState([])
  const [tab, setTab] = useState('orders')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showBarcode, setShowBarcode] = useState({})
  const [newProds, setNewProds] = useState([{name:'', unit:'حبة', price:'', image:''}])
  const [priceReq, setPriceReq] = useState({code:'', newPrice:''})
  // --- محفظة ---
  const [wallet, setWallet] = useState(0)
  const [walletTx, setWalletTx] = useState([])
  const [showWallet, setShowWallet] = useState(false)
  // --- اضافات جديدة فقط - دوام + رواتب + ديسبلاي ---
  const [attendanceLive, setAttendanceLive] = useState([])
  const [attendanceEmployees, setAttendanceEmployees] = useState([])
  const [attendanceStats, setAttendanceStats] = useState({on_now:0, today_total:0, present_today:0, absent:0})
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [payrollRows, setPayrollRows] = useState([])
  const [payrollLoading, setPayrollLoading] = useState(false)
  const [payrollMonth, setPayrollMonth] = useState(new Date().toISOString().slice(0,7))
  const [origin, setOrigin] = useState("")
  // --- اشتراك - جديد فقط ---
  const [sub, setSub] = useState(null)
  const [empForm, setEmpForm] = useState({full_name:'', department:'موظف', salary_type:'monthly', base_salary:'', hourly_rate:'', required_hours:286, mobile:''})
  const [empList, setEmpList] = useState([])

  useEffect(()=>{
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1','').replace(/\/$/,'')
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    setSupabase(createClient(url, key))
    fetch('/api/admin/me').then(r=>r.json()).then(setMe)
    setOrigin(window.location.origin)
  },[])

  useEffect(()=>{
    if(!supabase ||!me?.storeId) return
    const load = async ()=>{
      setLoading(true)
      try{
        const w = await fetch(`/api/wallet/me?userId=${me.userId}`, {cache:'no-store'}).then(r=>r.json())
        if(w.success){
          setWallet(w.wallet||0)
          setWalletTx(w.transactions||[])
        }
      }catch{}
      // --- جلب الاشتراك - جديد ---
      try{
        const s = await fetch(`/api/stores/sub-info?store_id=${me.storeId}`, {cache:'no-store'}).then(r=>r.json())
        setSub(s)
      }catch{}
      const { data: storeData } = await supabase.from('stores').select('*').eq('Store ID', me.storeId).maybeSingle()
      setStore(storeData)
      const { data: prodData } = await supabase.from('products').select('*').eq('Store ID', me.storeId).order('Product Name').limit(300)
      setProducts(prodData||[])
      const { data: detData } = await supabase.from('order_details').select('*').eq('Store ID', me.storeId).order('Request ID', {ascending:false}).limit(200)
      setDetails(detData||[])
      if(detData?.length){
        const reqIds = [...new Set(detData.map(d=>String(d['Request ID'])).filter(Boolean))]
        if(reqIds.length){
          const { data: reqData } = await supabase.from('order_requuest').select('*').in('Request ID', reqIds).order('Cerated Date', {ascending:false})
          setReqOrders(reqData||[])
        }
      }
      setLoading(false)
    }
    load()
  },[supabase, me])

  // --- تحميل دوام و رواتب بس لما يفتح التاب - اضافة جديدة فقط ---
  useEffect(()=>{
    if(!me?.storeId) return
    if(tab==='attendance'){
      const loadAtt = async ()=>{
        setAttendanceLoading(true)
        try{
          const res = await fetch(`/api/admin/attendance/today?store_id=${me.storeId}`, {cache:'no-store'})
          const j = await res.json()
          if(j.success){
            setAttendanceLive(j.live||[])
            setAttendanceEmployees(j.employees||[])
            setAttendanceStats(j.stats||{on_now:0, today_total:0, present_today:0, absent:0})
          }
        }catch(e){ console.log(e) }
        setAttendanceLoading(false)
      }
      loadAtt()
    }
    if(tab==='payroll'){
      const loadPay = async ()=>{
        setPayrollLoading(true)
        try{
          const res = await fetch(`/api/admin/payroll/list?month=${payrollMonth}&store_id=${me.storeId}`, {cache:'no-store'})
          const j = await res.json()
          if(j.success) setPayrollRows(j.rows||[])
        }catch(e){ console.log(e) }
        setPayrollLoading(false)
      }
      loadPay()
    }
    // === هون بتحطها ===
    if(tab==='employees'){
      supabase.from('employees').select('*').eq('store_id', me.storeId).order('created_at', {ascending:false}).then(({data})=> setEmpList(data||[]))
    }
  }, [tab, payrollMonth, me, supabase])

  const formatLBP = (n) => {
    if(!n && n!==0) return '0 ل.ل'
    const num = parseFloat(String(n).replace(/,/g,'')) || 0
    return new Intl.NumberFormat('en-LB').format(num) + ' ل.ل'
  }
  const inputStyle = {padding:'10px', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(0,0,0,0.3)', color:'white', outline:'none', minWidth:0, fontSize:13}

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
  if(!me) return <div style={{padding:20, background:'radial-gradient(1200px at 20% -10%, #1a0b2e 0%, #0a0a14 45%, #080811 100%)', color:'white', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}>تحميل...</div>

  const preparing = reqOrders.filter(r=> ['Pending','Approved'].includes(String(r['Approval Status'])))
  const lat = store?.['Current Latitude'], lng = store?.['Current Longtitude']
  const commissionText = store?.['Commission Rate']? String(store['Commission Rate']).replace('%%','%') : ''
  const filteredProducts = products.filter(p=>
    (p['Product Name']||'').toLowerCase().includes(search.toLowerCase()) ||
    (p['Product ID']||'').toLowerCase().includes(search.toLowerCase())
  )

  const glassCard = {
    background:'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
    backdropFilter:'blur(20px)',
    border:'1px solid rgba(255,255,255,0.08)',
    boxShadow:'0 10px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
  }

  const displayLink = `${origin || ''}/admin/office-display?store_id=${me?.storeId || ''}`

  return (
    <div style={{minHeight:'100vh', background:'radial-gradient(1200px at 20% -10%, #1a0b2e 0%, #0a0a14 45%, #080811 100%)', color:'white', fontFamily:'Cairo, sans-serif', width:'100%', maxWidth:'100vw', overflowX:'hidden', boxSizing:'border-box'}}>
      <div style={{...glassCard, background:'rgba(10,10,20,0.6)', borderBottom:'1px solid rgba(255,255,255,0.08)', padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10, width:'100%', maxWidth:'100vw', boxSizing:'border-box'}}>
        <div style={{display:'flex', alignItems:'center', gap:10, minWidth:0}}>
          <img src="/icon-dark.png" alt="logo" style={{height:32, borderRadius:8}} />
          <div style={{minWidth:0, overflow:'hidden'}}><div style={{fontWeight:'900', fontSize:15, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color:'white'}}>أهلاً {me.name}</div><div style={{fontSize:11, opacity:0.6, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color:'rgba(255,255,255,0.6)'}}>{store?.['Store Name'] || ''} - {me.storeId}</div></div>
        </div>
        <button onClick={logout} style={{background:'rgba(239,68,68,0.15)', color:'#fca5a5', border:'1px solid rgba(239,68,68,0.3)', padding:'7px 14px', borderRadius:10, fontSize:13, flexShrink:0}}>خروج</button>
      </div>

      <div style={{maxWidth:1150, width:'100%', margin:'0 auto', padding:'0 12px', boxSizing:'border-box', overflowX:'hidden'}}>
        <div onClick={()=>setShowWallet(true)} style={{margin:'12px 0', background:'linear-gradient(135deg,#10b981,#059669)', color:'white', borderRadius:16, padding:14, display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', border:'2px solid rgba(255,255,255,0.2)', width:'100%', boxSizing:'border-box'}}>
          <div style={{minWidth:0}}>
            <div style={{fontSize:11, opacity:0.9}}>👛 محفظتي</div>
            <div style={{fontSize:26, fontWeight:900, marginTop:2}}>{formatLBP(wallet)}</div>
            <div style={{fontSize:11, opacity:0.8, marginTop:2, wordBreak:'break-word'}}>اضغط لعرض التفاصيل - مبلغ + ADD/حسم + نوت</div>
          </div>
          <div style={{fontSize:32, flexShrink:0}}>💳</div>
        </div>

        {/* === بانر الاشتراك - مصلح - بيعرض بدها باقة و انتهى === */}
        {sub && (sub.needSub || sub.expired) && (
          <div style={{
            margin:'0 0 12px 0',
            padding:'10px 12px',
            borderRadius:'12px',
            textAlign:'center',
            fontSize:'12px',
            fontWeight:'800',
            lineHeight:'1.4',
            wordBreak:'break-word',
            whiteSpace:'normal',
            width:'100%',
            boxSizing:'border-box',
            background: sub.needSub? 'linear-gradient(135deg,#fef3c7,#fde68a)' : 'linear-gradient(135deg,#fee2e2,#fecaca)',
            color: sub.needSub? '#92400e' : '#991b1b',
            border: `2px solid ${sub.needSub? '#f59e0b' : '#ef4444'}`
          }}>
            {sub.needSub? (
              <>🔒 هالخدمة بدها باقة اشتراك تتفعل<br/><span style={{fontSize:'11px', fontWeight:'600', opacity:0.9}}>الدوام والرواتب ميزات مدفوعة - فعل الباقة - بصمة الموظفين شغالة بالخلفية</span></>
            ) : (
              <>⛔ انتهى الاشتراك بتاريخ {sub.end}<br/><span style={{fontSize:'11px', fontWeight:'600', opacity:0.9}}>هذه الميزة لا تؤثر على بصمة الموظفين والدوام - البصمة شغالة بالخلفية</span></>
            )}
          </div>
        )}
        {sub?.enabled &&!sub.expired &&!sub.needSub && (
          <div style={{
            margin:'0 0 12px 0',
            padding:'10px 12px',
            borderRadius:'12px',
            textAlign:'center',
            fontSize:'12px',
            fontWeight:'800',
            lineHeight:'1.4',
            wordBreak:'break-word',
            whiteSpace:'normal',
            width:'100%',
            boxSizing:'border-box',
            background: sub.daysLeft<=5? 'linear-gradient(135deg,#fef3c7,#fde68a)' : 'linear-gradient(135deg,#dcfce7,#bbf7d0)',
            color: sub.daysLeft<=5? '#92400e' : '#166534',
            border: `2px solid ${sub.daysLeft<=5? '#f59e0b' : '#22c55e'}`
          }}>
            {sub.daysLeft<=5? (
              <>⚠ لديك {sub.daysLeft} ايام لتجديد الباقة الشهرية<br/><span style={{fontSize:'11px', fontWeight:'600'}}>ينتهي بتاريخ {sub.end} - جدد الآن</span></>
            ) : (
              <>✅ اشتراك مفعل - باقي {sub.daysLeft} يوم<br/><span style={{fontSize:'11px', fontWeight:'600'}}>ينتهي بتاريخ {sub.end}</span></>
            )}
          </div>
        )}

        <div style={{display:'flex', gap:8, padding:'0 0 12px', overflowX:'auto', width:'100%', boxSizing:'border-box', scrollbarWidth:'none'}}>
          {[
            {id:'orders', label:`الطلبات (${preparing.length})`},
            {id:'products', label:`منتجاتي (${filteredProducts.length})`},
            {id:'store', label:'المتجر'},
            {id:'add', label:'إضافة منتجات'},
            {id:'attendance', label:'الدوام'},
            {id:'payroll', label:'الرواتب'},
            {id:'employees', label:`👥 الموظفين (${empList.length})`},
            {id:'display', label:'🖥 شاشة الدوام'},
          ].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'9px 16px', borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', background:tab===t.id?'linear-gradient(135deg,#ec4899,#8b5cf6)':'rgba(255,255,255,0.06)', color:'white', whiteSpace:'nowrap', fontWeight: tab===t.id? '900':'500', flexShrink:0}}>{t.label}</button>
          ))}
        </div>

        <div style={{padding:'0 0 20px', width:'100%', boxSizing:'border-box', overflowX:'hidden'}}>
          {loading? <div style={{textAlign:'center', marginTop:40, color:'rgba(255,255,255,0.6)'}}>تحميل...</div> : (
            <>
              {tab==='store' && store && (
                <div style={{...glassCard, padding:16, borderRadius:16, width:'100%', boxSizing:'border-box', overflowX:'hidden'}}>
                  <div style={{fontWeight:900, fontSize:18, color:'white'}}>{store['Store Name']}</div>
                  <div style={{marginTop:10, fontSize:13, lineHeight:1.8, display:'grid', gap:2, color:'rgba(255,255,255,0.8)', wordBreak:'break-word'}}>
                    <div>المالك: {store['Owner Name']} | الموبايل: {store.Mobile}</div>
                    <div>المنطقة: {store.Area} - {store.Adress}</div>
                    <div>الوصف: {store.Description}</div>
                    <div>دوام: {store['Open Time']} - {store['Close Time']} | توصيل: {store['Delivery Available']}</div>
                    <div>الكمسيون: {commissionText} | الحالة: {store.Status}</div>
                  </div>
                  {lat && lng && (
                    <div style={{marginTop:14, borderRadius:12, overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)', width:'100%'}}>
                      <iframe title="map" width="100%" height="320" style={{border:0}} loading="lazy" src={`https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`} />
                    </div>
                  )}
                </div>
              )}

              {tab==='products' && (
                <>
                  <input placeholder="بحث باسم المنتج أو الباركود..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:'100%', padding:'12px 14px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(0,0,0,0.3)', color:'white', marginBottom:12, fontSize:14, outline:'none', boxSizing:'border-box'}} />
                  <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:12, width:'100%', boxSizing:'border-box'}}>
                    {filteredProducts.map(p=>(
                      <div key={p['Product ID']} style={{...glassCard, borderRadius:14, padding:10, display:'flex', flexDirection:'column', width:'100%', boxSizing:'border-box', overflow:'hidden'}}>
                        <div style={{background:'rgba(255,255,255,0.05)', borderRadius:10, height:110, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden'}}>
                          {p.Image? <img src={p.Image} style={{maxWidth:'100%', maxHeight:'100%', objectFit:'contain'}} /> : <span style={{opacity:0.3, color:'white'}}>لا صورة</span>}
                        </div>
                        <div style={{fontWeight:700, fontSize:12, marginTop:8, lineHeight:1.3, minHeight:32, color:'white', wordBreak:'break-word'}}>{p['Product Name']}</div>
                        <div style={{fontSize:10, opacity:0.5, color:'rgba(255,255,255,0.5)'}}>{p.Unit}</div>
                        <div style={{marginTop:6, display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                          <div style={{fontWeight:900, fontSize:13, color:'white'}}>{Number(p.Price||0).toLocaleString('ar-LB')} ل.ل</div>
                          <button onClick={()=>setShowBarcode(s=>({...s, [p['Product ID']]:!s[p['Product ID']]}))} style={{background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer', fontSize:14, borderRadius:6, padding:'2px 6px', color:'white'}}>👁</button>
                        </div>
                        {showBarcode[p['Product ID']] && (
                          <div style={{marginTop:6, background:'rgba(0,0,0,0.4)', border:'1px dashed rgba(255,255,255,0.2)', padding:6, borderRadius:8, fontSize:10, wordBreak:'break-all', color:'rgba(255,255,255,0.7)'}}>
                            باركود: {p['Product ID']}<br/>Base: {p['Products_Base_ID']||'-'}
                          </div>
                        )}
                        <button onClick={()=>toggleActive(p)} style={{marginTop:8, width:'100%', padding:'7px', borderRadius:8, border:'none', background: p.Active?'linear-gradient(135deg,#16a34a,#15803d)':'rgba(255,255,255,0.15)', color:'white', fontSize:11, fontWeight:700}}>
                          {p.Active? 'Active' : 'INACTIVE'}
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {tab==='orders' && (
                <div style={{display:'grid', gap:10, width:'100%', boxSizing:'border-box'}}>
                  {preparing.length===0? <div style={{...glassCard, padding:20, borderRadius:12, textAlign:'center', color:'rgba(255,255,255,0.6)'}}>ما في طلبات<br/>details: {details.length} - reqOrders: {reqOrders.length} - storeId: {me.storeId}</div> :
                  preparing.map(r=>{
                    const items = details.filter(d=> String(d['Request ID'])===String(r['Request ID']))
                    return (
                      <div key={r['Request ID']} style={{...glassCard, borderRadius:12, padding:12, width:'100%', boxSizing:'border-box', overflowX:'hidden'}}>
                        <div style={{display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:700, color:'white'}}>
                          <span>طلب #{r['Request ID']}</span><span style={{background:'rgba(251,191,36,0.15)', border:'1px solid rgba(251,191,36,0.3)', color:'#fde68a', padding:'2px 8px', borderRadius:6}}>{r['Approval Status']}</span>
                        </div>
                        <div style={{fontSize:11, opacity:0.6, marginTop:4, color:'rgba(255,255,255,0.6)', wordBreak:'break-word'}}>{r['Cerated Date']} - {r['Delivery Adress']}</div>
                        <div style={{marginTop:8, fontSize:12, color:'rgba(255,255,255,0.8)', wordBreak:'break-word'}}>
                        {items.map(it=> {
                         const prod = products.find(p=> String(p['Product ID'])===String(it['Product ID']))
                        return <div key={it['Detail ID']}>• {prod?.['Product Name'] || it['Product ID']} - كمية {it.Qty} بسعر {Number(it['Unit Price']||0).toLocaleString()} ل.ل</div>
                      })}
                     </div>
                    </div>
                    )
                  })}
                </div>
              )}

              {tab==='add' && (
                <div style={{...glassCard, padding:14, borderRadius:16, width:'100%', boxSizing:'border-box', overflowX:'hidden'}}>
                  <div style={{fontWeight:900, marginBottom:12, color:'white'}}>إضافة منتجات - Active FALSE للمراجعة</div>
                  {newProds.map((np,i)=>(
                    <div key={i} style={{display:'grid', gridTemplateColumns:'1fr 80px 110px 1fr', gap:6, marginBottom:8, width:'100%', boxSizing:'border-box'}}>
                      <input placeholder="اسم" value={np.name} onChange={e=>{const c=[...newProds]; c[i].name=e.target.value; setNewProds(c)}} style={{padding:10, borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(0,0,0,0.3)', color:'white', outline:'none', minWidth:0}} />
                      <input placeholder="وحدة" value={np.unit} onChange={e=>{const c=[...newProds]; c[i].unit=e.target.value; setNewProds(c)}} style={{padding:10, borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(0,0,0,0.3)', color:'white', outline:'none', minWidth:0}} />
                      <input placeholder="سعر" value={np.price} onChange={e=>{const c=[...newProds]; c[i].price=e.target.value; setNewProds(c)}} style={{padding:10, borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(0,0,0,0.3)', color:'white', outline:'none', minWidth:0}} />
                      <input placeholder="رابط الصورة" value={np.image} onChange={e=>{const c=[...newProds]; c[i].image=e.target.value; setNewProds(c)}} style={{padding:10, borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(0,0,0,0.3)', color:'white', outline:'none', minWidth:0}} />
                    </div>
                  ))}
                  <div style={{display:'flex', gap:8, marginTop:10, flexWrap:'wrap'}}>
                    <button onClick={()=>setNewProds([...newProds, {name:'', unit:'حبة', price:'', image:''}])} style={{padding:'8px 14px', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.08)', color:'white'}}> + منتج</button>
                    <button onClick={addProducts} style={{padding:'8px 16px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#ec4899,#8b5cf6)', color:'white', fontWeight:900}}>إرسال للمراجعة</button>
                  </div>
                </div>
              )}

              {/* --- تابات جديدة فقط - بدون لمس القديم --- */}
              {tab==='attendance' && (
                <>
                {(sub?.needSub || sub?.expired)? (
                  <div style={{...glassCard, padding:20, borderRadius:16, textAlign:'center'}}>
                    <div style={{fontSize:40}}>{sub?.needSub? '🔒' : '⛔'}</div>
                    <div style={{fontWeight:900, marginTop:8}}>{sub?.needSub? 'هالخدمة بدها باقة اشتراك تتفعل' : 'انتهى اشتراك الدوام'}</div>
                    <div style={{fontSize:12, opacity:0.7, marginTop:6, lineHeight:1.5}}>{sub?.needSub? <>الدوام والرواتب ميزات مدفوعة<br/>فعل الباقة لعرض الدوام<br/>بصمة الموظفين شغالة بالخلفية</> : <>انتهى بتاريخ {sub.end}<br/>بصمة الموظفين والدوام شغالة بالخلفية<br/>فقط عرض الدوام مقفول</>}</div>
                  </div>
                ) : (
                <div style={{display:'grid', gap:12}}>
                  <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px,1fr))', gap:'10px'}}>
                    {[
                      {label:'ON هلق', value: attendanceStats.on_now, color:'#22c55e'},
                      {label:'حضور اليوم', value: attendanceStats.present_today, color:'#3b82f6'},
                      {label:'غايب', value: attendanceStats.absent, color:'#ef4444'},
                      {label:'ساعات اليوم', value: Number(attendanceStats.today_total).toFixed(1), color:'#a78bfa'},
                    ].map((c,i)=>(
                      <div key={i} style={{...glassCard, borderRadius:'14px', padding:'14px'}}>
                        <div style={{fontSize:'11px', color:'rgba(255,255,255,0.6)'}}>{c.label}</div>
                        <div style={{fontSize:'22px', fontWeight:'900', color:c.color, marginTop:'4px'}}>{attendanceLoading?'...':c.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{...glassCard, borderRadius:'16px', padding:'14px'}}>
                    <div style={{fontWeight:'900', marginBottom:'10px'}}>🟢 بالدوام حاليا - {me.storeId} (قراءة فقط)</div>
                    {attendanceLoading? <div style={{color:'rgba(255,255,255,0.5)', textAlign:'center', padding:'20px'}}>تحميل...</div> :
                    attendanceLive.length===0? <div style={{textAlign:'center', padding:'20px', background:'rgba(0,0,0,0.2)', borderRadius:'10px', color:'rgba(255,255,255,0.4)'}}>لا يوجد احد ON في {me.storeId}</div> :
                    attendanceLive.map(row=>(
                      <div key={row.id} style={{display:'flex', justifyContent:'space-between', background:'rgba(0,0,0,0.3)', padding:'10px 12px', borderRadius:'10px', marginBottom:'8px', border:'1px solid rgba(255,255,255,0.06)'}}>
                        <div><div style={{fontWeight:'700', fontSize:'13px'}}>{row.full_name} - {row.department}</div><div style={{fontSize:'11px', opacity:0.5}}>دخل {row.clock_in? new Date(row.clock_in).toLocaleTimeString('ar-LB'):''} - {Number(row.hours_now||0).toFixed(1)}س</div></div>
                        <span style={{fontSize:'11px', background:'rgba(34,197,94,0.15)', color:'#4ade80', padding:'2px 8px', borderRadius:'20px', height:'fit-content'}}>ON</span>
                      </div>
                    ))}
                  </div>
                  <div style={{...glassCard, borderRadius:'16px', padding:'14px'}}>
                    <div style={{fontWeight:'900', marginBottom:'10px'}}>📱 كل موظفي {me.storeId}</div>
                    {attendanceEmployees.map(em=>(
                      <div key={em.id} style={{display:'flex', justifyContent:'space-between', background:'rgba(0,0,0,0.2)', padding:'10px 12px', borderRadius:'10px', marginBottom:'6px'}}>
                        <div style={{fontSize:'13px', fontWeight:'700'}}>{em.full_name}</div>
                        <div style={{fontSize:'11px', color: em.device_fingerprint?'#4ade80':'#ef4444'}}>{em.device_fingerprint?'✅ موثوق':'⏳ غير موثوق'}</div>
                      </div>
                    ))}
                  </div>
                </div>
                )}
                </>
              )}

              {tab==='payroll' && (
                <>
                {(sub?.needSub || sub?.expired)? (
                  <div style={{...glassCard, padding:20, borderRadius:16, textAlign:'center'}}>
                    <div style={{fontSize:40}}>{sub?.needSub? '🔒' : '⛔'}</div>
                    <div style={{fontWeight:900, marginTop:8}}>{sub?.needSub? 'هذه الخدمة يلزم باقة اشتراك لتفعيلها' : 'انتهى اشتراك الرواتب'}</div>
                    <div style={{fontSize:12, opacity:0.7, marginTop:6}}>{sub?.needSub? <>الرواتب ميزة مدفوعة<br/>فعل الباقة</> : <>انتهى بتاريخ {sub.end}<br/>الرواتب مقفولة</>}</div>
                  </div>
                ) : (
                <div style={{...glassCard, borderRadius:'16px', padding:'14px'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px'}}>
                    <div style={{fontWeight:'900'}}>💰 رواتب {store?.['Store Name'] || me.storeId}</div>
                    <input type="month" value={payrollMonth} onChange={e=>setPayrollMonth(e.target.value)} style={{padding:'6px 10px', borderRadius:'8px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', color:'white'}} />
                  </div>
                  {payrollLoading? <div style={{textAlign:'center', color:'rgba(255,255,255,0.5)', padding:'20px'}}>تحميل الرواتب...</div> :
                  payrollRows.length===0? <div style={{textAlign:'center', padding:'20px', color:'rgba(255,255,255,0.4)'}}>لا يوجد رواتب لشهر {payrollMonth} في {me.storeId}</div> :
                  payrollRows.map(r=>{
                    const empName = r.employees?.full_name || r.employee_id
                    const amtStr = Number(r.amount||0).toLocaleString()
                    const storeName = store?.['Store Name'] || me.storeId
                    const waMsg = `مرحبا ${empName} 👋%0Aراتبك لشهر ${r.month_year} جاهز ✅%0Aالمتجر: ${storeName}%0A%0A💰 المبلغ: ${amtStr} ل.ل%0A⏰ مجموع ${r.total_hours||0}س - اضافي ${r.overtime_hours||0}س%0A🔑 كود الاستلام: ${r.secret_code_5}%0A%0Aلا تشارك الرمز الاستلام مع اي شخص .`
                    // 2. هول الجداد اللي سألت عنهن - بتنضف الرقم
const rawMobile = r.employees?.mobile || ''
const cleanMobile = rawMobile.replace(/[^0-9]/g,'')
const waNumber = cleanMobile.startsWith('961') 
  ? cleanMobile 
  : cleanMobile.startsWith('0') 
    ? `961${cleanMobile.slice(1)}` 
    : cleanMobile ? `961${cleanMobile}` : ''
    
const waLink = waNumber 
  ? `https://wa.me/${waNumber}?text=${waMsg}`
  : `https://wa.me/?text=${waMsg}`
                    return (
                    <div key={r.id} style={{display:'flex', justifyContent:'space-between', background:'rgba(0,0,0,0.3)', padding:'12px', borderRadius:'10px', marginBottom:'8px', border:'1px solid rgba(255,255,255,0.06)', gap:'10px'}}>
                      <div style={{flex:1, minWidth:0}}>
                        <div style={{fontWeight:'800', fontSize:'13px'}}>{empName}</div>
                        <div style={{fontSize:'11px', opacity:0.6, marginTop:'2px', lineHeight:'1.5'}}>
                         مجموع {r.total_hours||0}س - اضافي {r.overtime_hours||0}س | {Number(r.base_amount||0).toLocaleString()} + {Number(r.overtime_amount||0).toLocaleString()} = {Number(r.amount||0).toLocaleString()} ل.ل
                         </div>
                        {r.status==='in_wallet' && r.secret_code_5 && (
                          <div style={{marginTop:'8px', display:'flex', gap:'6px', flexWrap:'wrap', alignItems:'center'}}>
                            <div style={{fontSize:'12px', color:'#fde68a', background:'rgba(251,191,36,0.15)', padding:'6px 10px', borderRadius:'8px', fontWeight:900, border:'1px dashed #f59e0b'}}>🔑 الكود: {r.secret_code_5}</div>
                            <button onClick={()=>{navigator.clipboard.writeText(String(r.secret_code_5)); alert('تم نسخ الكود: '+r.secret_code_5)}} style={{padding:'6px 10px', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.08)', color:'white', fontSize:'11px', cursor:'pointer'}}>📋 نسخ</button>
                            <button onClick={()=>window.open(waLink,'_blank')} style={{padding:'6px 12px', borderRadius:'8px', border:'none', background:'#25D366', color:'white', fontSize:'11px', fontWeight:900, cursor:'pointer'}}>واتساب 📱 مشاركة</button>
                          </div>
                        )}
                        {r.status==='pending' && <div style={{fontSize:'10px', opacity:0.4, marginTop:'6px'}}>⏳ بانتظار تحويل الادمن للمحفظة</div>}
                      </div>
                      <div style={{fontSize:'11px', padding:'4px 8px', borderRadius:'20px', height:'fit-content', background: r.status==='pending'?'rgba(251,191,36,0.15)': r.status==='in_wallet'?'rgba(59,130,246,0.15)':'rgba(34,197,94,0.15)', color: r.status==='pending'?'#fde68a': r.status==='in_wallet'?'#60a5fa':'#4ade80', flexShrink:0}}>{r.status}</div>
                    </div>
                  )})}
                </div>
                )}
                </>
              )}
              {tab==='employees' && (
  <div style={{...glassCard, padding:14, borderRadius:16}}>
    {(() => {
      const activeCount = empList.filter(e=>e.is_active).length
      const limit = store?.max_employees || 3
      const isFull = activeCount >= limit
      return (
        <>
          <div style={{display:'flex', justifyContent:'space-between'}}>
            <div style={{fontWeight:900}}>👥 موظفين {store?.['Store Name']} ({activeCount}/{limit}) {activeCount !== empList.length && ` - الكل ${empList.length}`}</div>
            {isFull && <span style={{color:'#fca5a5', fontSize:11}}>⛔ وصلت للحد</span>}
          </div>

          {/* ... الفورم تبعك خليه نفسه ... */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:12}}>
            <input placeholder="اسم الموظف" value={empForm.full_name} onChange={e=>setEmpForm({...empForm, full_name:e.target.value})} style={inputStyle} />
            <input placeholder="موبايل 03/71..." value={empForm.mobile} onChange={e=>setEmpForm({...empForm, mobile:e.target.value})} style={inputStyle} />
            <select value={empForm.department} onChange={e=>setEmpForm({...empForm, department:e.target.value})} style={inputStyle}>
              <option>ادارة</option><option>محاسبة</option><option>مندوب</option><option>تنظيفات</option><option>تاكسي</option><option>اخرى</option><option>موظف</option><option>مسؤول</option><option>سائق</option>
            </select>
            <select value={empForm.salary_type} onChange={e=>setEmpForm({...empForm, salary_type:e.target.value})} style={inputStyle}>
              <option value="monthly">شهري</option><option value="hourly">بالساعة</option>
            </select>
            <input placeholder="راتب اساسي" type="number" value={empForm.base_salary} onChange={e=>setEmpForm({...empForm, base_salary:e.target.value})} style={inputStyle} />
            <input placeholder="ساعات مطلوبة 286" type="number" value={empForm.required_hours} onChange={e=>setEmpForm({...empForm, required_hours:e.target.value})} style={inputStyle} />
          </div>

          <button onClick={async()=>{
            if(!empForm.full_name) return alert('الاسم مطلوب')
            const res = await fetch('/api/admin/employees/create', {method:'POST', body:JSON.stringify({...empForm, store_id: me.storeId})}).then(r=>r.json())
            if(!res.success) return alert(res.message)
            setEmpList([res.employee, ...empList]); setEmpForm({full_name:'', department:'موظف', salary_type:'monthly', base_salary:'', hourly_rate:'', required_hours:286, mobile:''})
          }} style={{marginTop:10, padding:'10px 16px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#ec4899,#8b5cf6)', color:'white', fontWeight:900, width:'100%'}}>
            + اضافة موظف
          </button>

          <div style={{marginTop:14, display:'grid', gap:6}}>
            {empList.map(em=>{
              const isInactive = !em.is_active
              return (
                <div key={em.id} style={{
                  display:'flex', justifyContent:'space-between', 
                  background: isInactive ? 'rgba(100,100,100,0.15)' : 'rgba(0,0,0,0.3)', 
                  padding:10, borderRadius:10, 
                  opacity: isInactive ? 0.5 : 1,
                  border: isInactive ? '1px dashed rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.06)'
                }}>
                  <div>
                    <div style={{fontWeight:700, fontSize:13}}>
                      {em.full_name} - {em.department} {isInactive && <span style={{color:'#fca5a5', fontSize:11}}>(غير مفعل - موقوف)</span>}
                    </div>
                    <div style={{fontSize:11, opacity:0.6}}>{em.mobile || 'لا يوجد موبايل'} | {em.salary_type}</div>
                  </div>
                  {isInactive ? (
                    <button onClick={async()=>{
                      const res = await fetch('/api/admin/employees/toggle', {method:'POST', body:JSON.stringify({employee_id: em.id, store_id: me.storeId, action:'activate'})}).then(r=>r.json())
                      if(!res.success) return alert(res.message)
                      setEmpList(empList.map(x=> x.id===em.id ? {...x, is_active:true} : x))
                    }} style={{background:'rgba(34,197,94,0.2)', border:'none', color:'#4ade80', padding:'4px 10px', borderRadius:6, fontSize:11, fontWeight:900}}>▶️ تفعيل</button>
                  ) : (
                    <button onClick={async()=>{
                      if(!confirm(`ايقاف خدمات ${em.full_name}؟`)) return
                      const res = await fetch('/api/admin/employees/toggle', {method:'POST', body:JSON.stringify({employee_id: em.id, store_id: me.storeId, action:'deactivate'})}).then(r=>r.json())
                      if(!res.success) return alert(res.message)
                      setEmpList(empList.map(x=> x.id===em.id ? {...x, is_active:false} : x))
                    }} style={{background:'rgba(251,191,36,0.15)', border:'none', color:'#fde68a', padding:'4px 10px', borderRadius:6, fontSize:11}}>⏸️ ايقاف</button>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )
    })()}
  </div>
)}

              {tab==='display' && (
                <div style={{...glassCard, borderRadius:'16px', padding:'16px'}}>
                  <div style={{fontWeight:'900', fontSize:'16px'}}>🖥 شاشة الدوام - {me.storeId}</div>
                  <div style={{fontSize:'12px', color:'rgba(255,255,255,0.6)', marginTop:'6px'}}>افتح الرابط على جهاز منفصل بالمكتب - QR بيتجدد كل 5 دقايق - نفس صفحة office-display</div>
                  <div style={{marginTop:'12px', background:'rgba(0,0,0,0.4)', border:'1px dashed rgba(255,255,255,0.2)', padding:'10px', borderRadius:'10px', fontSize:'11px', wordBreak:'break-all', color:'rgba(255,255,255,0.7)'}}>
                    {displayLink}
                  </div>
                  <div style={{display:'flex', gap:'8px', marginTop:'12px', flexWrap:'wrap'}}>
                    <button onClick={()=>{navigator.clipboard.writeText(displayLink); alert('تم نسخ رابط الشاشة')}} style={{padding:'10px 16px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.08)', color:'white', fontWeight:'700', cursor:'pointer'}}>نسخ الرابط 📋</button>
                    <button onClick={()=>window.open(`https://wa.me/?text=${encodeURIComponent('شاشة دوام '+ me.storeId + ' - افتحها على شاشة المكتب: ' + displayLink)}`,'_blank')} style={{padding:'10px 16px', borderRadius:'10px', border:'none', background:'#25D366', color:'white', fontWeight:'900', cursor:'pointer'}}>مشاركة واتساب 📱</button>
                    <button onClick={()=>window.open(displayLink,'_blank')} style={{padding:'10px 16px', borderRadius:'10px', border:'none', background:'linear-gradient(135deg,#ec4899,#8b5cf6)', color:'white', fontWeight:'900', cursor:'pointer'}}>فتح الشاشة 🖥</button>
                  </div>
                  <div style={{marginTop:'14px', background:'white', padding:'12px', borderRadius:'12px', display:'inline-block'}}>
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(displayLink)}`} alt="QR Display" style={{width:'180px', height:'180px', display:'block'}} />
                    <div style={{color:'#111', fontSize:'10px', textAlign:'center', marginTop:'6px', fontWeight:'700'}}>{me.storeId}</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showWallet && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:60, padding:12}}>
          <div style={{background:'white', color:'black', borderRadius:16, width:'100%', maxWidth:400, maxHeight:'80vh', overflow:'hidden', display:'flex', flexDirection:'column'}}>
            <div style={{padding:16, background:'#0a1930', color:'white', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>
                <div style={{fontSize:12, opacity:0.7}}>محفظتي</div>
                <div style={{fontSize:22, fontWeight:900}}>{formatLBP(wallet)}</div>
              </div>
              <button onClick={()=>setShowWallet(false)} style={{background:'rgba(255,255,255,0.2)', border:'none', color:'white', width:32, height:32, borderRadius:8}}>✕</button>
            </div>
            <div style={{flex:1, overflowY:'auto', padding:10}}>
              {walletTx.length===0 && <div style={{textAlign:'center', padding:20, color:'#999'}}>لا يوجد حركات</div>}
              {walletTx.map((t,i)=>{
  const amt = Number(t.Amount||0)
  const type = String(t.Type||"").toUpperCase()
  const isDeduct = type==="DEDUCT" || type==="CASH_OUT" || type==="COMMISSION"
  return (
    <div key={i} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 10px', borderBottom:'1px solid #eee'}}>
      <div style={{flex:1}}>
        <div style={{display:'flex', gap:6, alignItems:'center'}}>
          <span style={{background: isDeduct? "#fee2e2" : "#dcfce7", color: isDeduct? "#ef4444" : "#16a34a", padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:900}}>{isDeduct? "🔴 حسم" : "🟢 ADD"}</span>
          <span style={{fontWeight:900, fontSize:14, color: isDeduct? "#ef4444" : "#16a34a"}}>{isDeduct? "-" : "+"}{formatLBP(amt)}</span>
        </div>
        <div style={{fontSize:12, marginTop:4, color:'#333'}}>{t.Notes || t.Reason || "-"}</div>
        <div style={{fontSize:10, opacity:0.5, marginTop:2}}>{t.Date? new Date(t.Date).toLocaleString('ar-LB') : (t["Created At"]? new Date(t["Created At"]).toLocaleString('ar-LB') : "")}</div>
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
