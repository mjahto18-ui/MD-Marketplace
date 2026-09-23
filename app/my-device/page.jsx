"use client"
import { useEffect, useState } from 'react'

export default function MyDevice(){
  const [fp, setFp] = useState('عم حضر البصمة...')
  const [ua, setUa] = useState('')

  useEffect(()=>{
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx.textBaseline = "top"
    ctx.font = "14px Arial"
    ctx.fillText("fingerprint",2,2)
    const canvasData = canvas.toDataURL().slice(-30)
    
    const raw = navigator.userAgent + '|' + screen.width + 'x' + screen.height + '|' + canvasData
    const hash = btoa(raw).replace(/[^a-z0-9]/gi,'').slice(0,24).toLowerCase()
    
    setFp('dev-' + hash)
    setUa(navigator.userAgent)
  },[])

  return (
    <div style={{padding:20, fontFamily:'sans-serif', direction:'rtl'}}>
      <h2>بصمة تلفونك الحالي:</h2>
      <p style={{background:'#111', color:'#0f0', padding:15, borderRadius:8, wordBreak:'break-all', fontSize:18}}>{fp}</p>
      <p style={{background:'#eee', padding:10, borderRadius:8, fontSize:12, wordBreak:'break-all'}}>{ua}</p>
      <p>صورلي هالشاشة</p>
    </div>
  )
}
