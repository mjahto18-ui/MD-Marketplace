"use client"
import { useEffect, useState } from "react"

export default function AddToHomeBanner(){
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [deferred, setDeferred] = useState(null)

  useEffect(()=>{
    const ua = window.navigator.userAgent
    const iOS = /iPhone|iPad|iPod/.test(ua)
    setIsIOS(iOS)

    // اذا هو PWA أصلاً (محطوط عالواجهة) لا تطلع البنر
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone
    if(isStandalone) return

    // Android - خزن الحدث
    window.addEventListener('beforeinstallprompt', (e)=>{
      e.preventDefault()
      setDeferred(e)
      setShow(true)
    })

    // iOS - طلع البنر بعد 3 ثواني بس مرة وحدة
    if(iOS &&!localStorage.getItem('pwa_dismissed')){
      setTimeout(()=> setShow(true), 3000)
    }
  },[])

  if(!show) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-[9999] p-4 animate-in slide-in-from-bottom">
      <div className="bg-[#0F0F0F] border border-[#FFD700]/30 rounded- p-5 max-w- mx-auto shadow-2xl">
        <div className="flex justify-between items-start gap-3">
          <div className="flex gap-3">
            <img src="/logo.png" className="w-12 h-12 rounded-2xl border border-[#FFD700]/20" />
            <div className="text-right">
              <div className="text-white font-black text-">ثبّت MD-Marketplace</div>
              <div className="text-white/60 text- mt-1">
                {isIOS
                 ? "لتصلك الإشعارات حتى لو الموقع مسكر"
                  : "توصيل أسرع + إشعارات "}
              </div>
            </div>
          </div>
          <button onClick={()=>{ setShow(false); localStorage.setItem('pwa_dismissed','1') }} className="text-white/40">✕</button>
        </div>

        {isIOS? (
          <div className="mt-4 bg-white/[0.06] rounded-2xl p-3 text- text-white/80 leading-relaxed">
            <div className="flex items-center gap-2">١. كبسة زر <span className="bg-white/20 px-2 py-0.5 rounded">مشاركة ⎙</span> تحت</div>
            <div className="flex items-center gap-2 mt-2">٢. ثم كبسة <span className="bg-[#FFD700] text-black px-2 py-0.5 rounded font-bold">إضافة إلى الشاشة الرئيسية +</span></div>
          </div>
        ) : (
          <button
            onClick={async()=>{
              if(deferred){ deferred.prompt(); const r = await deferred.userChoice; setShow(false) }
            }}
            className="mt-4 w-full h-12 bg-[#FFD700] text-black rounded-2xl font-black text-"
          >
            ثبّت الآن  
          </button>
        )}
      </div>
    </div>
  )
}
