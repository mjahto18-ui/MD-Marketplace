"use client"
import { useState, useEffect } from "react"

const CHARITIES = [
  { id:'CHARITY_CARITAS', name:'كاريتاس لبنان', logo:'/charities/karitass.webp' },
  { id:'CHARITY_RED_CROSS', name:'الصليب الأحمر', logo:'/charities/salib_a7mar.webp' },
  { id:'CHARITY_DAR_AYTAM', name:'دار الأيتام', logo:'/charities/dar_aytam.webp' },
  { id:'CHARITY_CIVIL_DEF', name:'الدفاع المدني', logo:'/charities/difa3_madani.webp' },
  { id:'CHARITY_KAFA', name:'كفى', logo:'/charities/kafa.webp' },
]

export default function DonateClient({ pendingId }){
  const [net,setNet]=useState(0)
  const [donate,setDonate]=useState(0)
  const [sel,setSel]=useState(null)
  const [loading,setLoading]=useState(true)
  const [submitting,setSubmitting]=useState(false)
  const [done,setDone]=useState(false)

  useEffect(()=>{
    fetch(`/api/overpay/pending?id=${pendingId}`)
      .then(r=>r.json()).then(d=>{
        const row = Array.isArray(d) ? d[0] : d.data ? d.data : d
        const amount = Number(row?.Net ?? row?.net ?? 0)
        setNet(amount)
        setDonate(Math.floor(amount/2))
        if(row?.Status !== 'Pending') setDone(true) // اذا منصرف قبل
      })
      .finally(()=>setLoading(false))
  },[pendingId])

  if(loading) return <div dir="rtl" className="p-10 text-center">عم نحمل...</div>
  if(done) return <div dir="rtl" className="min-h-screen bg-[#fdfbf7] p-10 text-center">
    <h1 className="text-2xl font-black">تمت العملية بنجاح ✅</h1>
    <p className="mt-2">الفرق تصفر وما بقا في شي للتبرع</p>
  </div>

  const toWallet = Math.max(0, net - donate)

  const send = async (amount, charity) => {
    if(submitting) return // منع كبستين
    setSubmitting(true)
    try{
      const res = await fetch('/api/overpay/choose',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ pendingId, donateAmount: amount, charityId: charity })
      })
      const j = await res.json()
      if(!res.ok) throw new Error(j.error)

      // هون من صفر الرقم بلا رفرش
      setNet(0)
      setDonate(0)
      setDone(true)

    }catch(e){
      alert('فشلت: ' + e.message)
    }finally{
      setSubmitting(false)
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#fdfbf7] p-4 flex justify-center">
      <div className="w-full max-w-5xl lg:flex gap-6">
        <div className="lg:w-1/3 bg-white rounded-2xl p-5 border shadow-sm h-fit lg:sticky lg:top-4">
          <h1 className="text-xl font-black">عندك فرق {net.toLocaleString()} ل.ل</h1>
          <input type="range" min={0} max={net} step={500} value={donate} onChange={e=>setDonate(Number(e.target.value))} className="w-full accent-black mt-6" disabled={submitting} />
          <div className="flex justify-between mt-3 text-sm font-bold">
            <span className="bg-black text-white px-3 py-1 rounded-full">تبرع: {donate.toLocaleString()}</span>
            <span className="bg-gray-100 px-3 py-1 rounded-full">محفظة: {toWallet.toLocaleString()}</span>
          </div>

          <button 
            onClick={()=>send(donate, sel)} 
            disabled={submitting || (donate>0 && !sel) || net===0} 
            className="w-full bg-black text-white p-4 rounded-xl mt-4 font-bold disabled:opacity-30">
            {submitting ? 'يتم التبرع...' : donate>0 ? (sel ? `تبرع ${donate.toLocaleString()} لـ ${sel}` : 'اختر جمعية للمساهمة') : 'اختر جمعية للمساهمة'}
          </button>
          <button 
            onClick={()=>send(0, null)} 
            disabled={submitting || net===0}
            className="w-full bg-white border-2 border-black p-4 rounded-xl mt-2 font-bold disabled:opacity-30">
            لا، رجع كلو عالمحفظة
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 flex-1">
          {CHARITIES.map(c=>{
            const isSel = sel===c.id
            return (
              <div key={c.id} onClick={()=> !submitting && setSel(isSel? null : c.id)} className={`bg-white rounded-2xl p-4 text-center border-2 cursor-pointer ${isSel?'border-black':'border-transparent shadow-sm'} ${submitting?'pointer-events-none opacity-50':''}`}>
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
