"use client"
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react"

export default function OfficeDisplayPage(){
  const [qrToken, setQrToken] = useState("")
  const [countdown, setCountdown] = useState(300) // 5 دقايق
  const [unbound, setUnbound] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)

  // توليد توكن كل 5 دقايق
  const generateQR = async ()=>{
    try{
      const res = await fetch('/api/office-qr/generate')
      const j = await res.json()
      if(j.success && j.token){
        setQrToken(j.token)
      }else{
        // fallback لو ما عندك API بعد
        setQrToken(`OFFICE-${Date.now()}-${Math.random().toString(36).slice(2)}`)
      }
      setCountdown(300)
    }catch(e){
      setQrToken(`OFFICE-${Date.now()}-${Math.random().toString(36).slice(2)}`)
      setCountdown(300)
    }
  }

  const loadUnbound = async ()=>{
    try{
      const res = await fetch('/api/admin/attendance/today')
      const j = await res.json()
      if(j.success){
        const filtered = (j.employees || []).filter(em => !em.device_fingerprint)
        setUnbound(filtered)
      }
    }catch(e){ console.log(e) }
    setLoading(false)
  }

  useEffect(()=>{
    generateQR()
    loadUnbound()
    const interval = setInterval(generateQR, 5*60*1000) // كل 5 دقايق
    return ()=> clearInterval(interval)
  }, [])

  useEffect(()=>{
    const t = setInterval(()=> setCountdown(c => c>0 ? c-1 : 0), 1000)
    return ()=> clearInterval(t)
  }, [])

  // اخذ بصمة الجهاز
  const getFingerprint = ()=>{
    let deviceId = localStorage.getItem('office_device_id')
    if(!deviceId){
      deviceId = `dev-${Date.now()}-${Math.random().toString(36).slice(2,10)}`
      localStorage.setItem('office_device_id', deviceId)
    }
    const raw = `${deviceId}||${navigator.userAgent}||${screen.width}x${screen.height}||${navigator.language}`
    return { fingerprint: deviceId + "-" + btoa(raw).slice(0,20), deviceType: navigator.userAgent.slice(0,120) }
  }

  const bindDevice = async (emp)=>{
    if(!qrToken) return alert("الـ QR بعده ما جهز")
    setSelectedId(emp.id)
    const { fingerprint, deviceType } = getFingerprint()
    try{
      const res = await fetch('/api/attendance/clock',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          employee_id: emp.id,
          device_fingerprint: fingerprint,
          device_type: deviceType,
          qr_token: qrToken
        })
      })
      const j = await res.json()
      if(j.success){
        // شيلو من الليستة
        setUnbound(prev => prev.filter(x => x.id !== emp.id))
        setSelectedId(null)
        alert(`تم ربط ${emp.full_name} بنجاح ✅`)
      }else{
        alert(j.message || "فشل الربط")
        setSelectedId(null)
      }
    }catch(e){
      alert("خطأ بالشبكة")
      setSelectedId(null)
    }
  }

  const minutes = Math.floor(countdown/60)
  const seconds = countdown%60

  return (
    <div style={{
      minHeight:'100vh',
      background:'radial-gradient(1200px at 20% -10%, #1a0b2e 0%, #0a0a14 45%, #080811 100%)',
      fontFamily:'Cairo, sans-serif',
      padding:'24px',
      color:'white',
      display:'flex',
      flexDirection:'column',
      alignItems:'center'
    }}>
      <h1 style={{fontSize:'28px', fontWeight:'800', marginBottom:'8px'}}>شاشة المكتب - تسجيل أول مرة</h1>
      <div style={{width:'60px', height:'3px', background:'linear-gradient(90deg, #ec4899, #8b5cf6)', borderRadius:'10px', marginBottom:'20px'}}></div>

      {/* QR BOX */}
      <div style={{
        background:'white', padding:'20px', borderRadius:'24px',
        boxShadow:'0 25px 60px rgba(0,0,0,0.5)', marginBottom:'16px', textAlign:'center'
      }}>
        {qrToken ? (
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrToken)}`} 
            alt="QR" 
            style={{width:'300px', height:'300px'}}
          />
        ) : <div style={{width:'300px', height:'300px', background:'#eee'}}></div>}
        <div style={{color:'#111', marginTop:'10px', fontWeight:'bold', fontSize:'14px'}}>
          صالح لـ {minutes}:{seconds.toString().padStart(2,'0')} - بيتغير كل 5 دقايق
        </div>
        <div style={{color:'#666', fontSize:'11px', marginTop:'4px', wordBreak:'break-all', maxWidth:'300px'}}>{qrToken.slice(0,40)}...</div>
      </div>

      <button onClick={generateQR} style={{
        background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)',
        color:'white', padding:'8px 16px', borderRadius:'10px', cursor:'pointer', marginBottom:'30px'
      }}>تحديث الـ QR يدوي 🔄</button>

      {/* الاسامي يلي ما تربطت */}
      <div style={{
        width:'100%', maxWidth:'700px',
        background:'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
        backdropFilter:'blur(20px)', borderRadius:'24px', padding:'24px',
        border:'1px solid rgba(255,255,255,0.08)'
      }}>
        <h3 style={{marginBottom:'16px', fontSize:'18px', fontWeight:'700'}}>👥 يلي ما ربط تلفونو بعد ({unbound.length}) - كبوس ع اسمك وسجل</h3>
        {loading ? <div style={{textAlign:'center', color:'rgba(255,255,255,0.5)'}}>جاري التحميل...</div> :
          unbound.length===0 ? <div style={{textAlign:'center', padding:'20px', background:'rgba(34,197,94,0.1)', borderRadius:'12px', color:'#4ade80'}}>الكل رابط ✅ ما في حدا ناقص</div> :
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:'10px'}}>
            {unbound.map(em=>(
              <button
                key={em.id}
                onClick={()=>bindDevice(em)}
                disabled={selectedId===em.id}
                style={{
                  background: selectedId===em.id ? 'linear-gradient(135deg, #ec4899, #8b5cf6)' : 'rgba(0,0,0,0.3)',
                  border:'1px solid rgba(255,255,255,0.08)',
                  padding:'14px', borderRadius:'12px', color:'white', cursor:'pointer',
                  fontWeight:'700', fontSize:'14px', textAlign:'center'
                }}
              >
                {selectedId===em.id ? 'عم يربط...' : em.full_name}
                <div style={{fontSize:'11px', color:'rgba(255,255,255,0.5)', marginTop:'4px'}}>{em.department}</div>
              </button>
            ))}
          </div>
        }
      </div>
    </div>
  )
}
