"use client"
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react"

export default function OfficeDisplayPage(){
  const [qrToken, setQrToken] = useState("")
  const [baseToken, setBaseToken] = useState("")
  const [countdown, setCountdown] = useState(300)
  const [unbound, setUnbound] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEmp, setSelectedEmp] = useState(null)

  const generateQR = async (empId = null)=>{
    try{
      const res = await fetch('/api/office-qr/generate')
      const j = await res.json()
      const bToken = j.success && j.token ? j.token : `OFFICE-${Date.now()}-${Math.random().toString(36).slice(2)}`
      setBaseToken(bToken)
      const finalToken = empId ? `${bToken}::${empId}` : bToken
      setQrToken(finalToken)
      setCountdown(300)
    }catch(e){
      const bToken = `OFFICE-${Date.now()}-${Math.random().toString(36).slice(2)}`
      setBaseToken(bToken)
      setQrToken(empId ? `${bToken}::${empId}` : bToken)
      setCountdown(300)
    }
  }

  const loadUnbound = async ()=>{
    try{
      const res = await fetch('/api/admin/attendance/today')
      const j = await res.json()
      if(j.success){
        setUnbound((j.employees || []).filter(em => !em.device_fingerprint))
      }
    }catch(e){ console.log(e) }
    setLoading(false)
  }

  useEffect(()=>{
    generateQR()
    loadUnbound()
    const interval = setInterval(()=>generateQR(selectedEmp?.id), 5*60*1000)
    const poll = setInterval(loadUnbound, 5000)
    return ()=> { clearInterval(interval); clearInterval(poll); }
  }, [])

  useEffect(()=>{
    const t = setInterval(()=> setCountdown(c => c>0 ? c-1 : 0), 1000)
    return ()=> clearInterval(t)
  }, [])

  const handleSelect = (emp)=>{
    if(selectedEmp?.id === emp.id){
      setSelectedEmp(null)
      generateQR(null)
    } else {
      setSelectedEmp(emp)
      generateQR(emp.id)
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
          {selectedEmp ? `جاهز لـ ${selectedEmp.full_name} - صوّر من تلفونك` : 'اختار اسمك من تحت'}
        </div>
        <div style={{color:'#111', fontSize:'13px', marginTop:'4px'}}>صالح لـ {minutes}:{seconds.toString().padStart(2,'0')}</div>
        <div style={{color:'#666', fontSize:'10px', marginTop:'4px', wordBreak:'break-all', maxWidth:'300px'}}>{baseToken.slice(0,30)}...</div>
      </div>

      <button onClick={()=>generateQR(selectedEmp?.id)} style={{
        background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)',
        color:'white', padding:'8px 16px', borderRadius:'10px', cursor:'pointer', marginBottom:'20px'
      }}>تحديث الـ QR يدوي 🔄</button>

      {selectedEmp && (
        <div style={{
          width:'100%', maxWidth:'700px',
          background:'rgba(34,197,94,0.15)', border:'1px solid rgba(34,197,94,0.3)',
          borderRadius:'12px', padding:'12px', marginBottom:'20px',
          textAlign:'center', color:'#4ade80', fontSize:'14px', fontWeight:'700'
        }}>
          ✅ يا {selectedEmp.full_name} افتح هلق بتلفونك صفحة /attendance وصوّر الـ QR يلي فوق - رح تنربط بصمة تلفونك لحالا
        </div>
      )}

      <div style={{
        width:'100%', maxWidth:'700px',
        background:'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
        backdropFilter:'blur(20px)', borderRadius:'24px', padding:'24px',
        border:'1px solid rgba(255,255,255,0.08)'
      }}>
        <h3 style={{marginBottom:'16px', fontSize:'18px', fontWeight:'700'}}>👥 يلي ما ربط تلفونو بعد ({unbound.length})</h3>
        {loading ? <div style={{textAlign:'center', color:'rgba(255,255,255,0.5)'}}>جاري التحميل...</div> :
          unbound.length===0 ? <div style={{textAlign:'center', padding:'20px', background:'rgba(34,197,94,0.1)', borderRadius:'12px', color:'#4ade80'}}>الكل رابط ✅</div> :
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:'10px'}}>
            {unbound.map(em=>(
              <button
                key={em.id}
                onClick={()=>handleSelect(em)}
                style={{
                  background: selectedEmp?.id===em.id ? 'linear-gradient(135deg, #ec4899, #8b5cf6)' : 'rgba(0,0,0,0.3)',
                  border: selectedEmp?.id===em.id ? '1px solid #ec4899' : '1px solid rgba(255,255,255,0.08)',
                  padding:'14px', borderRadius:'12px', color:'white', cursor:'pointer',
                  fontWeight:'700', fontSize:'14px', textAlign:'center'
                }}
              >
                {em.full_name}
                <div style={{fontSize:'11px', color:'rgba(255,255,255,0.5)', marginTop:'4px'}}>{em.department}</div>
              </button>
            ))}
          </div>
        }
      </div>
    </div>
  )
}
