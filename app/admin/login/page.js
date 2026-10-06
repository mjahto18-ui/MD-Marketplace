"use client"
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function AdminLogin(){
  const [phone,setPhone]=useState("")
  const [pin,setPin]=useState("")
  const [err,setErr]=useState("")
  const [loading,setLoading]=useState(false)
  const router = useRouter()

  const [showCodeBox,setShowCodeBox]=useState(false)
  const [inviteCode,setInviteCode]=useState("")
  const [codeErr,setCodeErr]=useState("")
  const [codeLoading,setCodeLoading]=useState(false)

  const [showRegister,setShowRegister]=useState(false)
  const [verifiedCode,setVerifiedCode]=useState("")
  const [areas,setAreas]=useState([])
  const [categories,setCategories]=useState([])
  const [regForm,setRegForm]=useState({
    role:"store",
    name:"", phone:"", area:"", 
    vehicleTyp:"Moto", vehicle_type:"car", engine_cc:"", car_color:"", plate_number:"", car_type:"", seats:"4", gender:"male",
    storeName:"", storeAddress:"", openTime:"", closeTime:"", address:"",
    category:"", description:""
  })
  const [regErr,setRegErr]=useState("")
  const [regLoading,setRegLoading]=useState(false)

  const login = async ()=>{
    const p = phone.trim()
    const b = pin.trim()

    if(!p && !b){
      setErr("الرجاء تعبئة رقم الهاتف ورمز المرور")
      return
    }
    if(!p){
      setErr("الرجاء إدخال رقم الهاتف")
      return
    }
    if(!b){
      setErr("الرجاء إدخال رمز المرور")
      return
    }
    if(!/^\d{8}$/.test(p)){
      setErr("رقم الهاتف يجب أن يتكون من 8 أرقام ")
      return
    }
    if(!/^\d{4}$/.test(b)){
      setErr("رمز المرور يجب أن يتكون 4 أرقام ")
      return
    }

    setErr(""); setLoading(true)
    try{
      const res = await fetch('/api/admin/login',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({phone:p,pin:b})})
      const j = await res.json()
      if(j.success){ 

        // ✅ رجعنا OneSignal هون - نفس تبع الكوستمر
        try{
          if(typeof window !== "undefined" && window.OneSignal){
            await window.OneSignal.login(p);

            // Tag للمتجر والرول
            const storeId = j.store_id || j.storeId || j.user?.store_id || j.user?.storeId || "admin";
            await window.OneSignal.User.addTag("store_id", storeId);
            await window.OneSignal.User.addTag("role", j.role || "admin");
            await window.OneSignal.User.addTag("userId", j.userId || p);

            let subId = null;
            for(let i=0;i<10;i++){
              try{ subId = await window.OneSignal.User.PushSubscription.id; }catch{}
              if(subId) break;
              await new Promise(r=>setTimeout(r,500));
            }

            if(subId){
              const userIdForSub = j.userId || j.user?.userId || j.userID || p;
              await fetch("/api/save-subscription",{
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify({ 
                  userId: userIdForSub, 
                  subscriptionId: subId,
                  store_id: storeId,
                  role: j.role
                })
              });
            }
          }
        }catch(e){ console.log("OneSignal admin error", e) }
        // ✅ نهاية OneSignal

        if(j.redirectTo) router.push(j.redirectTo)
        else {
          if(j.role === 'Store Owner') router.push('/store-owner')
          else if(j.role === 'Driver') router.push('/driver-owner')
          else if(j.role === 'Taxi Driver') router.push('/taxi-driver')
          else router.push('/admin')
        }
      } else setErr(j.message || "فشل الدخول")
    }catch(e){ setErr("خطأ اتصال") }
    setLoading(false)
  }

  const openCodeBox = async ()=>{
    setInviteCode(""); setCodeErr(""); setShowCodeBox(true)
    try{
      const a = await fetch("/api/areas").then(r=>r.json())
      setAreas(a.areas || a || [])
      const c = await fetch("/api/categories").then(r=>r.json()).catch(()=>({}))
      setCategories(c.categories || c || [])
    }catch{}
  }

  const checkCode = async ()=>{
    setCodeErr(""); setCodeLoading(true)
    try{
      const res = await fetch('/api/admin/verify-invite-code',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({code: inviteCode})
      })
      const j = await res.json()
      if(j.valid){
        setVerifiedCode(inviteCode.trim())
        setShowCodeBox(false)
        setShowRegister(true)
      } else {
        setCodeErr(j.error || "كود غير صحيح")
      }
    }catch(e){ setCodeErr("خطأ اتصال") }
    setCodeLoading(false)
  }

  const resetForm = ()=>{
    setRegForm({
      role:"store",
      name:"", phone:"", area:"", 
      vehicleTyp:"Moto", vehicle_type:"car", engine_cc:"", car_color:"", plate_number:"", car_type:"", seats:"4", gender:"male",
      storeName:"", storeAddress:"", openTime:"", closeTime:"", address:"",
      category:"", description:""
    })
  }

  const handleRegister = async (e)=>{
    e.preventDefault()
    setRegErr(""); setRegLoading(true)
    if(!navigator.geolocation){
      setRegErr("المتصفح لا يدعم اللوكيشن"); setRegLoading(false); return
    }
    navigator.geolocation.getCurrentPosition(async (pos)=>{
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      try{
        const res = await fetch('/api/admin/register-with-invite',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({
            code: verifiedCode,
            role: regForm.role,
            name: regForm.name,
            phone: regForm.phone,
            area: regForm.area,
            lat, lng,
            vehicleTyp: regForm.vehicleTyp,
            vehicle_type: regForm.vehicle_type,
            engine_cc: regForm.engine_cc,
            car_color: regForm.car_color,
            plate_number: regForm.plate_number,
            car_type: regForm.car_type,
            address: regForm.address,
            seats: regForm.seats,
            gender: regForm.gender,
            storeName: regForm.storeName,
            storeAddress: regForm.storeAddress,
            openTime: regForm.openTime,
            closeTime: regForm.closeTime,
            category: regForm.category,
            description: regForm.description,
          })
        })
        const j = await res.json()
        if(!res.ok) throw new Error(j.error || "فشل التسجيل")
        alert(j.message || "تم التسجيل وحظر الرمز السري")
        resetForm()
        setShowRegister(false)
        setVerifiedCode("")
        setInviteCode("")
      }catch(err){
        setRegErr(err.message)
      }
      setRegLoading(false)
    }, ()=>{
      setRegErr("يرجى تفعيل اللوكيشن - لتكملة التسجيل ")
      setRegLoading(false)
    })
  }

  if(showRegister){
    return (
      <div style={{minHeight:'100vh', background:'radial-gradient(1200px at 20% -10%, #1a0b2e 0%, #0a0a14 45%, #080811 100%)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Cairo, sans-serif', padding:'20px'}}>
        <div style={{background:'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))', backdropFilter:'blur(20px)', padding:'28px', borderRadius:'24px', width:'500px', maxHeight:'90vh', overflowY:'auto', border:'1px solid rgba(255,255,255,0.08)'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px'}}>
            <h2 style={{color:'white', fontWeight:'bold'}}>نموذج التسجيل - الرمز: {verifiedCode}</h2>
            <button onClick={()=>{resetForm(); setShowRegister(false); setVerifiedCode("")}} style={{background:'rgba(255,255,255,0.1)', color:'white', border:'none', padding:'6px 12px', borderRadius:'8px', cursor:'pointer'}}> إلغاء التسجيل</button>
          </div>

          <div style={{display:'flex', gap:'8px', marginBottom:'12px'}}>
            <button type="button" onClick={()=>setRegForm({...regForm, role:'store'})} style={{flex:1, padding:'10px', borderRadius:'10px', border:'none', fontWeight:'bold', cursor:'pointer', background: regForm.role==='store'?'#ec4899':'rgba(255,255,255,0.1)', color:'white'}}>متجر</button>
            <button type="button" onClick={()=>setRegForm({...regForm, role:'driver'})} style={{flex:1, padding:'10px', borderRadius:'10px', border:'none', fontWeight:'bold', cursor:'pointer', background: regForm.role==='driver'?'#8b5cf6':'rgba(255,255,255,0.1)', color:'white'}}>سائق</button>
            <button type="button" onClick={()=>setRegForm({...regForm, role:'taxi_driver'})} style={{flex:1, padding:'10px', borderRadius:'10px', border:'none', fontWeight:'bold', cursor:'pointer', background: regForm.role==='taxi_driver'?'#3b82f6':'rgba(255,255,255,0.1)', color:'white'}}>تاكسي</button>
          </div>

          <form onSubmit={handleRegister} style={{display:'flex', flexDirection:'column', gap:'10px'}}>
            <input value={regForm.name} onChange={e=>setRegForm({...regForm, name:e.target.value})} placeholder={regForm.role==='store'?'اسم صاحب المتجر*':'الاسم الكامل*'} style={{padding:'12px', borderRadius:'10px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', color:'white'}} required />
            <input value={regForm.phone} onChange={e=>setRegForm({...regForm, phone:e.target.value})} placeholder="رقم الهاتف*" style={{padding:'12px', borderRadius:'10px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', color:'white'}} required />

            {regForm.role==='driver' && (
              <>
                <select value={regForm.area} onChange={e=>setRegForm({...regForm, area:e.target.value})} style={{padding:'12px', borderRadius:'10px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', color:'white'}} required>
                  <option value="">اختر المنطقة من areas*</option>
                  {areas.map(a=><option key={a.id || a['Area ID']} value={a.id || a['Area ID']} style={{color:'black'}}>{a.name || a.area_name || a['Area Name'] || a.id || a['Area ID']}</option>)}
                </select>
                <select value={regForm.vehicleTyp} onChange={e=>setRegForm({...regForm, vehicleTyp:e.target.value})} style={{padding:'12px', borderRadius:'10px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', color:'white'}}>
                  <option value="Moto">Moto</option><option value="Car">Car</option><option value="Van">Van</option>
                </select>
              </>
            )}

            {regForm.role==='taxi_driver' && (
              <>
                <input value={regForm.area} onChange={e=>setRegForm({...regForm, area:e.target.value})} placeholder="المنطقة " style={{padding:'12px', borderRadius:'10px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', color:'white'}} />
                <div style={{display:'flex', gap:'8px'}}>
                  <select value={regForm.vehicle_type} onChange={e=>{
                    const vt = e.target.value
                    if(vt==='toktok'){
                      setRegForm({...regForm, vehicle_type: vt, engine_cc: '200'})
                    }else{
                      setRegForm({...regForm, vehicle_type: vt})
                    }
                  }} style={{flex:1, padding:'12px', borderRadius:'10px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', color:'white'}}>
                    <option value="car">car</option><option value="van">van</option><option value="toktok">toktok - 200cc</option><option value="moto">moto</option><option value="touristic_van">touristic_van</option><option value="touristic_van_11">touristic_van_11</option>
                  </select>
                  <select value={regForm.engine_cc} onChange={e=>setRegForm({...regForm, engine_cc:e.target.value})} style={{flex:1, padding:'12px', borderRadius:'10px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', color:'white'}} required>
                    <option value="">قوة المحرك*</option>
                    <option value="1200">1200</option>
                    <option value="1500">1500</option>
                    <option value="2000">2000</option>
                    <option value="2500">2500</option>
                    <option value="150">150</option>
                    <option value="200">200 - تكتك</option>
                  </select>
                </div>
                <div style={{display:'flex', gap:'8px'}}>
                  <input value={regForm.car_color} onChange={e=>setRegForm({...regForm, car_color:e.target.value})} placeholder="لون السيارة*" style={{flex:1, padding:'12px', borderRadius:'10px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', color:'white'}} required />
                  <input value={regForm.plate_number} onChange={e=>setRegForm({...regForm, plate_number:e.target.value})} placeholder="رقم اللوحة" style={{flex:1, padding:'12px', borderRadius:'10px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', color:'white'}} />
                </div>
                <input value={regForm.car_type} onChange={e=>setRegForm({...regForm, car_type:e.target.value})} placeholder="اسم السيارة - car_type" style={{padding:'12px', borderRadius:'10px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', color:'white'}} />
                <input value={regForm.address} onChange={e=>setRegForm({...regForm, address:e.target.value})} placeholder="العنوان - address" style={{padding:'12px', borderRadius:'10px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', color:'white'}} />
              </>
            )}

            {regForm.role==='store' && (
              <>
                <input value={regForm.storeName} onChange={e=>setRegForm({...regForm, storeName:e.target.value})} placeholder="اسم المتجر*" style={{padding:'12px', borderRadius:'10px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', color:'white'}} required />
                <select value={regForm.area} onChange={e=>setRegForm({...regForm, area:e.target.value})} style={{padding:'12px', borderRadius:'10px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', color:'white'}} required>
                  <option value="">اختر المنطقة من areas*</option>
                  {areas.map(a=><option key={a.id || a['Area ID']} value={a.id || a['Area ID']} style={{color:'black'}}>{a.name || a.area_name || a['Area Name'] || a.id || a['Area ID']}</option>)}
                </select>
                <select value={regForm.category} onChange={e=>setRegForm({...regForm, category:e.target.value})} style={{padding:'12px', borderRadius:'10px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', color:'white'}}>
                  <option value="">اختر Category من categories</option>
                  {categories.map(c=><option key={c.id || c['Category ID']} value={c.id || c['Category ID']} style={{color:'black'}}>{c.name || c['Category Name'] || c.id}</option>)}
                </select>
                <input value={regForm.storeAddress} onChange={e=>setRegForm({...regForm, storeAddress:e.target.value})} placeholder="عنوان المتجر - Adress" style={{padding:'12px', borderRadius:'10px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', color:'white'}} />
                <textarea value={regForm.description} onChange={e=>setRegForm({...regForm, description:e.target.value})} placeholder="Description* - وصف المتجر" style={{padding:'12px', borderRadius:'10px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', color:'white', minHeight:'60px'}} required />
                <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
                  <label style={{color:'rgba(255,255,255,0.6)', fontSize:'11px'}}>Open Time / Close Time - وين انحط بالستور</label>
                  <div style={{display:'flex', gap:'8px'}}>
                    <div style={{flex:1}}>
                      <label style={{color:'white', fontSize:'10px'}}>Open Time</label>
                      <input type="time" value={regForm.openTime} onChange={e=>setRegForm({...regForm, openTime:e.target.value})} style={{width:'100%', padding:'12px', borderRadius:'10px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', color:'white'}} />
                    </div>
                    <div style={{flex:1}}>
                      <label style={{color:'white', fontSize:'10px'}}>Close Time</label>
                      <input type="time" value={regForm.closeTime} onChange={e=>setRegForm({...regForm, closeTime:e.target.value})} style={{width:'100%', padding:'12px', borderRadius:'10px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', color:'white'}} />
                    </div>
                  </div>
                </div>
                <div style={{color:'rgba(255,255,255,0.5)', fontSize:'10px'}}>Join Date dd/mm/yyyy now - automatic</div>
              </>
            )}

            {regErr && <div style={{background:'rgba(239,68,68,0.15)', color:'#fca5a5', padding:'8px', borderRadius:'8px', fontSize:'12px'}}>{regErr}</div>}
            <div style={{display:'flex', gap:'10px', marginTop:'6px'}}>
              <button type="button" onClick={()=>{resetForm(); setShowRegister(false); setVerifiedCode("")}} style={{flex:1, background:'rgba(255,255,255,0.1)', color:'white', padding:'12px', borderRadius:'10px', border:'none', cursor:'pointer'}}>إلغاء التسجيل</button>
              <button type="submit" disabled={regLoading} style={{flex:1, background:'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', color:'white', padding:'12px', borderRadius:'10px', fontWeight:'bold', border:'none', cursor:'pointer', opacity: regLoading?0.6:1}}>{regLoading?'جاري...':'تسجيل'}</button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div style={{minHeight:'100vh', background:'radial-gradient(1200px at 20% -10%, #1a0b2e 0%, #0a0a14 45%, #080811 100%)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Cairo, sans-serif', padding:'20px'}}>
      <div style={{background:'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))', backdropFilter:'blur(20px)', padding:'36px 32px', borderRadius:'24px', width:'400px', border:'1px solid rgba(255,255,255,0.08)', boxShadow:'0 25px 60px rgba(0,0,0,0.6)'}}>
        <div style={{display:'flex', justifyContent:'center', marginBottom:'28px'}}>
          <div style={{width:'140px', height:'140px', borderRadius:'28px', overflow:'hidden', boxShadow:'0 0 40px rgba(236,72,153,0.3)', border:'1px solid rgba(255,255,255,0.1)'}}>
            <Image src="/icon-dark.png" alt="MD" width={140} height={140} style={{objectFit:'cover'}} />
          </div>
        </div>
        <div style={{textAlign:'center', marginBottom:'28px'}}>
          <h2 style={{color:'rgba(255,255,255,0.9)', fontSize:'15px', fontWeight:'600'}}>للأعمال الإدارية فقط</h2>
          <div style={{width:'40px', height:'3px', background:'linear-gradient(90deg, #ec4899, #8b5cf6)', margin:'10px auto 0', borderRadius:'10px'}}></div>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:'14px'}}>
          <input value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,'').slice(0,8))} maxLength={8} inputMode="numeric" placeholder="رقم الهاتف" style={{width:'100%', padding:'14px 16px', borderRadius:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', color:'white'}} />
          <input value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,'').slice(0,4))} maxLength={4} inputMode="numeric" type="password" placeholder="رمز المرور" style={{width:'100%', padding:'14px 16px', borderRadius:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', color:'white'}} />
        </div>
        {err && <div style={{background:'rgba(239,68,68,0.1)', color:'#fca5a5', padding:'12px', borderRadius:'10px', fontSize:'13px', marginTop:'14px', textAlign:'center'}}>{err}</div>}
        <button onClick={login} disabled={loading || phone.length!==8 || pin.length!==4} style={{width:'100%', background: (phone.length===8 && pin.length===4) ? 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)' : 'rgba(255,255,255,0.15)', color:'white', padding:'14px', borderRadius:'12px', fontWeight:'bold', border:'none', marginTop:'20px', cursor: (phone.length===8 && pin.length===4) ? 'pointer' : 'not-allowed', opacity: loading?0.6:1}}>{loading?'جاري الدخول...':'دخول'}</button>

        <div style={{textAlign:'center', marginTop:'22px'}}>
          <span onClick={openCodeBox} style={{color:'white', fontWeight:'800', fontSize:'17px', cursor:'pointer', textDecoration:'underline'}}>سجل الآن</span>
        </div>

        {showCodeBox && (
          <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:'20px'}}>
            <div style={{background:'linear-gradient(180deg, rgba(30,20,50,0.95), rgba(10,10,20,0.95))', padding:'24px', borderRadius:'16px', width:'360px', border:'1px solid rgba(255,255,255,0.15)'}}>
              <h3 style={{color:'white', fontWeight:'bold', fontSize:'16px', marginBottom:'14px', textAlign:'center'}}>يرجى إدخال الرمز السري</h3>
              <input value={inviteCode} onChange={e=>setInviteCode(e.target.value)} placeholder="123456" style={{width:'100%', padding:'12px', borderRadius:'10px', background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.15)', color:'white', textAlign:'center', fontSize:'18px', letterSpacing:'4px'}} />
              {codeErr && <div style={{background:'rgba(239,68,68,0.15)', color:'#fca5a5', padding:'8px', borderRadius:'8px', fontSize:'12px', marginTop:'10px', textAlign:'center'}}>{codeErr}</div>}
              <div style={{display:'flex', gap:'10px', marginTop:'16px'}}>
                <button onClick={()=>setShowCodeBox(false)} style={{flex:1, background:'rgba(255,255,255,0.1)', color:'white', padding:'10px', borderRadius:'10px', border:'none', cursor:'pointer'}}>إلغاء التسجيل</button>
                <button onClick={checkCode} disabled={codeLoading} style={{flex:1, background:'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', color:'white', padding:'10px', borderRadius:'10px', border:'none', fontWeight:'bold', cursor:'pointer', opacity: codeLoading?0.6:1}}>{codeLoading?'جاري...':'موافق'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
