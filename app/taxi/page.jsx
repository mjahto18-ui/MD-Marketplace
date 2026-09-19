'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect, useRef } from 'react';
import { getPricingConfig, calculateFare } from '@/lib/taxi/pricingEngine';

const TaxiMap = dynamic(() => import('@/components/taxi/TaxiMap'), { ssr: false });

async function getAreaFromLatLng(lat, lng) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`);
    const data = await res.json();
    const s = `${data.address?.city || ''} ${data.address?.town || ''} ${data.address?.village || ''} ${data.display_name || ''}`.toLowerCase();
    if (s.includes('tripoli') || s.includes('طرابلس') || s.includes('القبة')) return 'tripoli';
    if (s.includes('akkar') || s.includes('عكار')) return 'akkar';
    if (s.includes('beirut') || s.includes('بيروت')) return 'beirut';
    return 'default';
  } catch { return 'default'; }
}

export default function Page() {
  const [step, setStep] = useState('form');
  const [customer, setCustomer] = useState(null);
  const [bundle, setBundle] = useState(null);
  const [area, setArea] = useState('default');
  const [distanceData, setDistanceData] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [vehicleType, setVehicleType] = useState('car');
  const [tripType, setTripType] = useState('now');
  const [scheduledAt, setScheduledAt] = useState('');
  const [orders, setOrders] = useState([]);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [meLoading, setMeLoading] = useState(true);
  const intervalRef = useRef(null);

  const activeOrder = orders.find(o => o.id === activeOrderId) || orders[0] || null;

  useEffect(() => {
    localStorage.removeItem('taxi_pending_order');
    localStorage.removeItem('taxi_pending_orders');
    localStorage.removeItem('taxi_pending');
    localStorage.removeItem('taxi_orders');
    fetch('/api/me', { cache: 'no-store' }).then(r=>{ if(!r.ok) throw new Error(); return r.json(); }).then(d=>{
      if(d.user) {
        setCustomer(d.user);
        fetchMyOrders(d.user.customerId || d.user.id);
      }
    }).catch(()=>{ window.location.href='/login'; }).finally(()=>setMeLoading(false));
  }, []);

  const fetchMyOrders = async (cid) => {
    const id = cid || customer?.customerId || customer?.id;
    if(!id) return;
    const res = await fetch(`/api/taxi/my-orders?customer_id=${id}&t=${Date.now()}`, { cache: 'no-store' }).then(r=>r.json()).catch(()=>({orders:[]}));
    const activeOnly = (res.orders || []).filter(o =>!['cancelled','completed','code_verified','expired'].includes(o.status));
    setOrders(activeOnly);
    if(activeOnly.length === 0){
      setStep('form');
      if(intervalRef.current) clearInterval(intervalRef.current);
    } else {
      startPolling(id);
    }
  };

  useEffect(() => { getPricingConfig().then(setBundle).catch(console.error); }, []);
  useEffect(() => { return () => { if(intervalRef.current) clearInterval(intervalRef.current); }; }, []);

  const startPolling = (cid) => {
    if(intervalRef.current) clearInterval(intervalRef.current);
    const customerId = cid || customer?.customerId || customer?.id;
    if(!customerId) return;
    intervalRef.current = setInterval(async () => {
      const res = await fetch(`/api/taxi/my-orders?customer_id=${customerId}&t=${Date.now()}`, { cache: 'no-store' }).then(r=>r.json()).catch(()=>null);
      if(res){
        const activeOnly = (res.orders || []).filter(o =>!['cancelled','completed','code_verified','expired'].includes(o.status));
        setOrders(activeOnly);
        if(activeOnly.length === 0){
          setStep('form');
          clearInterval(intervalRef.current);
          return;
        }
        const accepted = activeOnly.find(o => ['accepted','on_the_way','arrived'].includes(o.status));
        if(accepted){ setActiveOrderId(accepted.id); setStep('accepted'); }
      }
    }, 3000);
  };

  const handleDistanceCalculated = async (data) => {
    setDistanceData(data);
    if (!bundle) return;
    let currentArea = area;
    if (data.pickup?.lat) { currentArea = await getAreaFromLatLng(data.pickup.lat, data.pickup.lng); setArea(currentArea); }
    const fare = calculateFare({ cityKm: data.cityKm, highwayKm: data.highwayKm, totalKm: data.totalKm, pricingBundle: bundle, engineCode: '1500', area: currentArea, vehicle_type: vehicleType });
    setPricing(fare);
  };

  const handleConfirmMap = async (mapData) => {
    if (!customer ||!mapData.origin ||!mapData.dest) return;
    if (tripType === 'scheduled' &&!scheduledAt) { alert('اختار تاريخ ووقت الحجز المسبق'); return; }
    setLoading(true);
    try {
      const draftRes = await fetch('/api/taxi/create-draft', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: (customer.customerId || customer.id)?.toString(),
          customer_name: customer.name, customer_phone: customer.phone,
          origin_name: mapData.origin?.name || mapData.origin?.display_name,
          origin_display_name: mapData.origin?.display_name,
          origin_lat: mapData.origin.lat, origin_lng: mapData.origin.lng,
          dest_name: mapData.dest?.name || mapData.dest?.display_name,
          dest_display_name: mapData.dest?.display_name,
          dest_lat: mapData.dest.lat, dest_lng: mapData.dest.lng,
          vehicle_type: vehicleType, cityKm: mapData.cityKm, highwayKm: mapData.highwayKm, totalKm: mapData.totalKm, area,
          trip_type: tripType,
          scheduled_at: tripType === 'scheduled'? scheduledAt : null,
        })
      }).then(r=>r.json());
      if (!draftRes.success) { alert(draftRes.error); setLoading(false); return; }

      const confirmRes = await fetch('/api/taxi/confirm', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft_id: draftRes.draft.id, origin_lat: mapData.origin.lat, origin_lng: mapData.origin.lng, vehicle_type: vehicleType })
      }).then(r=>r.json());

      if (confirmRes.success) {
        await fetchMyOrders();
        setActiveOrderId(confirmRes.order.id);
        setStep(confirmRes.isScheduled? 'scheduled' : 'searching');
        startPolling();
      }
    } catch(e){ console.error(e); alert(e.message); }
    setLoading(false);
  };

  const handleCancel = async (orderId) => {
    const id = orderId || activeOrder?.id;
    if(!id ||!confirm('متأكد بدك تلغي الرحلة؟')) return;
    await fetch('/api/taxi/cancel', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({order_id: id}) });
    setOrders(prev => prev.filter(o => o.id!== id));
    if(activeOrderId === id || orders.length <= 1){ setActiveOrderId(null); setStep('form'); }
    await fetchMyOrders();
  };

  const handleBackToMap = () => setStep('form');

  if (meLoading) return <div style={{padding:20, textAlign:'center'}}>عم يحمل...</div>;
  if (!customer) return null;

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const draftOrders = orders.filter(o => o.status === 'draft' && o.requested_start_at);
  const acceptedOrders = orders.filter(o => ['accepted','on_the_way','arrived'].includes(o.status));

  const renderOrderCard = (o) => (
    <div key={o.id} style={{background:'#f8fafc', border:'1px solid #e5e7eb', borderRadius:12, padding:10, fontSize:12, marginBottom:10}}>
      <div>📍 من: {o.origin_name}</div>
      <div style={{marginTop:4}}>🎯 إلى: {o.dest_name}</div>
      <div style={{marginTop:8, display:'flex', justifyContent:'space-between', fontWeight:900}}>
        <span>{o.status === 'draft'? 'حجز مسبق' : 'السعر التقريبي'}</span><span>{o.total_amount?.toLocaleString()} ل.ل - {o.distance_traveled} كم</span>
      </div>
      {o.status === 'draft' && <div style={{fontSize:11, marginTop:4}}>🕒 الموعد: {new Date(o.requested_start_at).toLocaleString('ar-LB')}</div>}
      <div style={{fontSize:10, opacity:0.6, marginTop:4}}>⚠ احتمال السعر يتغير عند الموافقة حسب المسار الفعلي والانتظار والمنطقة</div>
      <div style={{marginTop:10, background:'#0a1930', color:'white', borderRadius:10, padding:10, textAlign:'center'}}>
        <div style={{fontSize:9, opacity:0.7}}>🔒 كود الرحلة - لا تشارك الرمز مع أحد إلا السائق عندما يصل</div>
        <div style={{fontSize:28, fontWeight:900, letterSpacing:6, marginTop:4}}>{o.secret_code}</div>
      </div>
    </div>
  );

  if (step!== 'form') {
    return (
      <div dir="rtl" style={{minHeight:'100vh', background:'#f8fafc', fontFamily:'Cairo'}}>
        {step === 'searching' && (
          <div style={{background:'white', borderRadius:16, padding:16, maxWidth:480, margin:'12px auto'}}>
            <div style={{textAlign:'center'}}><div style={{fontSize:32}}>🔍</div><h3 style={{fontWeight:900, margin:'8px 0'}}>طلباتك النشطة ({pendingOrders.length}) - عم ندور على سايق ضمن 5 كم...</h3></div>
            <div style={{marginTop:12}}>{pendingOrders.map(o=>(
              <div key={o.id} style={{border:o.id===activeOrder?.id?'2px solid #0a1930':'1px solid #e5e7eb', borderRadius:12, padding:8, marginBottom:10}}>
                {renderOrderCard(o)}
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginTop:8}}>
                  <button onClick={()=>setActiveOrderId(o.id)} style={{padding:8, borderRadius:8, border:'1px solid #e5e7eb', background: activeOrderId===o.id? '#0a1930' : 'white', color: activeOrderId===o.id? 'white' : 'black', fontWeight:900, fontSize:11}}>{activeOrderId===o.id?'محدد':'تحديد'}</button>
                  <button onClick={()=>handleCancel(o.id)} style={{padding:8, borderRadius:8, background:'#fee2e2', color:'#dc2626', fontWeight:900, fontSize:11, border:'1px solid #fecaca'}}>❌ إلغاء هيدا الطلب</button>
                </div>
              </div>
            ))}
            {pendingOrders.length===0 && <div style={{textAlign:'center', opacity:0.5, fontSize:12}}>ما في طلبات pending - رجاع للخريطة</div>}
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:12}}>
              <button onClick={handleBackToMap} style={{padding:12, borderRadius:12, border:'1px solid #e5e7eb', background:'white', fontWeight:900, fontSize:13}}>⬅ الرجوع للخريطة</button>
              <button onClick={()=>window.location.href='/shop'} style={{padding:12, borderRadius:12, border:'1px solid #e5e7eb', background:'white', fontWeight:900, fontSize:13}}>🛒 المتجر</button>
            </div>
          </div>
        )}
        {step === 'scheduled' && (
          <div style={{background:'white', borderRadius:16, padding:16, maxWidth:480, margin:'12px auto'}}>
            <div style={{textAlign:'center'}}><div style={{fontSize:32}}>🕒</div><h3 style={{fontWeight:900}}>حجوزاتك المسبقة ({draftOrders.length})</h3></div>
            <div style={{marginTop:12}}>{draftOrders.map(o=>(
              <div key={o.id} style={{border:'1px solid #e5e7eb', borderRadius:12, padding:8, marginBottom:10}}>
                {renderOrderCard(o)}
                <button onClick={()=>handleCancel(o.id)} style={{width:'100%', marginTop:8, padding:8, borderRadius:8, background:'#fee2e2', color:'#dc2626', fontWeight:900, fontSize:11}}>❌ إلغاء هيدا الحجز</button>
              </div>
            ))}</div>
            {draftOrders.length===0 && <div style={{textAlign:'center', opacity:0.5, fontSize:12}}>ما في حجوزات مسبقة</div>}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:12}}>
              <button onClick={handleBackToMap} style={{padding:12, borderRadius:12, border:'1px solid #e5e7eb', background:'white', fontWeight:900}}>⬅ الخريطة</button>
              <button onClick={()=>setStep('searching')} style={{padding:12, borderRadius:12, background:'#FFC107', fontWeight:900}}>🔍 طلبات فورية</button>
            </div>
          </div>
        )}
        {step === 'accepted' && (
          <div style={{background:'white', borderRadius:16, padding:16, maxWidth:480, margin:'12px auto'}}>
            <div style={{background:'#dcfce7', padding:12, borderRadius:12, textAlign:'center', fontWeight:900, color:'#16a34a'}}>✅ تم قبول طلبك - {activeOrder?.taxi_name || acceptedOrders[0]?.taxi_name || 'السائق في الطريق'}</div>
            {acceptedOrders.map(o=> renderOrderCard(o))}
            {pendingOrders.length>0 && <div style={{fontSize:11, opacity:0.6, marginTop:8}}>عندك كمان {pendingOrders.length} طلب قيد البحث</div>}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:12}}>
              <button onClick={handleBackToMap} style={{padding:12, borderRadius:12, border:'1px solid #e5e7eb', background:'white', fontWeight:900}}>⬅ الخريطة</button>
              <button onClick={()=>handleCancel(activeOrder?.id || acceptedOrders[0]?.id)} style={{padding:12, borderRadius:12, background:'#fee2e2', color:'#dc2626', fontWeight:900, border:'1px solid #fecaca'}}>❌ إلغاء</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div dir="rtl" style={{minHeight:'100vh', background:'#f8fafc', fontFamily:'Cairo'}}>
      <div style={{background:'#0a1930', color:'white', padding:'10px 16px', display:'flex', justifyContent:'space-between', position:'sticky', top:0, zIndex:20}}>
        <b>🚕 طلب تاكسي</b><span style={{fontSize:11, opacity:0.8}}>{customer.name} {orders.length>0?`(${orders.length} نشط)`:''}</span>
      </div>
      <div style={{maxWidth:480, margin:'0 auto', padding:12}}>
        <div style={{background:'white', borderRadius:10, padding:10, marginBottom:8, fontSize:12, border:'1px solid #e5e7eb'}}>📍 عنوانك الثابت: {customer.address || customer.area || '-'}<br/><span style={{fontSize:10, opacity:0.5}}>ثابت من customers</span></div>
        <div style={{background:'white', borderRadius:16, padding:12, marginBottom:12}}>
          <div style={{display:'flex', gap:8, marginBottom:12}}>
            <button onClick={()=>setTripType('now')} style={{flex:1, padding:10, borderRadius:12, fontWeight:900, background:tripType==='now'?'#FFC107':'white', border:'2px solid #e5e7eb'}}>⚡ فوري {pendingOrders.length>0?`(${pendingOrders.length})`:''}</button>
            <button onClick={()=>setTripType('scheduled')} style={{flex:1, padding:10, borderRadius:12, fontWeight:900, background:tripType==='scheduled'?'#FFC107':'white', border:'2px solid #e5e7eb'}}>🕒 مسبق {draftOrders.length>0?`(${draftOrders.length})`:''}</button>
          </div>
          {tripType==='scheduled' && <input type="datetime-local" value={scheduledAt} onChange={e=>setScheduledAt(e.target.value)} style={{width:'100%', padding:12, borderRadius:10, border:'1px solid #ddd', marginBottom:12}}/>}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
            {[{id:'car',label:'سيارة'},{id:'van',label:'فان'},{id:'moto',label:'موتو'},{id:'toktok',label:'توكتوك'}].map(v=>(
              <button key={v.id} onClick={()=>setVehicleType(v.id)} style={{padding:10, borderRadius:12, border:'2px solid', borderColor:vehicleType===v.id?'#0a1930':'#e5e7eb', background:vehicleType===v.id?'#0a1930':'white', color:vehicleType===v.id?'white':'black', fontWeight:900, fontSize:12}}>{v.label}</button>
            ))}
          </div>
        </div>
        <div style={{height:'60vh', borderRadius:16, overflow:'hidden', border:'1px solid #ddd'}}><TaxiMap onDistanceCalculated={handleDistanceCalculated} onConfirm={handleConfirmMap} /></div>
        {pricing && distanceData && (
          <div style={{marginTop:12, background:'#FFC107', borderRadius:12, padding:12}}><div style={{fontSize:11, opacity:0.7}}>منطقة {area} - {distanceData.totalKm} كم - {tripType==='scheduled'?'مسبق':''}</div><div style={{fontSize:22, fontWeight:900}}>{pricing.customer_pays_lbp?.toLocaleString()} ل.ل</div><div style={{fontSize:10, opacity:0.6}}>احتمال السعر يتغير عند الموافقة</div></div>
        )}
        {orders.length>0 && <div style={{marginTop:8, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}><button onClick={()=>setStep('searching')} style={{padding:10, borderRadius:10, background:'white', border:'1px solid #ddd', fontWeight:900, fontSize:12}}>🔍 طلباتي الفورية ({pendingOrders.length})</button><button onClick={()=>setStep('scheduled')} style={{padding:10, borderRadius:10, background:'white', border:'1px solid #ddd', fontWeight:900, fontSize:12}}>🕒 حجوزاتي المسبقة ({draftOrders.length})</button></div>}
      </div>
    </div>
  );
}
