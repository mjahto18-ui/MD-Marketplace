// components/KingsBoard.jsx
'use client'
import { useEffect, useState } from 'react'

function formatMoney(n){
  if(n>=1000000) return (n/1000000).toFixed(0)+'M'
  if(n>=1000) return (n/1000).toFixed(0)+'K'
  return n
}

export default function KingsBoard({ onClick }) {
  const [data,setData] = useState(null)
  
  useEffect(()=>{
    fetch('/api/leaderboard').then(r=>r.json()).then(setData)
  },[])

  if(!data?.top1) return <div>جاري التحميل...</div>

  // برا - أعلى 1
  return (
    <div onClick={onClick} style={{cursor:'pointer', background: data.top1.color, padding: '10px 16px', borderRadius: '12px'}}>
      👑 {data.top1.display_name} - {data.top1.tier_name} - {formatMoney(data.top1.total_spent)}
    </div>
  )
}

// ولما يكبس - اعرض هاد المودال
export function KingsModal({ data }) {
  if(!data) return null
  return (
    <div>
      {Object.entries(data.grouped).map(([slug, users])=>(
        <div key={slug} style={{marginBottom: '16px'}}>
          <h3>{slug.toUpperCase()} ({users.length})</h3>
          {users.length===0 ? <p>لا يوجد ملوك بعد</p> : 
            users.map((u,i)=>(
              <div key={u.customer_id}>{i+1}. {u.display_name} - {formatMoney(u.total_spent)}</div>
            ))
          }
        </div>
      ))}
    </div>
  )
}
