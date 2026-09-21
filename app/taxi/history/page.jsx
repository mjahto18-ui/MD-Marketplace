'use client';
import { useEffect, useState } from 'react';

export default function HistoryPage(){
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState(null);

  useEffect(()=>{
    fetch('/api/me', {cache:'no-store', credentials:'include'}).then(r=>r.json()).then(d=>{
      if(d.user?.customerId){
        setCustomerId(d.user.customerId);
        loadHistory(d.user.customerId);
      } else setLoading(false);
    });
  }, []);

  const loadHistory = async (cid, page=1) => {
    setLoading(true);
    const res = await fetch(`/api/taxi/history?customer_id=${cid}&page=${page}&t=${Date.now()}`, {cache:'no-store', credentials:'include'}).then(r=>r.json()).catch(()=>({orders:[]}));
    setOrders(res.orders || []);
    setLoading(false);
  };

  const getStatusColor = (s) => {
    if(s==='completed') return {bg:'#dcfce7', color:'#16a34a', label:'مكتملة'};
    if(s==='cancelled') return {bg:'#fee2e2', color:'#dc2626', label:'ملغية'};
    return {bg:'#fef3c7', color:'#d97706', label:s};
  };

  if(loading) return <div style={{padding:20, textAlign:'center'}}>جاري تحميل سجل الرحلات...</div>;

  return (
    <div dir="rtl" style={{minHeight:'100vh', background:'#f8fafc', fontFamily:'Cairo'}}>
      <div style={{background:'#0a1930', color:'white', padding:'14px 16px', display:'flex', justifyContent:'space-between', position:'sticky', top:0, zIndex:10}}>
        <b>📜 سجل رحلاتي</b>
        <a href="/taxi" style={{color:'white', textDecoration:'none', fontSize:12, border:'1px solid rgba(255,255,255,0.3)', padding:'4px 10px', borderRadius:8}}>⬅ رجوع</a>
      </div>

      <div style={{maxWidth:480, margin:'0 auto', padding:12}}>
        {orders.length===0 && <div style={{background:'white', borderRadius:12, padding:30, textAlign:'center', opacity:0.5}}>لا يوجد رحلات سابقة</div>}

        {orders.map(o=>{
          const st = getStatusColor(o.status);
          return (
            <div key={o.id} style={{background:'white', borderRadius:16, padding:12, marginBottom:12, border:'1px solid #e5e7eb'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <span style={{fontWeight:900, fontSize:13}}>{o.order_code}</span>
                <span style={{background:st.bg, color:st.color, padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:900}}>{st.label}</span>
              </div>
              <div style={{fontSize:12, marginTop:8}}>
                <div>📍 من: {o.origin_name}</div>
                <div style={{marginTop:4}}>🎯 إلى: {o.dest_name}</div>
              </div>
              <div style={{display:'flex', justifyContent:'space-between', marginTop:8, fontSize:11, opacity:0.7}}>
                <span>{new Date(o.created_at).toLocaleString('ar-LB')}</span>
                <span>{o.distance_traveled} كم</span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between', marginTop:6, fontWeight:900, fontSize:13}}>
                <span>السائق: {o.taxi_name || '-'}</span>
                <span>{o.total_amount?.toLocaleString()} ل.ل</span>
              </div>
              <div style={{fontSize:11, marginTop:4, opacity:0.6}}>
                {o.taxi_car_type} - {o.taxi_plate_number} {o.taxi_engine_cc? `- ${o.taxi_engine_cc}cc` : ''} - {o.taxi_seats? `${o.taxi_seats} مقاعد` : ''}
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginTop:10}}>
                <button onClick={()=>window.location.href=`/taxi/share/${o.order_code}`} style={{padding:8, borderRadius:8, background:'#0a1930', color:'white', fontWeight:900, fontSize:11, border:'none'}}>👁 عرض الرحلة</button>
                <button onClick={()=>window.open(`https://wa.me/?text=${encodeURIComponent(`رحلتي ${o.order_code} من ${o.origin_name} الى ${o.dest_name} - ${o.total_amount} ل.ل`)}`,'_blank')} style={{padding:8, borderRadius:8, background:'#25D366', color:'white', fontWeight:900, fontSize:11, border:'none'}}>📤 مشاركة</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
