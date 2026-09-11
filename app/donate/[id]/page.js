"use client"
import { useState, useEffect } from "react"

const CHARITIES = [
  { id:'karitass', name:'كاريتاس لبنان', logo:'/charities/karitass.webp' },
  { id:'salib_a7mar', name:'الصليب الأحمر', logo:'/charities/salib_a7mar.webp' },
  { id:'dar_aytam', name:'دار الأيتام', logo:'/charities/dar_aytam.webp' },
  { id:'difa3_madani', name:'الدفاع المدني', logo:'/charities/difa3_madani.webp' },
  { id:'kafa', name:'كفى', logo:'/charities/kafa.webp' },
]

export default function Page({ params }){
  const [net,setNet]=useState(0)
  const [donate,setDonate]=useState(0)
  const [sel,setSel]=useState([])

  useEffect(()=>{
    fetch(`/api/overpay/pending?id=${params.id}`).then(r=>r.json()).then(d=>{
      setNet(d.Net)
      setDonate(Math.floor(d.Net/2))
    })
  },[])

  const per = sel.length? Math.floor(donate/sel.length):0

  const confirm = async ()=>{
    await fetch('/api/overpay/choose', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ pendingId: params.id, donateAmount: donate, charityIds: sel })
    })
    alert('تم التبرع!')
  }

  return (
    <div dir="rtl" className="max-w- mx-auto min-h-screen bg-[#fdfbf7] p-4 lg:flex lg:gap-6">
      <div className="lg:w- bg-white rounded- p-5 border shadow-sm h-fit lg:sticky lg:top-4">
        <h1 className="text- font-black">عندك فرق {net.toLocaleString()} ل.ل</h1>
        <input type="range" min={1000} max={net} step={500} value={donate} onChange={e=>setDonate(+e.target.value)} className="w-full accent-black mt-4" />
        <div className="flex justify-between mt-3 text-sm font-bold"><span>تبرع {donate}</span><span className="text-gray-400">محفظة {net-donate}</span></div>
        {sel.length>0 && <div className="bg-black text-white text-center p-3 rounded-xl mt-4 text-">{donate} / {sel.length} = {per} لكل جمعية</div>}
        <button onClick={confirm} className="w-full bg-black text-white p-4 rounded-xl mt-4 font-bold">تأكيد</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4 lg:mt-0 flex-1">
        {CHARITIES.map(c=>{
          const isSel = sel.includes(c.id)
          return (
            <div key={c.id} onClick={()=>setSel(s=>isSel? s.filter(x=>x!==c.id):[...s,c.id])} className={`bg-white rounded- p-4 text-center border-2 cursor-pointer ${isSel?'border-black':'border-transparent shadow-sm'}`}>
              <img src={c.logo} className="w-12 h-12 md:w-14 md:h-14 object-contain mx-auto rounded-full bg-white" />
              <div className="text- font-bold mt-2">{c.name}</div>
              {isSel && <div className="text- text-green-600 font-black mt-1">{per} ل.ل</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
