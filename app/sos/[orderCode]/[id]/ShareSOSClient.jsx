'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
const Map = dynamic(() => import('@/components/Map'), { ssr: false });

export default function ShareSOSClient({ orderCode, id }) {
  const [sos, setSos] = useState(null);
  const [ended, setEnded] = useState(false);
  const [loading, setLoading] = useState(true);
  const fullCode = `${orderCode}/${id}`;

  useEffect(() => {
    const fetchSOS = async () => {
      const res = await fetch(`/api/taxi/sos/share?code=${encodeURIComponent(fullCode)}&t=${Date.now()}`, { cache: 'no-store' }).then(r=>r.json()).catch(()=>null);
      if(res?.sos){
        setSos(res.sos);
        if(res.ended) setEnded(true);
      }
      setLoading(false);
    };
    fetchSOS();
    const i = setInterval(() => { if(!ended) fetchSOS(); }, 4000);
    return () => clearInterval(i);
  }, [fullCode, ended]);

  if(loading) return <div style={{padding:20, textAlign:'center'}}>جاري تحميل بلاغ الطوارئ...</div>;
  if(!sos) return <div style={{padding:20, textAlign:'center'}}>البلاغ غير موجود - {fullCode}</div>;

  if(ended || sos.status === 'closed'){
    return (
      <div dir="rtl" style={{minHeight:'100vh', background:'#f8fafc', fontFamily:'Cairo'}}>
        <div style={{background:'#dc2626', color:'white', padding:12, textAlign:'center', fontWeight:900}}>🚨 بلاغ {sos.order_code} - تم احتواؤه</div>
        <div style={{maxWidth:480, margin:'0 auto', padding:12}}>
          <div style={{background:'white', borderRadius:16, padding:20, textAlign:'center'}}>✅ تم إغلاق البلاغ<br/><span style={{fontSize:12, opacity:0.6}}>{sos.close_date? new Date(sos.close_date).toLocaleString('ar-LB') : ''}</span></div>
        </div>
      </div>
    );
  }

  const cLat = sos.customer_lat || sos.lat;
  const cLng = sos.customer_lng || sos.lng;
  const dLat = sos.taxi_lat_live || sos.driver_lat;
  const dLng = sos.taxi_lng_live || sos.driver_lng;

  return (
    <div dir="rtl" style={{minHeight:'100vh', background:'#0F0F0F', fontFamily:'Cairo', color:'white'}}>
      <div style={{background:'#dc2626', color:'white', padding:12, textAlign:'center', fontWeight:900}}>
        🚨 بلاغ طوارئ مباشر - {sos.order_code} - {sos.customer_name}
      </div>
      <div style={{maxWidth:480, margin:'0 auto', padding:12}}>
        <div style={{height:450, borderRadius:16, overflow:'hidden', border:'1px solid #333'}}>
          <Map lat={cLat} lng={cLng} customerLat={cLat} customerLng={cLng} driverLat={dLat} driverLng={dLng} />
        </div>
        <div style={{marginTop:12, background:'#1a1a1a', borderRadius:12, padding:12, fontSize:13, border:'1px solid #222'}}>
          <div>👤 الزبون: {sos.customer_name} - {sos.customer_phone}</div>
          <div>🚗 السائق: {sos.driver_name} - {sos.driver_phone} - {sos.plate_number}</div>
          <div style={{marginTop:6}}>💬 {sos.comment || 'لا يوجد تعليق'}</div>
          <div style={{marginTop:6, fontSize:11, opacity:0.5}}>آخر تحديث: {new Date(sos.updated_at || sos.created_at).toLocaleString('ar-LB')}</div>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:12}}>
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${dLat},${dLng}`} target="_blank" style={{padding:14, borderRadius:12, background:'white', color:'black', textAlign:'center', fontWeight:900, textDecoration:'none'}}>🚗 اذهب للسائق (حي)</a>
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${cLat},${cLng}`} target="_blank" style={{padding:14, borderRadius:12, background:'#dc2626', color:'white', textAlign:'center', fontWeight:900, textDecoration:'none'}}>👤 اذهب للزبون (حي)</a>
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${sos.origin_lat},${sos.origin_lng}`} target="_blank" style={{padding:10, borderRadius:12, background:'#222', color:'white', textAlign:'center', fontSize:12, textDecoration:'none'}}>📍 نقطة الانطلاق</a>
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${sos.dest_lat},${sos.dest_lng}`} target="_blank" style={{padding:10, borderRadius:12, background:'#222', color:'white', textAlign:'center', fontSize:12, textDecoration:'none'}}>🎯 نقطة الوصول</a>
        </div>
      </div>
    </div>
  );
}
