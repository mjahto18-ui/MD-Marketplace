'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
const TaxiActiveMap = dynamic(() => import('@/components/taxi/TaxiActiveMap'), { ssr: false });

export default function ShareClient({ orderCode, id }) {
  const [order, setOrder] = useState(null);
  const [ended, setEnded] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const fullCode = `${orderCode}/${id}`;

  useEffect(() => {
    const fetchOrder = async () => {
      const res = await fetch(`/api/taxi/share?code=${encodeURIComponent(fullCode)}&t=${Date.now()}`, { cache: 'no-store' }).then(r=>r.json()).catch(()=>null);
      if(res?.order){
        setOrder(res.order);
        if(res.ended){
          setEnded(true);
        }
      }
      setLoading(false);
    };
    fetchOrder();
    const i = setInterval(() => {
      if(ended) return;
      fetchOrder();
    }, 4000);
    return () => clearInterval(i);
  }, [fullCode, ended]);

  if(loading) return <div style={{padding:20, textAlign:'center'}}>جاري تحميل الرحلة...</div>;
  if(!order) return <div style={{padding:20, textAlign:'center'}}>الرحلة غير موجودة - {fullCode}</div>;

  // اذا انتهت - متل الصورة يلي بعتها بس مع رسالة انتهت
  if(ended || order.status === 'completed' || order.status === 'cancelled'){
    return (
      <div dir="rtl" style={{minHeight:'100vh', background:'#f8fafc', fontFamily:'Cairo'}}>
        <div style={{background:'#0a1930', color:'white', padding:12, textAlign:'center', fontWeight:900}}>
          🚕 رحلة {order.order_code}
        </div>
        <div style={{maxWidth:480, margin:'0 auto', padding:12}}>
          <div style={{background:'white', borderRadius:16, padding:20, textAlign:'center', border:'1px solid #e5e7eb'}}>
            <div style={{fontSize:50}}>✅</div>
            <div style={{fontWeight:900, fontSize:18, marginTop:10}}>
              {order.status === 'completed' ? 'انتهت الرحلة' : 'الرحلة ملغاة'}
            </div>
            <div style={{fontSize:13, opacity:0.7, marginTop:6}}>{order.origin_name} → {order.dest_name}</div>
            <div style={{fontSize:11, opacity:0.5, marginTop:4}}>انتهت: {new Date(order.actual_end_at || order.updated_at).toLocaleString('ar-LB')}</div>
          </div>

          <div style={{marginTop:12, background:'white', borderRadius:12, padding:12, border:'1px solid #e5e7eb', fontSize:13}}>
            <div>📍 من: {order.origin_name}</div>
            <div style={{marginTop:6}}>🎯 إلى: {order.dest_name}</div>
            <div style={{marginTop:6}}>🚗 السيارة: {order.taxi_car_type} - {order.taxi_plate_number} - {order.taxi_car_color || ''}</div>
            <div>👨‍✈️ السائق: {order.taxi_name} - {order.taxi_phone}</div>
            <div style={{marginTop:6}}>الحالة: {order.status}</div>
          </div>
        </div>
      </div>
    );
  }

  // اذا لساتها شغالة - نفس تصميمك القديم
  return (
    <div dir="rtl" style={{minHeight:'100vh', background:'#f8fafc', fontFamily:'Cairo'}}>
      <div style={{background:'#0a1930', color:'white', padding:12, textAlign:'center', fontWeight:900}}>
        🚕 تتبع رحلة {order.order_code} - {order.taxi_name}
      </div>
      <div style={{maxWidth:480, margin:'0 auto', padding:12}}>
        <div style={{height:400, borderRadius:16, overflow:'hidden', border:'1px solid #ddd'}}>
          <TaxiActiveMap
            myLocation={order.taxi_lat_live? {lat: Number(order.taxi_lat_live), lng: Number(order.taxi_lng_live)} : null}
            origin_lat={order.origin_lat} origin_lng={order.origin_lng}
            dest_lat={order.dest_lat} dest_lng={order.dest_lng}
          />
        </div>
        <div style={{marginTop:12, background:'white', borderRadius:12, padding:12, border:'1px solid #e5e7eb', fontSize:13}}>
          <div>📍 من: {order.origin_name}</div>
          <div style={{marginTop:6}}>🎯 إلى: {order.dest_name}</div>
          <div style={{marginTop:6}}>🚗 السيارة: {order.taxi_car_type} - {order.taxi_plate_number} - {order.taxi_car_color || ''}</div>
          <div>👨‍✈️ السائق: {order.taxi_name} - {order.taxi_phone}</div>
          <div style={{marginTop:6}}>الحالة: {order.status} - {order.taxi_status}</div>
          <div style={{marginTop:6, fontSize:11, opacity:0.6}}>اخر تحديث: {new Date(order.updated_at).toLocaleString('ar-LB')}</div>
        </div>
        <a href={`tel:${order.taxi_phone}`} style={{display:'block', marginTop:12, padding:14, borderRadius:12, background:'#0a1930', color:'white', textAlign:'center', fontWeight:900, textDecoration:'none'}}>📞 اتصال بالسائق</a>
      </div>
    </div>
  );
}
