"use client"
import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"

function AttendanceInner(){
  const searchParams = useSearchParams()
  const qr = searchParams.get('qr')
  const [msg, setMsg] = useState('يتم الأن توثيق الجهاز...')

  const generateStableFingerprint = () => {
    // امسح القديم الضعيف
    const old = localStorage.getItem('stable_device_fp')
    if(old && old.startsWith('dev-tw96awxsys81ljagk')){
      localStorage.removeItem('stable_device_fp')
    }

    const stored = localStorage.getItem('stable_device_fp_v2')
    if(stored) return stored

    // 1. Canvas بصمة قوية - كل كرت شاشة بيرسم لون مختلف
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx.textBaseline = "top"
    ctx.font = "14px Arial"
    ctx.fillStyle = "#f60"
    ctx.fillRect(125,1,62,20)
    ctx.fillStyle = "#069"
    ctx.fillText("md-marketplace-2024",2,15)
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)"
    ctx.fillText("md-marketplace-2024",4,17)
    const canvasData = canvas.toDataURL()

    // 2. جمع معلومات الجهاز
    const raw = [
      canvasData,
      navigator.userAgent,
      `${screen.width}x${screen.height}x${screen.colorDepth}x${window.devicePixelRatio}`,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator.language,
      (navigator.languages||[]).join(','),
      navigator.hardwareConcurrency || 0,
      navigator.maxTouchPoints || 0
    ].join('||')

    // 3. Hash قوي (cyrb53) - بيطلع مختلف تماما حتى لو فرق حرف واحد
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57
    for(let i=0; i<raw.length; i++){
      const ch = raw.charCodeAt(i)
      h1 = Math.imul(h1 ^ ch, 2654435761)
      h2 = Math.imul(h2 ^ ch, 1597334677)
    }
    h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909)
    h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909)
    const hash = (4294967296 * (2097151 & h2) + (h1>>>0)).toString(36)

    const fp = 'dev-' + hash
    localStorage.setItem('stable_device_fp_v2', fp)
    return fp
  }

  useEffect(()=>{
    if(!qr){ setMsg('يرجى تصوير الـ QR من شاشة المكتب'); return; }

    const bind = async ()=>{
      const fingerprint = generateStableFingerprint()
      setMsg('جاري جلب الموقع... 📍')

      // ===== الجديد: جيب GPS الموظف قبل البصمة =====
      if(!navigator.geolocation){
        setMsg('❌ هذا الجهاز لا يدعم الموقع')
        return
      }

      navigator.geolocation.getCurrentPosition(async (pos)=>{
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const accuracy = pos.coords.accuracy

        if(accuracy > 120){
          setMsg(`❌ GPS ضعيف ${Math.round(accuracy)}م - اطلع برا المحل شوي وحاول`)
          return
        }

        setMsg(`الموقع: ${Math.round(accuracy)}م - جاري التوثيق...`)
        try{
          const res = await fetch('/api/attendance/clock',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({
              employee_id: null,
              device_fingerprint: fingerprint,
              device_type: navigator.userAgent.slice(0,250),
              qr_token: qr,
              lat, lng, accuracy
            })
          })
          const j = await res.json()
          setMsg(j.success? `✅ ${j.message}\n${fingerprint}` : `❌ ${j.message}\n${fingerprint}`)
        }catch(e){ setMsg('خطأ شبكة') }

      }, (err)=>{
        if(err.code === 1) setMsg('❌ يرجى تفعيل الموقع - لا يمكن تسجيل الدخول بلا GPS\nفعل Location من الاعدادات')
        else if(err.code === 2) setMsg('❌ لا استطيع تحديد موقعك - تأكد من شبكة الانترنت')
        else setMsg('❌ خطأ GPS - حاول مرة تانية')
      }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 })
    }
    bind()
  }, [qr])

  return (
    <div style={{minHeight:'100vh', background:'#080811', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Cairo', padding:'20px'}}>
      <div style={{background:'white', color:'#111', padding:'30px', borderRadius:'20px', textAlign:'center', maxWidth:'400px', width:'100%'}}>
        <h2 style={{marginBottom:'20px', whiteSpace:'pre-wrap', wordBreak:'break-all'}}>{msg}</h2>
        {!qr && <p>افتح كاميرة الهاتف وصوّر الـ QR اللذي على شاشة المكتب</p>}
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
