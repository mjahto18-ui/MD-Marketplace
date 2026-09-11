"use client"
import { useState, useEffect } from "react"

const CHARITIES = [
  { id:'karitass', name:'كاريتاس لبنان', logo:'/charities/karitass.webp' },
  { id:'salib_a7mar', name:'الصليب الأحمر', logo:'/charities/salib_a7mar.webp' },
  { id:'dar_aytam', name:'دار الأيتام', logo:'/charities/dar_aytam.webp' },
  { id:'difa3_madani', name:'الدفاع المدني', logo:'/charities/difa3_madani.webp' },
  { id:'kafa', name:'كفى عنف', logo:'/charities/kafa.webp' }
]

export default function DonatePage({ params }) {
  const [net, setNet] = useState(0)
  const [donate, setDonate] = useState(0)
  const [selected, setSelected] = useState([])

  useEffect(()=>{
    fetch(`/api/overpay/pending?id=${params.id}`).then(r=>r.json()).then(d=>{
      setNet(d.Net)
      setDonate(Math.floor(d.Net/2))
    })
  },[])

  const per = selected.length? Math.floor(donate/selected.length) : 0
  const toWallet = net - donate

  const confirm = async ()=>{
    await fetch('/api/overpay/choose', {
      method:'POST',
      body: JSON.stringify({ pendingId: params.id, donateAmount: donate, charityIds: selected })
    })
    alert('تم!')
  }

  return (
    <div dir="rtl" className="max-w- mx-auto p-5 bg-white min-h-screen">
      <h1 className="text- font-black">عندك فرق {net} ل.ل</h1>
      <p className="text-sm text-gray-500 mt-1">اختر قديش بدك تتبرع والباقي بيرجع محفظتك</p>

      <div className="mt-6 bg-[#f8f6f2] p-4 rounded-">
        <input type="range" min={1000} max={net} step={500} value={donate} onChange={e=>setDonate(+e.target.value)} className="w-full accent-black" />
        <div className="flex justify-between mt-2 text-sm font-bold">
          <span>تبرع: {donate}</span>
          <span>محفظة: {toWallet}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        {CHARITIES.map(c=>{
          const sel = selected.includes(c.id)
          return (
            <div key={c.id} onClick={()=>setSelected(s=> sel? s.filter(x=>x!==c.id) : [...s, c.id])}
              className={`rounded- border-2 p-3 cursor-pointer bg-white ${sel?'border-black':'border-gray-100'}`}>
              <img src={c.logo} className="w- h- object-contain mx-auto bg-white rounded-full" />
              <p className="text-center text- font-bold mt-2">{c.name}</p>
              {sel && <p className="text-center text- text-green-600 font-bold mt-1">{per} ل.ل</p>}
              {sel && <div className="w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text- mx-auto mt-1">✓</div>}
            </div>
          )
        })}
      </div>

      {selected.length>0 && (
        <div className="mt-4 text-center text- bg-black text-white p-3 rounded-xl">
          رح ينقسم {donate} على {selected.length} جمعيات = {per} لكل وحدة
        </div>
      )}

      <button onClick={confirm} disabled={!selected.length} className="w-full mt-6 bg-black text-white p-4 rounded- font-bold disabled:opacity-30">
        تأكيد التبرع {selected.length? `(${donate} ل.ل)` : ''}
      </button>
      <button className="w-full mt-2 p-4 rounded- border font-bold">رجع كلو عالمحفظة ({net})</button>
    </div>
  )
}
