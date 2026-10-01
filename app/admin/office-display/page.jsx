"use client"
import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import BackToDashboard from "@/components/BackToDashboard"

export default function OfficeDisplayPage(){
  const searchParams = useSearchParams()
  const storeId = searchParams.get('store_id') // مجبور

  const [qrLink, setQrLink] = useState("")
  const [baseToken, setBaseToken] = useState("")
  const [countdown, setCountdown] = useState(300)
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEmp, setSelectedEmp] = useState(null)
  const [origin, setOrigin] = useState("")
  const selectedRef = useRef(null)

  useEffect(()=>{ setOrigin(window.location.origin) }, [])
  useEffect(()=>{ selectedRef.current = selectedEmp }, [selectedEmp])

  const generateQR = async (empId = null)=>{
    if(!storeId) return
    const targetId = empId?? selectedRef.current?.id?? null
    try{
      // هون صار يطلب store_id إجباري
      const res = await fetch(`/api/office-qr/generate?store_id=${storeId}`)
      const j = await res.json()
      if(!j.success) throw new Error(j.message)
      const bToken = j.token
      setBaseToken(bToken)
      // الجديد: token::store_id::employee_id
      const finalToken = targetId? `${bToken}::${storeId}::${targetId}` : `${bToken}::${storeId}`
      const link = `${origin || window.location.origin}/attendance?qr=${finalToken}`
      setQrLink(link)
      setCountdown(300)
    }catch(e){
      console.log(e)
    }
  }

  const loadEmployees = async ()=>{
    if(!storeId){ setLoading(false); return }
    try{
      // هون صار يفلتر حسب المتجر
      const res = await fetch(`/api/admin/attendance/today?store_id=${storeId}`)
      const j = await res.json()
      if(j.success){
        setEmployees(j.employees || [])
      }
    }catch(e){ console.log(e) }
    setLoading(false)
  }

  useEffect(()=>{
    if(!storeId) return
    generateQR()
    loadEmployees()
    const interval = setInterval(()=>generateQR(), 5*60*1000)
    const poll = setInterval(loadEmployees, 5000)
    const cd = setInterval(()=> setCountdown(c => c>0? c-1 : 0), 1000)
    return ()=> { clearInterval(interval); clearInterval(poll); clearInterval(cd) }
  }, [origin, storeId])

  const handleSelect = (emp)=>{
    if(selectedEmp?.id === emp.id){
      setSelectedEmp(null)
      selectedRef.current = null
      generateQR(null)
    } else {
      setSelectedEmp(emp)
      selectedRef.current = emp
      generateQR(emp.id)
    }
  }

  // إذا فاتح الشاشة بدون store_id -> بلوك
  if(!storeId){
    return (
      <div style={{minHeight:'100vh', background:'#0a0a14', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontFamily:'Cairo'}}>
        <div style={{textAlign:'center', background:'rgba(255,0,0,0.1)', padding:'30px', borderRadius:'20px', border:'1px solid rgba(255,0,0,0.3)'}}>
          <h2 style={{fontSize:'22px', marginBottom:'10px'}}>❌ الشاشة غير مربوطة بمتجر</h2>
          <p style={{color:'rgba(255,255,255,0.6)'}}>افتحها من داشبورد المتجر: <br/>/office-display?store_id=MD_HQ_001</p>
        </div>
      </div>
    )
  }

  const minutes = Math.floor(countdown/60)
  const seconds = countdown%60
  const unbound = employees.filter(e =>!e.device_fingerprint)
  const bound = employees.filter(e => e.device_fingerprint)

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
      <BackToDashboard />
      <h1 style={{fontSize:'28px', fontWeight:'800', marginBottom:'8px'}}>شاشة {storeId} - ربط</h1>
      <div style={{width:'60px', height:'3px', background:'linear-gradient(90deg, #ec4899, #8b5cf6)', borderRadius:'10px', marginBottom:'20px'}}></div>

      <div style={{
        background:'white', padding:'20px', borderRadius:'24px',
        boxShadow:'0 25px 60px rgba(0,0,0,0.5)', marginBottom:'16px', textAlign:'center'
      }}>
        {qrLink? (
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrLink)}`}
            alt="QR"
            style={{width:'300px', height:'300px'}}
          />
        ) : <div style={{width:'300px', height:'300px', background:'#eee'}}></div>}
        <div style={{color:'#111', marginTop:'10px', fontWeight:'bold', fontSize:'14px'}}>
          {selectedEmp? `جاهز لـ ${selectedEmp.full_name} - صوّر من تلفونك` : `جاهز للدوام - متجر ${storeId}`}
        </div>
        <div style={{color:'#111', fontSize:'13px', marginTop:'4px'}}>صالح لـ {minutes}:{seconds.toString().padStart(2,'0')}</div>
        <div style={{color:'#666', fontSize:'10px', marginTop:'4px', wordBreak:'break-all', maxWidth:'300px'}}>{storeId} - {baseToken.slice(0,20)}...</div>
      </div>

      <button onClick={()=>generateQR()} style={{
        background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)',
        color:'white', padding:'8px 16px', borderRadius:'10px', cursor:'pointer', marginBottom:'20px'
      }}>تحديث الـ QR يدوي 🔄</button>

      {selectedEmp && (
        <div style={{
          width:'100%', maxWidth:'700px',
          background: selectedEmp.device_fingerprint? 'rgba(59,130,246,0.15)' : 'rgba(34,197,94,0.15)',
          border: selectedEmp.device_fingerprint? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(34,197,94,0.3)',
          borderRadius:'12px', padding:'12px', marginBottom:'20px',
          textAlign:'center', color: selectedEmp.device_fingerprint? '#60a5fa' : '#4ade80', fontSize:'14px', fontWeight:'700'
        }}>
          {selectedEmp.device_fingerprint
          ? `ℹ ${selectedEmp.full_name} الجهاز موثوق - تصوير الـ QR سوف يسجل دخول/خروج`
            : `✅ يا ${selectedEmp.full_name} افتح /attendance وصوّر الـ QR - سوف يتوثق جهازك لمتجر ${storeId}`
          }
        </div>
      )}

      <div style={{
        width:'100%', maxWidth:'700px',
        background:'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
        backdropFilter:'blur(20px)', borderRadius:'24px', padding:'24px',
        border:'1px solid rgba(255,255,255,0.08)'
      }}>
        <h3 style={{marginBottom:'16px', fontSize:'18px', fontWeight:'700'}}>👥 الغير موثوقة ({unbound.length}) - {storeId}</h3>
        {loading? <div style={{textAlign:'center', color:'rgba(255,255,255,0.5)'}}>جاري التحميل...</div> :
          unbound.length===0? <div style={{textAlign:'center', padding:'20px', background:'rgba(34,197,94,0.1)', borderRadius:'12px', color:'#4ade80'}}>كل الأجهزة موثوقة ✅</div> :
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'10px', marginBottom:'24px'}}>
            {unbound.map(em=>(
              <button key={em.id} onClick={()=>handleSelect(em)} style={{
                background: selectedEmp?.id===em.id? 'linear-gradient(135deg, #ec4899, #8b5cf6)' : 'rgba(0,0,0,0.3)',
                border: selectedEmp?.id===em.id? '1px solid #ec4899' : '1px solid rgba(255,255,255,0.08)',
                padding:'14px', borderRadius:'12px', color:'white', cursor:'pointer', fontWeight:'700', fontSize:'14px', textAlign:'center'
              }}>
                {em.full_name}<div style={{fontSize:'11px', color:'rgba(255,255,255,0.5)', marginTop:'4px'}}>{em.department} - ⏳</div>
              </button>
            ))}
          </div>
        }
        <h3 style={{marginBottom:'16px', fontSize:'16px', fontWeight:'700', color:'rgba(255,255,255,0.7)'}}>✅ الموثوقة ({bound.length})</h3>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'10px'}}>
          {bound.map(em=>(
            <button key={em.id} onClick={()=>handleSelect(em)} style={{
              background: selectedEmp?.id===em.id? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.05)',
              border: selectedEmp?.id===em.id? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.05)',
              padding:'14px', borderRadius:'12px', color:'white', cursor:'pointer', fontWeight:'700', fontSize:'14px', textAlign:'center', opacity:0.7
            }}>
              {em.full_name}<div style={{fontSize:'11px', color:'#60a5fa', marginTop:'4px'}}>{em.department} - ✅</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
