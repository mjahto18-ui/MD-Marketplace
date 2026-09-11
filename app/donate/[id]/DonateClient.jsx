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
  const [sel,setSel]=useState([])
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    async function load(){
      try{
        const r = await fetch(`/api/overpay/pending?id=${pendingId}`)
        const d = await r.json()
        if(d?.Net){
          setNet(d.Net)
          setDonate(Math.floor(d.Net/2))
        }else{
          setNet(20000) // fallback اذا الـ API لسا مش شغال
          setDonate(8000)
        }
      }catch{
        setNet(20000)
        setDonate(8000)
      }finally{ setLoading(false) }
    }
    load()
  },[pendingId])

  if(loading) return <div dir="rtl" className="p-10 text-center">عم نحمل...</div>
  if(!net) return <div dir="rtl" className="p-10 text-center">ما لقينا الفرق</div>

  const per = sel.length? Math.floor(donate/sel.length):0
  const toWallet = net - donate

  return (
    <div dir="rtl" className="min-h-screen bg-[#fdfbf7] p-4 flex justify-center">
      <div className="w-full max-w- lg:flex gap-6">
        <div className="lg:w- bg-white rounded- p-5 border shadow-sm h-fit lg:sticky top-4">
          <h1 className="text- font-black">عندك فرق {net.toLocaleString()} ل.ل</h1>
          <div className="mt-4">
            <input type="range" min={1000} max={net} step={500} value={Math.min(donate,net)} onChange={e=>setDonate(Number(e.target.value))} className="w-full accent-black" />
            <div className="flex justify-between mt-2 text-sm font-bold">
              <span>تبرع: {donate.toLocaleString()}</span>
              <span className="text-gray-400">محفظة: {toWallet.toLocaleString()}</span>
            </div>
          </div>
          {sel.length>0 && <div className="bg-black text-white text-center p-3 rounded-xl mt-4 text-">{donate} / {sel.length} = {per} لكل جمعية</div>}
          <button onClick={async ()=>{
            await fetch('/api/overpay/choose',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pendingId,donateAmount:donate,charityIds:sel})})
            alert('تم')
          }} className="w-full bg-black text-white p-4 rounded-xl mt-4 font-bold">تأكيد</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4 lg:mt-0 flex-1 content-start">
          {CHARITIES.map(c=>{
            const isSel = sel.includes(c.id)
            return (
              <div key={c.id} onClick={()=>setSel(s=>isSel? s.filter(x=>x!==c.id):[...s,c.id])} className={`bg-white rounded- p-4 text-center border-2 cursor-pointer ${isSel?'border-black':'border-transparent shadow-sm'}`}>
                <img src={c.logo} alt={c.name} className="w-12 h-12 md:w-14 md:h-14 object-contain mx-auto rounded-full bg-white" onError={e=>e.currentTarget.style.display='none'} />
                <div className="text- font-bold mt-2">{c.name}</div>
                {isSel && <div className="text- text-green-600 font-black mt-1">{per} ل.ل</div>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
