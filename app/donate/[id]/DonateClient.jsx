"use client"
import { useState, useEffect } from "react"

const CHARITIES = [
  { id:'karitass', name:'كاريتاس لبنان', logo:'/charities/karitass.webp' },
  { id:'salib_a7mar', name:'الصليب الأحمر', logo:'/charities/salib_a7mar.webp' },
  { id:'dar_aytam', name:'دار الأيتام', logo:'/charities/dar_aytam.webp' },
  { id:'difa3_madani', name:'الدفاع المدني', logo:'/charities/difa3_madani.webp' },
  { id:'kafa', name:'كفى', logo:'/charities/kafa.webp' },
]

export default function DonateClient({ pendingId }){
  const [net,setNet]=useState(null)
  const [donate,setDonate]=useState(0)
  const [sel,setSel]=useState(null) // هون صار string واحد مش array
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    fetch(`/api/overpay/pending?id=${pendingId}`)
      .then(r=>r.json()).then(d=>{ setNet(d.Net); setDonate(Math.floor(d.Net/2)) })
      .finally(()=>setLoading(false))
  },[pendingId])

  if(loading) return <div dir="rtl" className="p-10 text-center">عم نحمل...</div>

  const toWallet = net - donate

  const send = async (amount, charity) => {
    await fetch('/api/overpay/choose',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ pendingId, donateAmount: amount, charityId: charity })
    })
    alert(charity ? `تبرعت ${amount} لـ ${charity} ورجع ${net-amount} محفظتك` : `رجع كلو ${net} عالمحفظة`)
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#fdfbf7] p-4 flex justify-center">
      <div className="w-full max-w-5xl lg:flex gap-6">
        <div className="lg:w- bg-white rounded-2xl p-5 border shadow-sm h-fit lg:sticky lg:top-4">
          <h1 className="text-xl font-black">عندك فرق {net?.toLocaleString()} ل.ل</h1>
          <input type="range" min={0} max={net} step={500} value={donate} onChange={e=>setDonate(Number(e.target.value))} className="w-full accent-black mt-6" />
          <div className="flex justify-between mt-3 text-sm font-bold">
            <span className="bg-black text-white px-3 py-1 rounded-full">تبرع: {donate.toLocaleString()}</span>
            <span className="bg-gray-100 px-3 py-1 rounded-full">محفظة: {toWallet.toLocaleString()}</span>
          </div>

          <button onClick={()=>send(donate, sel)} disabled={donate>0 && !sel} className="w-full bg-black text-white p-4 rounded-xl mt-4 font-bold disabled:opacity-30">
            {sel && donate>0 ? `تبرع ${donate.toLocaleString()} لـ ${sel}` : 'اختر جمعية للمساهمة'}
          </button>
          <button onClick={()=>send(0, null)} className="w-full bg-white border-2 border-black p-4 rounded-xl mt-2 font-bold">
            لا، رجع كلو عالمحفظة
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 flex-1">
          {CHARITIES.map(c=>{
            const isSel = sel===c.id
            return (
              <div key={c.id} onClick={()=>setSel(isSel? null : c.id)} className={`bg-white rounded-2xl p-4 text-center border-2 cursor-pointer ${isSel?'border-black':'border-transparent shadow-sm'}`}>
                <img src={c.logo} alt={c.name} className="w-14 h-14 object-contain mx-auto" />
                <div className="text-sm font-bold mt-2">{c.name}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
