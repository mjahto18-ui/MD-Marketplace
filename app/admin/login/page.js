"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AdminLogin(){
  const [phone,setPhone]=useState("")
  const [pin,setPin]=useState("")
  const [err,setErr]=useState("")
  const [loading,setLoading]=useState(false)
  const router = useRouter()

  const login = async ()=>{
  setErr(""); setLoading(true)
  try{
    const res = await fetch('/api/admin/login',{
      method:'POST', 
      headers:{'Content-Type':'application/json'}, 
      body:JSON.stringify({phone,pin})
    })
    const j = await res.json()
    if(j.success){ 
      if(j.role === 'Store Owner') router.push('/store-owner')
      else if(j.role === 'Driver') router.push('/driver-owner')
      else router.push('/admin')
    } else setErr(j.message || "فشل الدخول")
  }catch(e){ setErr("خطأ اتصال") }
  setLoading(false)
}

  return (
    <div style={{minHeight:'100vh', background:'#0a1930', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'sans-serif'}}>
      <div style={{background:'#0e2242', padding:'32px', borderRadius:'16px', width:'380px', border:'1px solid rgba(255,255,255,0.1)', boxShadow:'0 20px 50px rgba(0,0,0,0.5)'}}>
        <h1 style={{fontWeight:'900', fontSize:'22px', color:'white', marginBottom:'6px'}}>MD Marketplace</h1>
        <div style={{color:'rgba(255,255,255,0.5)', fontSize:'13px', marginBottom:'24px'}}>دخول الأدمن - Admin فقط</div>
        
        <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Mobile - مثال: 03177653" style={{width:'100%', padding:'12px 14px', borderRadius:'10px', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', color:'white', marginBottom:'12px', outline:'none'}}/>
        <input value={pin} onChange={e=>setPin(e.target.value)} type="password" placeholder="PIN - مثال: 1234" style={{width:'100%', padding:'12px 14px', borderRadius:'10px', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', color:'white', marginBottom:'16px', outline:'none'}}/>
        
        {err && <div style={{background:'rgba(239,68,68,0.15)', color:'#f87171', padding:'10px', borderRadius:'8px', fontSize:'12px', marginBottom:'12px', border:'1px solid rgba(239,68,68,0.3)'}}>{err}</div>}
        
        <button onClick={login} disabled={loading} style={{width:'100%', background:'#2563eb', color:'white', padding:'12px', borderRadius:'10px', fontWeight:'bold', cursor:'pointer', opacity: loading?0.6:1}}>
          {loading?'جاري الدخول...':'دخول'}
        </button>
        
        <div style={{fontSize:'11px', color:'rgba(255,255,255,0.3)', marginTop:'14px', textAlign:'center'}}>جرب: 03177653 / 1234</div>
      </div>
    </div>
  )
}
