"use client"
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AttendancePage(){
  const [live, setLive] = useState([])
  const [employees, setEmployees] = useState([])
  const [stats, setStats] = useState({on_now:0, today_total:0, present_today:0, absent:0})
  const [loading, setLoading] = useState(true)
  const [showManual, setShowManual] = useState(false)
  const [manualType, setManualType] = useState('on')
  const [selectedEmp, setSelectedEmp] = useState("")
  const [otHours, setOtHours] = useState("")
  const [otReason, setOtReason] = useState("")

  const load = async ()=>{
    setLoading(true)
    try{
      const res = await fetch('/api/admin/attendance/today')
      const j = await res.json()
      if(j.success){
        setLive(j.live || [])
        setEmployees(j.employees || [])
        setStats(j.stats || {on_now:0, today_total:0, present_today:0, absent:0})
      }
    }catch(e){ console.log(e) }
    setLoading(false)
  }

  useEffect(()=>{ load() }, [])

  const doManual = async ()=>{
    if(!selectedEmp) return alert("اختار موظف")
    const body = { employee_id: selectedEmp, type: manualType }
    if(manualType === 'overtime'){
      if(!otHours) return alert("حط عدد الساعات")
      body.hours = parseFloat(otHours)
      body.reason = otReason
    }
    const res = await fetch('/api/admin/attendance/manual',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(body)
    })
    const j = await res.json()
    if(j.success){ setShowManual(false); setOtHours(""); setOtReason(""); load() }
    else alert(j.message || "فشل")
  }

  return (
    <div style={{
      minHeight:'100vh',
      background:'radial-gradient(1200px at 20% -10%, #1a0b2e 0%, #0a0a14 45%, #080811 100%)',
      fontFamily:'Cairo, sans-serif',
      padding:'24px',
      color:'white'
    }}>
      <div style={{maxWidth:'1200px', margin:'0 auto 24px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div>
          <h1 style={{fontSize:'24px', fontWeight:'800', marginBottom:'4px'}}>الدوام - مين الأون اليوم؟</h1>
          <div style={{width:'60px', height:'3px', background:'linear-gradient(90deg, #ec4899, #8b5cf6)', borderRadius:'10px'}}></div>
        </div>
        <button onClick={()=>setShowManual(true)} style={{
          background:'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
          padding:'10px 18px', borderRadius:'12px', border:'none', color:'white', fontWeight:'bold', cursor:'pointer',
          boxShadow:'0 8px 20px rgba(139,92,246,0.4)'
        }}>تحكم يدوي +</button>
      </div>

      <div style={{maxWidth:'1200px', margin:'0 auto 24px', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:'14px'}}>
        {[
          {label:'بالدوام هلا ON', value: stats.on_now, color:'#22c55e'},
          {label:'حاضر اليوم', value: stats.present_today, color:'#3b82f6'},
          {label:'غايب اليوم', value: stats.absent, color:'#ef4444'},
          {label:'مجموع ساعات اليوم', value: Number(stats.today_total).toFixed(1), color:'#a78bfa'},
        ].map((c,i)=>(
          <div key={i} style={{
            background:'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
            backdropFilter:'blur(20px)', borderRadius:'18px', padding:'18px',
            border:'1px solid rgba(255,255,255,0.08)', boxShadow:'0 10px 30px rgba(0,0,0,0.3)'
          }}>
            <div style={{fontSize:'13px', color:'rgba(255,255,255,0.6)', marginBottom:'8px'}}>{c.label}</div>
            <div style={{fontSize:'28px', fontWeight:'800', color:c.color}}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{maxWidth:'1200px', margin:'0 auto'}}>
        <div style={{
          background:'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
          backdropFilter:'blur(20px)', borderRadius:'24px', padding:'24px',
          border:'1px solid rgba(255,255,255,0.08)', boxShadow:'0 25px 60px rgba(0,0,0,0.4)'
        }}>
          <h3 style={{marginBottom:'16px', fontSize:'16px', fontWeight:'700'}}>🟢 بالدوام حاليا</h3>
          {loading ? <div style={{textAlign:'center', color:'rgba(255,255,255,0.5)', padding:'20px'}}>جاري التحميل...</div> :
          live.length===0 ? <div style={{textAlign:'center', color:'rgba(255,255,255,0.4)', padding:'30px', background:'rgba(0,0,0,0.2)', borderRadius:'12px'}}>ما في حدا ON هلا</div> :
          <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
            {live.map(row=>(
              <div key={row.id} style={{
                display:'flex', justifyContent:'space-between', alignItems:'center',
                background:'rgba(0,0,0,0.3)', padding:'14px 16px', borderRadius:'12px',
                border:'1px solid rgba(255,255,255,0.06)'
              }}>
                <div>
                  <div style={{fontWeight:'700', fontSize:'15px'}}>{row.full_name} <span style={{fontSize:'11px', background:'rgba(34,197,94,0.15)', color:'#4ade80', padding:'2px 8px', borderRadius:'20px', marginRight:'8px'}}>{row.department}</span></div>
                  <div style={{fontSize:'12px', color:'rgba(255,255,255,0.5)', marginTop:'4px'}}>دخل {new Date(row.clock_in).toLocaleTimeString('ar-LB')} - صرلو {Number(row.hours_now).toFixed(1)} ساعة {row.overtime_hours>0 && `+ ${row.overtime_hours} اضافي`}</div>
                </div>
                <div style={{display:'flex', gap:'8px'}}>
                  <button onClick={async()=>{
                    if(!confirm(`تسكت دوام ${row.full_name}؟`)) return
                    await fetch('/api/admin/attendance/manual',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({employee_id:row.employee_id, type:'off'})})
                    load()
                  }} style={{background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', color:'#fca5a5', padding:'8px 12px', borderRadius:'8px', cursor:'pointer', fontSize:'12px'}}>عملو OFF</button>
                </div>
              </div>
            ))}
          </div>
          }
        </div>
      </div>

      {showManual && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:'20px'}}>
          <div style={{
            background:'linear-gradient(180deg, #1e1e2e, #11111a)', borderRadius:'20px', padding:'24px', width:'420px',
            border:'1px solid rgba(255,255,255,0.1)', boxShadow:'0 25px 60px rgba(0,0,0,0.8)'
          }}>
            <h3 style={{marginBottom:'16px'}}>تحكم يدوي - Admin</h3>
            <div style={{display:'flex', gap:'8px', marginBottom:'16px'}}>
              {[
                {k:'on', l:'عملو ON'},
                {k:'off', l:'عملو OFF'},
                {k:'overtime', l:'زيد اوفرتايم'},
              ].map(t=>(
                <button key={t.k} onClick={()=>setManualType(t.k)} style={{
                  flex:1, padding:'10px', borderRadius:'10px', border:'1px solid', cursor:'pointer', fontSize:'13px',
                  background: manualType===t.k ? 'linear-gradient(135deg, #ec4899, #8b5cf6)' : 'rgba(255,255,255,0.05)',
                  borderColor: manualType===t.k ? 'transparent' : 'rgba(255,255,255,0.1)',
                  color:'white'
                }}>{t.l}</button>
              ))}
            </div>

            <select value={selectedEmp} onChange={e=>setSelectedEmp(e.target.value)} style={{
              width:'100%', padding:'12px', borderRadius:'10px', background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.1)', color:'white', marginBottom:'12px'
            }}>
              <option value="">اختار موظف</option>
              {employees.map(em=><option key={em.id} value={em.id}>{em.full_name} - {em.department}</option>)}
            </select>

            {manualType==='overtime' && (
              <>
                <input value={otHours} onChange={e=>setOtHours(e.target.value)} type="number" placeholder="عدد الساعات الاضافية مثلا 2" style={{
                  width:'100%', padding:'12px', borderRadius:'10px', background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.1)', color:'white', marginBottom:'12px'
                }}/>
                <input value={otReason} onChange={e=>setOtReason(e.target.value)} placeholder="السبب: تسليم طلبية متأخرة" style={{
                  width:'100%', padding:'12px', borderRadius:'10px', background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.1)', color:'white', marginBottom:'12px'
                }}/>
              </>
            )}

            <div style={{display:'flex', gap:'10px', marginTop:'16px'}}>
              <button onClick={()=>setShowManual(false)} style={{flex:1, padding:'12px', borderRadius:'10px', background:'rgba(255,255,255,0.08)', border:'none', color:'white', cursor:'pointer'}}>الغاء</button>
              <button onClick={doManual} style={{flex:1, padding:'12px', borderRadius:'10px', background:'linear-gradient(135deg, #ec4899, #8b5cf6)', border:'none', color:'white', cursor:'pointer', fontWeight:'bold'}}>تأكيد</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
