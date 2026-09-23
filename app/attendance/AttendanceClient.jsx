"use client"
import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"

function AttendanceInner(){
  const searchParams = useSearchParams()
  const qr = searchParams.get('qr')
  const [msg, setMsg] = useState('عم جهز بصمة تلفونك...')

  useEffect(()=>{
    if(!qr){ setMsg('صور الـ QR من شاشة المكتب'); return; }

    const bind = async ()=>{
      let deviceId = localStorage.getItem('my_device_id')
      if(!deviceId){
        deviceId = `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`
        localStorage.setItem('my_device_id', deviceId)
      }
      const raw = `${deviceId}||${navigator.userAgent}||${screen.width}x${screen.height}`
      const fingerprint = deviceId + "-" + btoa(raw).slice(0,20)

      try{
        const res = await fetch('/api/attendance/clock',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({
            employee_id: null,
            device_fingerprint: fingerprint,
            device_type: navigator.userAgent.slice(0,100),
            qr_token: qr
          })
        })
        const j = await res.json()
        setMsg(j.success? `✅ ${j.message}` : `❌ ${j.message}`)
      }catch(e){ setMsg('خطأ شبكة') }
    }
    bind()
  }, [qr])

  return (
    <div style={{minHeight:'100vh', background:'#080811', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Cairo', padding:'20px'}}>
      <div style={{background:'white', color:'#111', padding:'30px', borderRadius:'20px', textAlign:'center', maxWidth:'400px', width:'100%'}}>
        <h2 style={{marginBottom:'20px'}}>{msg}</h2>
        {!qr && <p>افتح كاميرا تلفونك وصوّر الـ QR يلي على شاشة المكتب</p>}
      </div>
    </div>
  )
}

export default function AttendanceClient(){
  return (
    <Suspense fallback={<div>جاري التحميل...</div>}>
      <AttendanceInner />
    </Suspense>
  )
}
