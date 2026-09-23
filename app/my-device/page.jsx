"use client"
import { useEffect, useState } from "react"

export const dynamic = 'force-dynamic'

export default function MyDevicePage() {
  const [fp, setFp] = useState("")
  const [ua, setUa] = useState("")

  useEffect(() => {
    localStorage.removeItem('stable_device_fp')
    const stored = localStorage.getItem('stable_device_fp_v2')
    if (stored) {
      setFp(stored)
      setUa(navigator.userAgent)
      return
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    ctx.textBaseline = "top"
    ctx.font = "14px Arial"
    ctx.fillStyle = "#f60"
    ctx.fillRect(125,1,62,20)
    ctx.fillStyle = "#069"
    ctx.fillText("md-marketplace-2024",2,15)
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)"
    ctx.fillText("md-marketplace-2024",4,17)
    const canvasData = canvas.toDataURL()

    const raw = [
      canvasData,
      navigator.userAgent,
      `${screen.width}x${screen.height}x${screen.colorDepth}x${window.devicePixelRatio}`,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator.language,
    ].join('||')

    let h1 = 0xdeadbeef, h2 = 0x41c6ce57
    for(let i=0; i<raw.length; i++){
      const ch = raw.charCodeAt(i)
      h1 = Math.imul(h1 ^ ch, 2654435761)
      h2 = Math.imul(h2 ^ ch, 1597334677)
    }
    h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909)
    h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909)
    const hash = (4294967296 * (2097151 & h2) + (h1>>>0)).toString(36)
    const newFp = 'dev-' + hash
    
    localStorage.setItem('stable_device_fp_v2', newFp)
    setFp(newFp)
    setUa(navigator.userAgent)
  }, [])

  return (
    <div style={{background:'#0a0e1f', minHeight:'100vh', padding:20, color:'#fff', textAlign:'center', direction:'rtl'}}>
      <h3>بصمة تلفونك الحالي:</h3>
      <div style={{background:'#000', padding:15, borderRadius:8, color:'#0f0', fontFamily:'monospace', wordBreak:'break-all', margin:'15px 0'}}>
        {fp || 'جاري التحميل...'}
      </div>
      <div style={{background:'#fff', color:'#000', padding:10, borderRadius:8, fontSize:12, wordBreak:'break-all'}}>
        {ua}
      </div>
      <p style={{marginTop:20}}>صورلي هالشاشة</p>
    </div>
  )
}
