"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight } from "lucide-react"

const CHARITIES = [
  { id:'CHARITY_CARITAS', name:'كاريتاس لبنان', logo:'/charities/karitass.webp' },
  { id:'CHARITY_RED_CROSS', name:'الصليب الأحمر', logo:'/charities/salib_a7mar.webp' },
  { id:'CHARITY_DAR_AYTAM', name:'دار الأيتام', logo:'/charities/dar_aytam.webp' },
  { id:'CHARITY_CIVIL_DEF', name:'الدفاع المدني', logo:'/charities/difa3_madani.webp' },
  { id:'CHARITY_KAFA', name:'كفى', logo:'/charities/kafa.webp' },
]

export default function DonateClient({ pendingId }){
  const router = useRouter()
  const [net,setNet]=useState(0)
  const [donate,setDonate]=useState(0)
  const [sel,setSel]=useState(null)
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    fetch(`/api/overpay/pending?id=${pendingId}`)
      .then(r=>r.json()).then(d=>{
        const row = Array.isArray(d) ? d[0] : d.data ? d.data : d
        const amount = Number(row?.Net ?? row?.net ?? row?.Net_amount ?? row?.total ?? 0)
        setNet(amount)
        setDonate(Math.floor(amount/2))
      })
      .catch(()=> setNet(0))
      .finally(()=>setLoading(false))
  },[pendingId])

  if(loading) return <div dir="rtl" className="p-10 text-center">عم نحمل...</div>

  const toWallet = Math.max(0, net - donate)

  const send = async (amount, charity) => {
    await fetch('/api/overpay/choose',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ pendingId, donateAmount: amount, charityId: charity })
    })
    router.push('/dashboard')
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#fdfbf7] pb-24">
      {/* Header موبايل */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b p-4 flex items-center gap-3">
        <button onClick={()=>router.back()} className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center active:scale-90">
          <ChevronRight className="w-5 h-5" />
        </button>
        <h1 className="font-black">اختيار الفرق</h1>
      </div>

      <div className="p-4 max-w-5xl mx-auto lg:flex gap-6">
        {/* كرت التحكم */}
        <div className="bg-white rounded- p-5 border shadow-sm lg:w- lg:h-fit lg:sticky lg:top-24">
          <h1 className="text- font-black leading-tight">عندك فرق {net.toLocaleString()} ل.ل</h1>
          <p className="text-gray-500 text-sm mt-1">حرّك الشريط لتقسيم المبلغ</p>

          <input type="range" min={0} max={net} step={500} value={donate} onChange={e=>setDonate(Number(e.target.value))} className="w-full accent-black mt-6 h-2" />

          <div className="flex justify-between mt-4 text- font-bold gap-2">
            <span className="bg-black text-white px-4 py-2 rounded-full flex-1 text-center">تبرع: {donate.toLocaleString()}</span>
            <span className="bg-gray-100 px-4 py-2 rounded-full flex-1 text-center">محفظة: {toWallet.toLocaleString()}</span>
          </div>

          {/* ديسكتوب */}
          <div className="hidden lg:block">
            <button onClick={()=>send(donate, sel)} disabled={donate>0 && !sel} className="w-full bg-black text-white p-4 rounded-2xl mt-5 font-bold disabled:opacity-30 active:scale-[0.98]">
              {donate>0 ? (sel ? `تبرع ${donate.toLocaleString()}` : 'اختر جمعية') : 'اختر جمعية'}
            </button>
            <button onClick={()=>send(0, null)} className="w-full bg-white border-2 border-black p-4 rounded-2xl mt-2 font-bold active:scale-[0.98]">
              لا، رجع كلو عالمحفظة
            </button>
          </div>
        </div>

        {/* الجمعيات */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 flex-1 mt-4 lg:mt-0">
          {CHARITIES.map(c=>{
            const isSel = sel===c.id
            return (
              <div key={c.id} onClick={()=>setSel(isSel? null : c.id)} className={`bg-white rounded- p-5 text-center border-2 cursor-pointer active:scale-95 transition-all ${isSel?'border-black shadow-md':'border-transparent shadow-sm'}`}>
                <img src={c.logo} alt={c.name} className="w-16 h-16 object-contain mx-auto" />
                <div className="text- font-bold mt-3 leading-tight">{c.name}</div>
                {isSel && <div className="mt-2 text- bg-black text-white rounded-full px-2 py-0.5 inline-block">مختار</div>}
              </div>
            )
          })}
        </div>
      </div>

      {/* أزرار ثابتة عالموبايل */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex gap-2 z-30">
        <button onClick={()=>send(0, null)} className="flex-1 bg-white border-2 border-black p-4 rounded-2xl font-bold">
          محفظة
        </button>
        <button onClick={()=>send(donate, sel)} disabled={donate>0 && !sel} className="flex-[2] bg-black text-white p-4 rounded-2xl font-bold disabled:opacity-30">
          {donate>0 ? (sel ? `تبرع ${donate.toLocaleString()}` : 'اختر جمعية') : 'تأكيد'}
        </button>
      </div>
    </div>
  )
}
