"use client"
export const dynamic = "force-dynamic";
import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

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
        else router.push('/admin/dashboard')
      } else setErr(j.message || "فشل الدخول")
    }catch(e){ setErr("خطأ اتصال") }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight:'100vh', 
      background:'radial-gradient(1200px at 20% -10%, #1a0b2e 0%, #0a0a14 45%, #080811 100%)',
      display:'flex', 
      alignItems:'center', 
      justifyContent:'center', 
      fontFamily:'Cairo, sans-serif',
      padding:'20px'
    }}>
      <div style={{
        background:'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
        backdropFilter:'blur(20px)',
        padding:'36px 32px', 
        borderRadius:'24px', 
        width:'400px', 
        border:'1px solid rgba(255,255,255,0.08)', 
        boxShadow:'0 25px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)'
      }}>
        {/* Logo */}
        <div style={{display:'flex', justifyContent:'center', marginBottom:'28px'}}>
          <div style={{
            width:'140px', 
            height:'140px', 
            borderRadius:'28px', 
            overflow:'hidden',
            boxShadow:'0 0 40px rgba(236,72,153,0.3), 0 0 80px rgba(139,92,246,0.2)',
            border:'1px solid rgba(255,255,255,0.1)'
          }}>
            <Image src="/icon-dark.png" alt="MD Marketplace" width={140} height={140} style={{objectFit:'cover'}} />
          </div>
        </div>

        <div style={{textAlign:'center', marginBottom:'28px'}}>
          <h2 style={{color:'rgba(255,255,255,0.9)', fontSize:'15px', fontWeight:'600', letterSpacing:'0.5px'}}>للأعمال الإدارية فقط</h2>
          <div style={{width:'40px', height:'3px', background:'linear-gradient(90deg, #ec4899, #8b5cf6)', margin:'10px auto 0', borderRadius:'10px'}}></div>
        </div>
        
        <div style={{display:'flex', flexDirection:'column', gap:'14px'}}>
          <input 
            value={phone} 
            onChange={e=>setPhone(e.target.value)} 
            placeholder="رقم الموبايل" 
            style={{
              width:'100%', 
              padding:'14px 16px', 
              borderRadius:'12px', 
              background:'rgba(0,0,0,0.3)', 
              border:'1px solid rgba(255,255,255,0.1)', 
              color:'white', 
              outline:'none',
              fontSize:'14px',
              transition:'all 0.2s'
            }}
            onFocus={e=>e.target.style.borderColor='#8b5cf6'}
            onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}
          />
          <input 
            value={pin} 
            onChange={e=>setPin(e.target.value)} 
            type="password" 
            placeholder="كلمة المرور" 
            style={{
              width:'100%', 
              padding:'14px 16px', 
              borderRadius:'12px', 
              background:'rgba(0,0,0,0.3)', 
              border:'1px solid rgba(255,255,255,0.1)', 
              color:'white', 
              outline:'none',
              fontSize:'14px'
            }}
            onFocus={e=>e.target.style.borderColor='#8b5cf6'}
            onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}
          />
        </div>
        
        {err && <div style={{background:'rgba(239,68,68,0.1)', color:'#fca5a5', padding:'12px', borderRadius:'10px', fontSize:'13px', marginTop:'14px', border:'1px solid rgba(239,68,68,0.2)', textAlign:'center'}}>{err}</div>}
        
        <button 
          onClick={login} 
          disabled={loading} 
          style={{
            width:'100%', 
            background:'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', 
            color:'white', 
            padding:'14px', 
            borderRadius:'12px', 
            fontWeight:'bold', 
            cursor:'pointer', 
            border:'none',
            marginTop:'20px',
            fontSize:'15px',
            boxShadow:'0 8px 20px rgba(139,92,246,0.4)',
            opacity: loading?0.6:1,
            transition:'all 0.2s'
          }}>
          {loading?'جاري الدخول...':'دخول'}
        </button>
      </div>
    </div>
  )
}
