'use client'
import { useState, useEffect } from 'react'

function format(n){
  if(n>=1000000) return Math.floor(n/1000000)+'M'
  if(n>=1000) return Math.floor(n/1000)+'K'
  return n
}

export default function KingsBoard(){
  const [data,setData]=useState(null)
  const [open,setOpen]=useState(false)

  useEffect(()=>{
    fetch('/api/leaderboard').then(r=>r.json()).then(setData)
  },[])

  if(!data?.top1) return null

  return (
    <>
      <div onClick={()=>setOpen(true)} style={{
        background: data.top1.color || '#111',
        color: '#fff',
        padding: '10px 16px',
        borderRadius: '12px',
        cursor: 'pointer',
        display: 'inline-flex',
        gap: '8px'
      }}>
        👑 {data.top1.display_name} - {data.top1.tier_name} - {format(data.top1.total_spent)}
      </div>

      {open && (
        <div onClick={()=>setOpen(false)} style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:999,
          display:'flex', justifyContent:'center', alignItems:'center'
        }}>
          <div onClick={e=>e.stopPropagation()} style={{
            background:'#1a1a1a', padding:'20px', borderRadius:'16px', width:'90%', maxWidth:'500px', maxHeight:'80vh', overflow:'auto', color:'#fff'
          }}>
            <h2 style={{marginBottom:'16px'}}>👑 ملوك المتجر</h2>
            {Object.entries(data.grouped).map(([slug, users])=>(
              <div key={slug} style={{marginBottom:'20px', borderBottom:'1px solid #333', paddingBottom:'12px'}}>
                <h3 style={{textTransform:'uppercase', marginBottom:'8px'}}>{slug}</h3>
                {users.length===0 ? <p style={{opacity:0.5}}>لا يوجد ملوك بعد</p> : 
                  users.map((u,i)=>(
                    <div key={u.customer_id} style={{display:'flex', justifyContent:'space-between', padding:'6px 0'}}>
                      <span>{i+1}. {u.display_name}</span>
                      <span>{format(u.total_spent)} - {u.points} نقطة</span>
                    </div>
                  ))
                }
              </div>
            ))}
            <button onClick={()=>setOpen(false)} style={{marginTop:'12px', width:'100%', padding:'10px', borderRadius:'8px'}}>إغلاق</button>
          </div>
        </div>
      )}
    </>
  )
}
