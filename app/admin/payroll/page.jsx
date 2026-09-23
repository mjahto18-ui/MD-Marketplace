"use client"
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react"

export default function PayrollPage(){
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [genLoading, setGenLoading] = useState(false)
  const [month, setMonth] = useState(new Date().toISOString().slice(0,7))
  const [showCode, setShowCode] = useState({})

  const load = async ()=>{
    setLoading(true)
    try{
      const res = await fetch(`/api/admin/payroll/list?month=${month}`)
      const j = await res.json()
      if(j.success) setRows(j.rows || [])
    }catch(e){ console.log(e) }
    setLoading(false)
  }

  useEffect(()=>{ load() }, [month])

  const generate = async ()=>{
    if(!confirm(`تحسب رواتب شهر ${month} لكل الموظفين؟`)) return
    setGenLoading(true)
    try{
      const res = await fetch('/api/admin/payroll/generate',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({month})
      })
      const j = await res.json()
      if(j.success){ alert(`تم توليد ${j.count} راتب`); load() }
      else alert(j.message || 'فشل')
    }catch(e){ alert('خطأ اتصال') }
    setGenLoading(false)
  }

  return (
    <div style={{
      minHeight:'100vh',
      background:'radial-gradient(1200px at 20% -10%, #1a0b2e 0%, #0a0a14 45%, #080811 100%)',
      fontFamily:'Cairo, sans-serif',
      padding:'24px',
      color:'white'
    }}>
      <div style={{maxWidth:'1200px', margin:'0 auto 24px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'12px'}}>
        <div>
          <h1 style={{fontSize:'24px', fontWeight:'800', marginBottom:'4px'}}>الرواتب - الكود الخماسي</h1>
          <div style={{width:'60px', height:'3px', background:'linear-gradient(90deg, #ec4899, #8b5cf6)', borderRadius:'10px', marginBottom:'8px'}}></div>
          <div style={{fontSize:'12px', color:'rgba(255,255,255,0.5)'}}>كل راتب له كود من 5 ارقام - الموظف يقبض به من محفظته</div>
        </div>
        <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
          <input type="month" value={month} onChange={e=>setMonth(e.target.value)} style={{
            padding:'10px 14px', borderRadius:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', color:'white'
          }}/>
          <button onClick={generate} disabled={genLoading} style={{
            background:'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
            padding:'10px 18px', borderRadius:'12px', border:'none', color:'white', fontWeight:'bold', cursor:'pointer',
            boxShadow:'0 8px 20px rgba(139,92,246,0.4)', opacity: genLoading?0.6:1
          }}>{genLoading?'عم يحسب...':'احسب رواتب الشهر'}</button>
        </div>
      </div>

      <div style={{maxWidth:'1200px', margin:'0 auto'}}>
        <div style={{
          background:'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
          backdropFilter:'blur(20px)', borderRadius:'24px', padding:'24px',
          border:'1px solid rgba(255,255,255,0.08)', boxShadow:'0 25px 60px rgba(0,0,0,0.4)'
        }}>
          {loading ? <div style={{textAlign:'center', padding:'30px', color:'rgba(255,255,255,0.5)'}}>جاري التحميل...</div> :
          rows.length===0 ? <div style={{textAlign:'center', padding:'30px', color:'rgba(255,255,255,0.4)', background:'rgba(0,0,0,0.2)', borderRadius:'12px'}}>ما في رواتب لهذا الشهر - اضغط احسب رواتب الشهر</div> :
          <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
            {rows.map(r=>(
              <div key={r.id} style={{
                display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'10px',
                background:'rgba(0,0,0,0.3)', padding:'14px 16px', borderRadius:'12px',
                border:'1px solid rgba(255,255,255,0.06)'
              }}>
                <div style={{minWidth:'200px'}}>
                  <div style={{fontWeight:'700', fontSize:'15px'}}>{r.employees?.full_name || r.employee_id} <span style={{fontSize:'11px', background:'rgba(139,92,246,0.15)', color:'#a78bfa', padding:'2px 8px', borderRadius:'20px', marginRight:'6px'}}>{r.employees?.department}</span></div>
                  <div style={{fontSize:'12px', color:'rgba(255,255,255,0.5)', marginTop:'4px'}}>
                    مجموع {r.total_hours || 0}س - اضافي {r.overtime_hours || 0}س | اساسي {Number(r.base_amount||0).toLocaleString()} + اضافي {Number(r.overtime_amount||0).toLocaleString()} = <b style={{color:'#22c55e'}}>{Number(r.amount||0).toLocaleString()} ل.ل</b>
                  </div>
                  {r.status==='claimed' && <div style={{fontSize:'11px', color:'#4ade80', marginTop:'4px'}}>مقبوض {new Date(r.claimed_at).toLocaleString('ar-LB')} بواسطة {r.claimed_by || ''}</div>}
                </div>
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:'10px', color:'rgba(255,255,255,0.4)'}}>كود القبض</div>
                    <div style={{
                      fontSize: showCode[r.id] ? '22px':'18px',
                      fontWeight:'800',
                      letterSpacing:'3px',
                      background: r.status==='claimed' ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)',
                      color: r.status==='claimed' ? '#4ade80' : 'white',
                      padding:'6px 14px',
                      borderRadius:'8px',
                      border:'1px dashed rgba(255,255,255,0.15)',
                      cursor:'pointer'
                    }} onClick={()=>setShowCode({...showCode, [r.id]:!showCode[r.id]})}>
                      {showCode[r.id] ? r.secret_code_5 : '*****'}
                    </div>
                  </div>
                  <div style={{
                    fontSize:'11px',
                    padding:'4px 10px',
                    borderRadius:'20px',
                    background: r.status==='claimed' ? 'rgba(34,197,94,0.2)' : 'rgba(251,191,36,0.15)',
                    color: r.status==='claimed' ? '#4ade80' : '#fbbf24',
                    border:'1px solid'
                  }}>{r.status==='claimed' ? 'مقبوض' : 'بانتظار القبض'}</div>
                </div>
              </div>
            ))}
          </div>
          }
        </div>
      </div>
    </div>
  )
}
