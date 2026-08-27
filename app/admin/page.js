"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const TABLES_CONFIG = [
  { name: "md_global_control", key: "key", label: "key" },
  { name: "messages", key: "Message ID", label: "Phone" },
  { name: "protection_cases", key: "Case ID", label: "Case ID" },
  { name: "broadcast", key: "Broadcast ID", label: "Broadcast ID" },
  { name: "webhook", key: "Webhook ID", label: "Title", label2: "Image" },
  { name: "push_queue", key: "Queue ID", label: "Image" },
  { name: "notification_templates", key: "Notification ID", label: "Code" },
  { name: "guestlogs", key: "Log Date", label: "Device Type" },
  { name: "asceses", key: "_RowNumber", label: "Role" },
  { name: "menu", key: "_RowNumber", label: "View", label2: "Photo" },
  { name: "product_base_data", key: "Product ID", label: "Product Name" },
  { name: "personas", key: "Name", label: "Name" },
  { name: "customers", key: "Customer ID", label: "Name" },
  { name: "users", key: "User ID", label: "Name" },
  { name: "drivers", key: "Driver ID", label: "Driver Name" },
  { name: "areas", key: "Area ID", label: "Area Name" },
  { name: "categories", key: "Category ID", label: "Category Name" },
  { name: "stores", key: "Store ID", label: "Store Name", label2: "Logo" },
  { name: "products", key: "Product ID", label: "Product Name" },
  { name: "delivery_rates", key: "Rate ID", label: "Area" },
  { name: "rewards", key: "Reward ID", label: "Reward ID" },
  { name: "reviews", key: "Review ID", label: "Review ID" },
  { name: "wallet_transactions", key: "Transaction ID", label: "Transaction ID" },
  { name: "driver_live_tracking", key: "Tracking ID", label: "Map Title v/c" },
  { name: "cart", key: "Cart ID", label: "Cart ID" },
  { name: "order_details", key: "Detail ID", label: "Product ID" },
  { name: "order_requuest", key: "Request ID", label: "Request ID" },
  { name: "orders_history", key: "Request ID", label: "Request ID" },
  { name: "dashboard", key: "Dashboard ID", label: "Dashboard ID" },
  { name: "custom_delivery", key: "Request ID", label: "الطلب" },
  { name: "bot_sessions", key: "Phone", label: "Last Activity" },
  { name: "new_arrivals", key: "New_Arrival_ID", label: "Image URL" },
]

export default function AdminDashboard() {
  const [supabase, setSupabase] = useState(null)
  const [selected, setSelected] = useState(TABLES_CONFIG[13])
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [editRow, setEditRow] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({})
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1','').replace(/\/$/,'')
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (url && key) setSupabase(createClient(url, key))
  }, [])

  // جلب عدد البندينغ
  useEffect(()=>{
    const fetchPending = async()=>{
      try{
        const r = await fetch('/api/admin/pending-orders')
        const d = await r.json()
        if(Array.isArray(d)) setPendingCount(d.length)
      }catch{}
    }
    fetchPending()
    const interval = setInterval(fetchPending, 30000)
    return ()=>clearInterval(interval)
  }, [])

  const loadTable = async (conf) => {
    if (!supabase) return
    setLoading(true); setSelected(conf); setEditRow(null)
    const { data } = await supabase.from(conf.name).select("*").limit(100)
    setData(data||[]); setLoading(false)
  }
  useEffect(()=>{ if(supabase) loadTable(selected) }, [supabase])

  const openEdit = (r) => { setEditRow(r); setFormData(r); setIsAdding(false) }
  const openAdd = () => {
    const empty = {}; if(data[0]) Object.keys(data[0]).forEach(k=>{ if(!['supa_id','_supa_synced_at','_RowNumber'].includes(k)) empty[k]='' })
    setFormData(empty); setIsAdding(true); setEditRow({})
  }
  const handleSave = async () => {
    const p = {...formData}; delete p.supa_id; delete p._supa_synced_at; delete p._RowNumber
    const res = isAdding? await supabase.from(selected.name).insert(p) : await supabase.from(selected.name).update(p).eq('supa_id', editRow.supa_id)
    if(!res.error){ setEditRow(null); loadTable(selected) } else alert(res.error.message)
  }
  const handleDelete = async () => {
    if(!confirm('تمحي؟')) return
    const { error } = await supabase.from(selected.name).delete().eq('supa_id', editRow.supa_id)
    if(!error){ setEditRow(null); loadTable(selected) }
  }

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    window.location.href = '/admin/login'
  }

  const filtered = data.filter(r =>!search || JSON.stringify(r).toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{display:'flex', minHeight:'100vh', background:'#0a1930', color:'white'}}>
      <div style={{flex:1, display:'flex', flexDirection:'column', minWidth:0, background:'#0a1930'}}>
        <div style={{padding:'10px 16px', display:'flex', gap:'12px', alignItems:'center', background:'#0a1930', borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
          <div style={{fontWeight:'bold'}}>MD Marketplace (32)</div>

          {/* كبسة البندينغ مع الجرس */}
          <a href="/admin/pending" style={{marginLeft:'20px', background: pendingCount>0?'#f59e0b':'rgba(255,255,255,0.1)', color: pendingCount>0?'black':'white', padding:'6px 14px', borderRadius:'8px', fontSize:'12px', fontWeight:'bold', textDecoration:'none', display:'flex', alignItems:'center', gap:'6px', position:'relative'}}>
            <span>🔔 Pending Orders</span>
            {pendingCount>0 && <span style={{background:'#ef4444', color:'white', borderRadius:'50%', width:'18px', height:'18px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:'bold'}}>{pendingCount}</span>}
          </a>

          <div style={{marginLeft:'auto', display:'flex', gap:'8px', alignItems:'center'}}>
            <button onClick={()=>loadTable(selected)} style={{background:'white', color:'black', padding:'6px 14px', borderRadius:'8px', fontSize:'12px'}}>Reload</button>
            <button onClick={openAdd} style={{background:'#22c55e', color:'white', padding:'6px 14px', borderRadius:'8px', fontSize:'12px', fontWeight:'bold'}}>+ إضافة</button>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." style={{background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'8px', padding:'6px 12px', width:'160px', color:'white', fontSize:'12px'}}/>
            <div style={{fontSize:'12px', opacity:0.7}}>{selected.name} ({filtered.length})</div>
            <div style={{width:'1px', height:'20px', background:'rgba(255,255,255,0.15)', margin:'0 4px'}}></div>
            <button onClick={handleLogout} style={{background:'rgba(239,68,68,0.15)', color:'#fca5a5', border:'1px solid rgba(239,68,68,0.3)', padding:'6px 12px', borderRadius:'8px', fontSize:'12px', fontWeight:'bold', cursor:'pointer'}}>Logout</button>
          </div>
        </div>

        <div style={{flex:1, overflow:'auto', padding:'12px'}}>
          {loading? <div style={{padding:'20px'}}>تحميل...</div> : (
            <table style={{width:'100%', background:'#f3f1ec', color:'#1a1a1a', borderRadius:'10px', overflow:'hidden', fontSize:'13px', borderCollapse:'collapse'}}>
              <thead style={{background:'#0e2242', color:'white'}}><tr>
                <th style={{padding:'10px', textAlign:'left', width:'25%'}}>User ID</th>
                <th style={{padding:'10px', textAlign:'left'}}>Name</th>
                <th style={{padding:'10px', textAlign:'center', width:'80px'}}>صورة</th>
                <th style={{padding:'10px', textAlign:'center', width:'80px'}}>اجراء</th>
              </tr></thead>
              <tbody>
                {filtered.map((row,i)=>{
                  const img = row[selected.label2] || row['Image'] || row['Logo'] || row['Photo']
                  return (
                    <tr key={i} style={{borderBottom:'1px solid #e5ddd1', background: i%2===0? '#f3f1ec' : '#ece8df'}}>
                      <td style={{padding:'10px', fontSize:'11px', color:'#555'}}>{String(row[selected.key]||'').slice(0,20)}</td>
                      <td style={{padding:'10px', fontWeight:'600'}}>{String(row[selected.label]||'').slice(0,60)}</td>
                      <td style={{padding:'8px', textAlign:'center'}}>{img?.startsWith('http')? <img src={img} style={{width:'32px', height:'32px', objectFit:'cover', borderRadius:'6px', margin:'0 auto'}}/> : ''}</td>
                      <td style={{padding:'8px', textAlign:'center'}}><button onClick={()=>openEdit(row)} style={{background:'#2563eb', color:'white', padding:'4px 12px', borderRadius:'6px', fontSize:'11px'}}>تعديل</button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div style={{width:'190px', minWidth:'190px', background:'#0e2242', borderLeft:'1px solid rgba(255,255,255,0.08)', height:'100vh', position:'sticky', top:0, overflowY:'auto'}}>
        <div style={{padding:'12px 10px'}}>
          {TABLES_CONFIG.map(t=>(
            <button key={t.name} onClick={()=>loadTable(t)} style={{width:'100%', textAlign:'left', padding:'7px 8px', borderRadius:'6px', fontSize:'11px', background: selected.name===t.name?'#2563eb':'transparent', color: selected.name===t.name?'white':'rgba(255,255,255,0.55)', marginBottom:'1px', display:'block'}}>{t.name}</button>
          ))}
        </div>
      </div>

      {editRow && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', justifyContent:'flex-end', zIndex:50}}>
          <div style={{width:'440px', background:'#f3f1ec', color:'black', height:'100vh', overflowY:'auto', padding:'20px'}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'16px'}}><h3 style={{fontWeight:'bold'}}>{isAdding?'إضافة':'تعديل'}</h3><button onClick={()=>setEditRow(null)} style={{background:'#e5ddd1', padding:'4px 10px', borderRadius:'6px'}}>X</button></div>
            {Object.keys(formData).map(k=>(
              <div key={k} style={{marginBottom:'10px'}}><label style={{fontSize:'10px', fontWeight:'bold', color:'#777'}}>{k}</label><textarea value={formData[k]||''} onChange={e=>setFormData({...formData,[k]:e.target.value})} style={{width:'100%', border:'1px solid #d6cec0', borderRadius:'6px', padding:'6px', fontSize:'13px', background:'white'}} rows={2}/></div>
            ))}
            <div style={{display:'flex', gap:'8px', marginTop:'20px'}}>
              <button onClick={handleSave} style={{flex:1, background:'#2563eb', color:'white', padding:'12px', borderRadius:'10px', fontWeight:'bold'}}>حفظ</button>
              {!isAdding && <button onClick={handleDelete} style={{background:'#dc2626', color:'white', padding:'12px 18px', borderRadius:'10px'}}>حذف</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
