'use client';
import { useEffect, useState } from 'react';

export default function DriverHistory(){
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taxiId, setTaxiId] = useState(null);

  useEffect(()=>{
    // جرب باب الادمن اول، اذا ما لقى جرب باب الزباين - نفس مبدأ الباب
    fetch('/api/admin/me', {cache:'no-store', credentials:'include'}).then(r=>r.json()).then(d=>{
      const tid = d?.Taxi_ID || d?.taxiId || d?.relatedId;
      if(tid){
        setTaxiId(tid);
        loadHistory(tid);
      } else {
        // اذا فايت من الموقع الرئيسي
        fetch('/api/me', {cache:'no-store', credentials:'include'}).then(r=>r.json()).then(d2=>{
          const tid2 = d2.user?.taxiId || d2.user?.Taxi_ID;
          if(tid2){
            setTaxiId(tid2);
            loadHistory(tid2);
          } else setLoading(false);
        });
      }
    }).catch(()=>{
      fetch('/api/me', {cache:'no-store', credentials:'include'}).then(r=>r.json()).then(d=>{
        const tid = d.user?.taxiId || d.user?.Taxi_ID;
        if(tid){ setTaxiId(tid); loadHistory(tid); } else setLoading(false);
      });
    });
  }, []);

  const loadHistory = async (tid) => {
    setLoading(true);
    const res = await fetch(`/api/taxi/driver-history?taxi_id=${tid}&t=${Date.now()}`, {cache:'no-store', credentials:'include'}).then(r=>r.json()).catch(()=>({orders:[]}));
    setOrders(res.orders || []);
    setLoading(false);
  };

  if(loading) return <div style={{padding:20, textAlign:'center'}}>جاري تحميل سجل رحلاتك...</div>;

  const totalEarnings = orders.filter(o=>o.status==='completed').reduce((s,o)=>s+(o.driver_net || o.total_amount || 0), 0);

  return (
    <div dir="rtl" style={{minHeight:'100vh', background:'#f8fafc', fontFamily:'Cairo'}}>
      <div style={{background:'#0a1930', color:'white', padding:14, display:'flex', justifyContent:'space-between', position:'sticky', top:0}}>
        <b>📜 سجل رحلاتي كسائق</b>
        <a href="/taxi/driver" style={{color:'white', textDecoration:'none', fontSize:12, border:'1px solid rgba(255,255,255,0.3)', padding:'4px 10px', borderRadius:8}}>⬅ رجوع</a>
      </div>

      <div style={{maxWidth:480, margin:'0 auto', padding:12}}>
        <div style={{background:'white', borderRadius:12, padding:12, marginBottom:12, display:'flex', justifyContent:'space-between', border:'1px solid #e5e7eb'}}>
          <div style={{fontSize:12}}>عدد الرحلات المكتملة: <b>{orders.filter(o=>o.status==='completed').length}</b></div>
          <div style={{fontSize:12}}>اجمالي الارباح: <b>{totalEarnings.toLocaleString()} ل.ل</b></div>
        </div>

        {orders.length===0 && <div style={{background:'white', borderRadius:12, padding:30, textAlign:'center', opacity:0.5}}>لا يوجد رحلات سابقة</div>}

        {orders.map(o=>(
          <div key={o.id} style={{background:'white', borderRadius:16, padding:12, marginBottom:12, border:'1px solid #e5e7eb'}}>
            <div style={{display:'flex', justifyContent:'space-between'}}>
              <b style={{fontSize:13}}>{o.order_code}</b>
              <span style={{fontSize:11, background: o.status==='completed'?'#dcfce7':'#fee2e2', color: o.status==='completed'?'#16a34a':'#dc2626', padding:'2px 8px', borderRadius:20, fontWeight:900}}>{o.status==='completed'?'مكتملة':'ملغية'}</span>
            </div>
            <div style={{fontSize:12, marginTop:8}}>👤 الزبون: {o.customer_name} - {o.customer_phone}</div>
            <div style={{fontSize:12, marginTop:4}}>📍 من: {o.origin_name}</div>
            <div style={{fontSize:12, marginTop:4}}>🎯 الى: {o.dest_name}</div>
            <div style={{display:'flex', justifyContent:'space-between', marginTop:8, fontSize:11, opacity:0.7}}>
              <span>{new Date(o.created_at).toLocaleString('ar-LB')}</span>
              <span>{o.distance_traveled} كم</span>
            </div>
            <div style={{marginTop:6, fontWeight:900, fontSize:13, display:'flex', justifyContent:'space-between'}}>
              <span>الاجرة: {o.total_amount?.toLocaleString()} ل.ل</span>
              <span style={{color:'#16a34a'}}>صافي: {(o.driver_net || o.total_amount)?.toLocaleString()} ل.ل</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
