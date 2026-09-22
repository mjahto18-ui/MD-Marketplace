'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HistoryPage(){
  const router = useRouter();
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
    if(s==='completed') return {bg:'rgba(34,197,94,0.15)', color:'#4ade80', border:'rgba(34,197,94,0.3)', label:'مكتملة'};
    if(s==='cancelled') return {bg:'rgba(239,68,68,0.15)', color:'#f87171', border:'rgba(239,68,68,0.3)', label:'ملغية'};
    return {bg:'rgba(251,191,36,0.15)', color:'#fbbf24', border:'rgba(251,191,36,0.3)', label:s};
  };

  const handleBack = () => {
    if (window.history.length > 1) router.back();
    else router.push('/taxi');
  };

  if(loading) return <div className="min-h-screen gradient-bg flex items-center justify-center" style={{padding:20, textAlign:'center', color:'white'}}>جاري تحميل سجل الرحلات...</div>;

  return (
    <div dir="rtl" className="min-h-screen gradient-bg" style={{minHeight:'100vh', fontFamily:'Cairo', width:'100%', maxWidth:'100vw', overflowX:'hidden', boxSizing:'border-box'}}>
      {/* هيدر نفس الشوب */}
      <div className="glass border-b border-white/10 p-4 sticky top-0 z-20" style={{backdropFilter:'blur(10px)', background:'rgba(10,25,48,0.8)', color:'white', padding:'14px 16px', display:'flex', justifyContent:'space-between', position:'sticky', top:0, zIndex:10, width:'100%', maxWidth:'100vw', boxSizing:'border-box'}}>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <button onClick={handleBack} style={{fontSize:12, background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)', padding:'6px 12px', borderRadius:10, color:'white', fontWeight:900}}>⬅ رجوع</button>
          <b>📜 سجل رحلاتي</b>
        </div>
        <span style={{fontSize:11, opacity:0.6}}>{orders.length} رحلة</span>
      </div>

      <div style={{maxWidth:480, width:'100%', margin:'0 auto', padding:12, boxSizing:'border-box', overflowX:'hidden'}}>
        {orders.length===0 && <div className="glass border border-white/10 rounded-2xl" style={{borderRadius:16, padding:30, textAlign:'center', color:'rgba(255,255,255,0.5)'}}>لا يوجد رحلات سابقة</div>}

        {orders.map(o=>{
          const st = getStatusColor(o.status);
          return (
            <div key={o.id} className="glass border border-white/10" style={{borderRadius:16, padding:12, marginBottom:12, border:'1px solid rgba(255,255,255,0.1)', width:'100%', maxWidth:'100%', boxSizing:'border-box', overflowX:'hidden', wordBreak:'break-word', overflowWrap:'anywhere'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <span style={{fontWeight:900, fontSize:13, color:'white'}}>{o.order_code}</span>
                <span style={{background:st.bg, color:st.color, border:`1px solid ${st.border}`, padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:900}}>{st.label}</span>
              </div>
              <div style={{fontSize:12, marginTop:8, color:'rgba(255,255,255,0.8)'}}>
                <div style={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>📍 من: {o.origin_name}</div>
                <div style={{marginTop:4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>🎯 إلى: {o.dest_name}</div>
              </div>
              <div style={{display:'flex', justifyContent:'space-between', marginTop:8, fontSize:11, color:'rgba(255,255,255,0.5)'}}>
                <span>{new Date(o.created_at).toLocaleString('ar-LB')}</span>
                <span>{o.distance_traveled} كم</span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between', marginTop:6, fontWeight:900, fontSize:13, color:'white'}}>
                <span>السائق: {o.taxi_name || '-'}</span>
                <span>{o.total_amount?.toLocaleString()} ل.ل</span>
              </div>
              <div style={{fontSize:11, marginTop:4, color:'rgba(255,255,255,0.4)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                {o.taxi_car_type} - {o.taxi_plate_number} {o.taxi_engine_cc? `- ${o.taxi_engine_cc}cc` : ''} - {o.taxi_seats? `${o.taxi_seats} مقاعد` : ''}
              </div>
              {/* شلت المشاركة والمشاهدة متل ما اتفقنا - ارشيف نضيف */}
            </div>
          );
        })}
      </div>
    </div>
  );
}
