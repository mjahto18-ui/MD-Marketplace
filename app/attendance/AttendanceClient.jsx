"use client"
import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"

function AttendanceInner(){
  const searchParams = useSearchParams()
  const qr = searchParams.get('qr')
  const [msg, setMsg] = useState('عم جهز بصمة تلفونك...')

  const generateStableFingerprint = () => {
    // اذا محفوظ قبل رجعو
    const stored = localStorage.getItem('stable_device_fp')
    if(stored) return stored

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx.textBaseline = "top"
    ctx.font = "14px Arial"
    ctx.fillText("fingerprint",2,2)
    const canvasData = canvas.toDataURL().slice(-30)

    const raw = navigator.userAgent + '|' + screen.width + 'x' + screen.height + '|' + canvasData + '|' + navigator.language
    const hash = btoa(raw).replace(/[^a-z0-9]/gi,'').slice(0,32).toLowerCase()
    const fp = 'dev-' + hash

    localStorage.setItem('stable_device_fp', fp)
    return fp
  }

  useEffect(()=>{
    if(!qr){ setMsg('صور الـ QR من شاشة المكتب'); return; }

    const bind = async ()=>{
      const fingerprint = generateStableFingerprint()

      try{
        const res = await fetch('/api/attendance/clock',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({
            employee_id: null,
            device_fingerprint: fingerprint,
            device_type: navigator.userAgent.slice(0,250),
            qr_token: qr
          })
        })
        const j = await res.json()
        setMsg(j.success? `✅ ${j.message}\n${fingerprint}` : `❌ ${j.message}`)
      }catch(e){ setMsg('خطأ شبكة') }
    }
    bind()
  }, [qr])

  return (
    <div style={{minHeight:'100vh', background:'#080811', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Cairo', padding:'20px'}}>
      <div style={{background:'white', color:'#111', padding:'30px', borderRadius:'20px', textAlign:'center', maxWidth:'400px', width:'100%'}}>
        <h2 style={{marginBottom:'20px', whiteSpace:'pre-wrap'}}>{msg}</h2>
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
