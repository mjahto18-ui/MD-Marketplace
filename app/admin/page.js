"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import Image from "next/image"

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
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1','').replace(/\/$/,'')
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (url && key) setSupabase(createClient(url, key))
  }, [])

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
    setLoading(true); setSelected(conf); setEditRow(null); setSidebarOpen(false)
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
    <div style={{display:'flex', minHeight:'100vh', background:'#080811', color:'white', fontFamily:'Cairo, sans-serif'}}>
      {/* Sidebar - Desktop */}
      <div className="admin-sidebar" style={{width:'220px', minWidth:'220px', background:'#0e0e1e', borderRight:'1px solid rgba(255,255,255,0.06)', height:'100vh', position:'sticky', top:0, overflowY:'auto', display:'flex', flexDirection:'column'}}>
        <div style={{padding:'18px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:'10px'}}>
          <div style={{width:'36px', height:'36px', borderRadius:'10px', overflow:'hidden'}}><Image src="/icon-dark.png" width={36} height={36} alt="logo" /></div>
          <div><div style={{fontWeight:'800', fontSize:'13px'}}>MD Marketplace</div><div style={{fontSize:'10px', opacity:0.4}}>ADMIN PANEL</div></div>
        </div>
        <div style={{padding:'12px 8px', flex:1}}>
          {TABLES_CONFIG.map(t=>(
            <button key={t.name} onClick={()=>loadTable(t)} style={{width:'100%', textAlign:'left', padding:'9px 10px', borderRadius:'10px', fontSize:'11.5px', background: selected.name===t.name?'linear-gradient(135deg, #ec4899, #8b5cf6)':'transparent', color: selected.name===t.name?'white':'rgba(255,255,255,0.5)', marginBottom:'2px', display:'flex', justifyContent:'space-between', alignItems:'center', border:'none', cursor:'pointer', fontWeight: selected.name===t.name?'600':'400'}}>
              <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{t.name}</span>
              {selected.name===t.name && <span style={{width:'6px', height:'6px', background:'white', borderRadius:'50%'}}></span>}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div style={{position:'fixed', inset:0, zIndex:40, display:'flex'}} className="mobile-only">
          <div onClick={()=>setSidebarOpen(false)} style={{flex:1, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)'}}></div>
          <div style={{width:'240px', background:'#0e0e1e', height:'100vh', overflowY:'auto'}}>
            <div style={{padding:'18px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'space-between'}}>
              <div style={{display:'flex', gap:'10px', alignItems:'center'}}><div style={{width:'36px', height:'36px', borderRadius:'10px', overflow:'hidden'}}><Image src="/icon-dark.png" width={36} height={36} alt="logo" /></div><div style={{fontWeight:'800', fontSize:'13px'}}>MD</div></div>
              <button onClick={()=>setSidebarOpen(false)} style={{background:'rgba(255,255,255,0.1)', border:'none', borderRadius:'8px', width:'30px', height:'30px', color:'white'}}>✕</button>
            </div>
            <div style={{padding:'12px 8px'}}>
              {TABLES_CONFIG.map(t=>(
                <button key={t.name} onClick={()=>loadTable(t)} style={{width:'100%', textAlign:'left', padding:'12px 10px', borderRadius:'10px', fontSize:'13px', background: selected.name===t.name?'linear-gradient(135deg, #ec4899, #8b5cf6)':'transparent', color: selected.name===t.name?'white':'rgba(255,255,255,0.6)', marginBottom:'3px', border:'none'}}>{t.name}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <div style={{flex:1, display:'flex', flexDirection:'column', minWidth:0}}>
        {/* Header */}
        <div style={{padding:'12px 16px', display:'flex', gap:'12px', alignItems:'center', background:'#0e0e1e', borderBottom:'1px solid rgba(255,255,255,0.06)', position:'sticky', top:0, zIndex:10, flexWrap:'wrap'}}>
          <button onClick={()=>setSidebarOpen(true)} className="mobile-only" style={{background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', padding:'8px 12px', color:'white'}}>☰</button>

          <div style={{fontWeight:'700', fontSize:'14px', display:'flex', alignItems:'center', gap:'8px'}}>
            <span style={{color:'rgba(255,255,255,0.4)'}}>Table /</span> {selected.name}
            <span style={{background:'rgba(255,255,255,0.08)', padding:'2px 8px', borderRadius:'20px', fontSize:'11px', marginLeft:'6px'}}>{filtered.length}</span>
          </div>

          <a href="/admin/pending" style={{marginLeft:'8px', background: pendingCount>0?'linear-gradient(135deg, #f59e0b, #ef4444)':'rgba(255,255,255,0.08)', color: pendingCount>0?'white':'rgba(255,255,255,0.7)', padding:'8px 14px', borderRadius:'10px', fontSize:'12px', fontWeight:'700', textDecoration:'none', display:'flex', alignItems:'center', gap:'8px', border:'1px solid rgba(255,255,255,0.08)'}}>
            🔔 Pending
            {pendingCount>0 && <span style={{background:'white', color:'#ef4444', borderRadius:'20px', minWidth:'20px', height:'20px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', padding:'0 6px'}}>{pendingCount}</span>}
          </a>

          <div style={{marginLeft:'auto', display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap'}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." style={{background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', padding:'8px 14px', width:'180px', color:'white', fontSize:'13px', outline:'none'}}/>
            <button onClick={()=>loadTable(selected)} style={{background:'rgba(255,255,255,0.08)', color:'white', padding:'8px 14px', borderRadius:'10px', fontSize:'12px', border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer'}}>↻</button>
            <button onClick={openAdd} style={{background:'linear-gradient(135deg, #22c55e, #16a34a)', color:'white', padding:'8px 14px', borderRadius:'10px', fontSize:'12px', fontWeight:'700', border:'none', cursor:'pointer'}}>+ إضافة</button>
            <button onClick={handleLogout} style={{background:'rgba(239,68,68,0.12)', color:'#fca5a5', border:'1px solid rgba(239,68,68,0.2)', padding:'8px 12px', borderRadius:'10px', fontSize:'12px', cursor:'pointer'}}>Logout</button>
          </div>
        </div>

        <div style={{flex:1, overflow:'auto', padding:'16px'}}>
          {loading? <div style={{padding:'40px', textAlign:'center', opacity:0.5}}>تحميل...</div> : (
            <div style={{background:'white', borderRadius:'16px', overflow:'hidden', boxShadow:'0 10px 30px rgba(0,0,0,0.3)'}}>
              <div style={{overflowX:'auto'}}>
              <table style={{width:'100%', color:'#1a1a1a', fontSize:'13px', borderCollapse:'collapse', minWidth:'500px'}}>
                <thead style={{background:'#0e0e1e', color:'white'}}><tr>
                  <th style={{padding:'14px 16px', textAlign:'left', fontWeight:'600', fontSize:'11px', opacity:0.7, letterSpacing:'0.5px'}}>{selected.key.toUpperCase()}</th>
                  <th style={{padding:'14px 16px', textAlign:'left', fontWeight:'600', fontSize:'11px', opacity:0.7}}>{selected.label.toUpperCase()}</th>
                  <th style={{padding:'14px 16px', textAlign:'center', fontWeight:'600', fontSize:'11px', opacity:0.7}}>IMAGE</th>
                  <th style={{padding:'14px 16px', textAlign:'center', fontWeight:'600', fontSize:'11px', opacity:0.7}}>ACTION</th>
                </tr></thead>
                <tbody>
                  {filtered.map((row,i)=>{
                    const img = row[selected.label2] || row['Image'] || row['Logo'] || row['Photo']
                    return (
                      <tr key={i} style={{borderBottom:'1px solid #f0f0f0', background: i%2===0? 'white' : '#fafaf9'}}>
                        <td style={{padding:'12px 16px', fontSize:'11px', color:'#888', fontFamily:'monospace'}}>{String(row[selected.key]||'').slice(0,24)}</td>
                        <td style={{padding:'12px 16px', fontWeight:'600', color:'#222'}}>{String(row[selected.label]||'').slice(0,60)}</td>
                        <td style={{padding:'8px', textAlign:'center'}}>{img?.startsWith('http')? <img src={img} style={{width:'38px', height:'38px', objectFit:'cover', borderRadius:'10px', margin:'0 auto', border:'1px solid #eee'}}/> : <span style={{opacity:0.2}}>—</span>}</td>
                        <td style={{padding:'8px', textAlign:'center'}}><button onClick={()=>openEdit(row)} style={{background:'#0e0e1e', color:'white', padding:'6px 14px', borderRadius:'8px', fontSize:'11px', border:'none', cursor:'pointer', fontWeight:'600'}}>تعديل</button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {editRow && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)', display:'flex', justifyContent:'flex-end', zIndex:50}}>
          <div style={{width:'460px', maxWidth:'90vw', background:'#12121f', color:'white', height:'100vh', overflowY:'auto', padding:'24px', borderLeft:'1px solid rgba(255,255,255,0.1)'}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px', alignItems:'center'}}><h3 style={{fontWeight:'800', fontSize:'16px'}}>{isAdding?'إضافة جديد':'تعديل'}</h3><button onClick={()=>setEditRow(null)} style={{background:'rgba(255,255,255,0.1)', padding:'6px 12px', borderRadius:'10px', border:'none', color:'white', cursor:'pointer'}}>✕</button></div>
            {Object.keys(formData).map(k=>(
              <div key={k} style={{marginBottom:'14px'}}><label style={{fontSize:'10px', fontWeight:'700', color:'rgba(255,255,255,0.4)', letterSpacing:'0.5px', textTransform:'uppercase', marginBottom:'6px', display:'block'}}>{k}</label><textarea value={formData[k]||''} onChange={e=>setFormData({...formData,[k]:e.target.value})} style={{width:'100%', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', padding:'10px 12px', fontSize:'13px', background:'rgba(0,0,0,0.3)', color:'white', outline:'none'}} rows={2}/></div>
            ))}
            <div style={{display:'flex', gap:'10px', marginTop:'24px'}}>
              <button onClick={handleSave} style={{flex:1, background:'linear-gradient(135deg, #ec4899, #8b5cf6)', color:'white', padding:'14px', borderRadius:'12px', fontWeight:'700', border:'none', cursor:'pointer'}}>حفظ التغييرات</button>
              {!isAdding && <button onClick={handleDelete} style={{background:'rgba(239,68,68,0.15)', color:'#fca5a5', border:'1px solid rgba(239,68,68,0.2)', padding:'14px 18px', borderRadius:'12px', cursor:'pointer'}}>حذف</button>}
            </div>
          </div>
        </div>
      )}
      <style>{`
        @media (max-width: 768px){
         .admin-sidebar{ display:none!important; }
         .mobile-only{ display:flex!important; }
        }
        @media (min-width: 769px){
         .mobile-only{ display:none!important; }
        }
      `}</style>
    </div>
  )
}
