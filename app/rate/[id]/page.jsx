"use client"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function RatePage(){
  const { id } = useParams()
  const [driverName, setDriverName] = useState("السائق")
  const [rating, setRating] = useState(0)
  const [tags, setTags] = useState([])
  const [note, setNote] = useState("")
  const [done, setDone] = useState(false)
  const [loadingName, setLoadingName] = useState(true)

  useEffect(()=>{
    async function getDriver(){
      const { data } = await supabase
     .from('order_requuest')
     .select('"Assigned Driver"')
     .eq('Request ID', id)
     .single()

      if(data){
        let driverId = data["Assigned Driver"]

        if(driverId){
           const { data: driverData } = await supabase
          .from('drivers')
          .select('"Driver Name"')
          .eq('"Driver ID"', driverId)
          .single()

           if(driverData && driverData["Driver Name"]){
             setDriverName(driverData["Driver Name"])
           } else {
             setDriverName(driverId)
           }
        }
      }
      setLoadingName(false)
    }
    if(id) getDriver()
  }, [id])

  const toggleTag = (t) => {
    setTags(prev => prev.includes(t)? prev.filter(x=>x!==t) : [...prev, t])
  }

  const submit = async () => {
    if(!rating) return
    await supabase.from('reviews').insert({
      'Request ID': id,
      'Rating': rating,
      'Note': note,
      'Tags': tags.join(","),
    })
    setDone(true)
  }

  const skip = async () => {
    await supabase.from('reviews').insert({
      'Request ID': id,
      'Skipped': true,
    })
    setDone(true)
  }

  if(done){
    return (
      <div style={{minHeight:'100vh', background:'#0a1930', display:'flex', alignItems:'center', justifyContent:'center', direction:'rtl'}}>
        <div style={{background:'#f3f1ec', padding:24, borderRadius:20, width:'90%', maxWidth:360, textAlign:'center'}}>
          <div style={{fontSize:32}}>❤️</div>
          <div style={{fontWeight:900, marginTop:10}}>شكراً! تم تسجيل تقييمك</div>
          <a href="/" style={{display:'block', marginTop:16, background:'#0a1930', color:'white', padding:12, borderRadius:12, fontWeight:900, textDecoration:'none', textAlign:'center'}}>رجوع إلى الموقع</a>
          <div style={{fontSize:10, opacity:0.4, marginTop:12}}>طلب #{id}</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{minHeight:'100vh', background:'#0a1930', direction:'rtl', display:'flex', alignItems:'center', justifyContent:'center', padding:16}}>
      <div style={{display:'flex', gap:20, maxWidth:1000, width:'100%', flexWrap:'wrap', justifyContent:'center'}}>
        <div className="hidden md:flex" style={{flex:1, color:'white', flexDirection:'column', justifyContent:'center'}}>
          <div style={{fontSize:40, fontWeight:900}}>MD-Marketplace</div>
          <div style={{opacity:0.7, marginTop:10}}>{loadingName? "عم نجيب اسم السائق..." : `تقييم توصيلة ${driverName}`}</div>
          <div style={{opacity:0.5, fontSize:12, marginTop:4}}>تقييم توصيلة السائق</div>
          <div style={{opacity:0.3, fontSize:10, marginTop:4}}>طلب #{id}</div>
        </div>

        <div style={{background:'#f3f1ec', borderRadius:20, padding:20, width:'100%', maxWidth:400}}>
          <div style={{textAlign:'center', fontWeight:900, fontSize:18}}>
            {loadingName? "كيف كانت توصيلة السائق؟" : `كيف كانت توصيلة ${driverName}؟`}
          </div>

          <div style={{display:'flex', justifyContent:'center', gap:8, marginTop:16}}>
            {[1,2,3,4,5].map(n=>(
              <span key={n} onClick={()=>setRating(n)} style={{fontSize:36, cursor:'pointer', filter: n<=rating? 'none' : 'grayscale(1)'}}>⭐</span>
            ))}
          </div>

          {rating>0 && (
            <>
              <div style={{display:'flex', flexWrap:'wrap', gap:6, marginTop:14}}>
                {(rating<=3? ["تأخر","الطلب مكبوب","أسلوب"] : ["محترم","سريع","مرتب"]).map(t=>(
                  <button key={t} onClick={()=>toggleTag(t)} style={{padding:'6px 12px', borderRadius:20, border:'1px solid #111', background: tags.includes(t)? '#111':'white', color: tags.includes(t)? 'white':'#111', fontSize:12}}>{t}</button>
                ))}
              </div>
              <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder={rating<=3? "شو صار؟ احكيلنا" : "شو عجبك؟ (اختياري)"} style={{width:'100%', marginTop:12, padding:10, borderRadius:10, border:'1px solid #ccc', minHeight:80}} />
              <button onClick={submit} style={{width:'100%', marginTop:12, background:'#111', color:'white', padding:12, borderRadius:10, fontWeight:900}}>إرسال التقييم</button>
              <button onClick={skip} style={{width:'100%', marginTop:8, background:'#e5e7eb', padding:10, borderRadius:10, fontSize:12}}>تخطي / إغلاق</button>
            </>
          )}
          <div style={{textAlign:'center', fontSize:10, opacity:0.4, marginTop:12}}>طلب #{id}</div>
        </div>
      </div>
    </div>
  )
}
