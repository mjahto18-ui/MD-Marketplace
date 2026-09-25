'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getPricingConfig, calculateFare } from '@/lib/taxi/pricingEngine';

const TaxiMap = dynamic(() => import('@/components/taxi/TaxiMap'), { ssr: false });
const TaxiActiveMap = dynamic(() => import('@/components/taxi/TaxiActiveMap'), { ssr: false });

const ENGINE_MAP = {
  car: '1500',
  van: '2500',
  moto: '150',
  toktok: '200',
};

const ENGINE_FALLBACK = {
  car: '1500',
  van: '2500',
  moto: 'moto',
  toktok: 'toktok',
};

function getEngineCode(vehicleType, bundle) {
  const primary = ENGINE_MAP[vehicleType];
  const fallback = ENGINE_FALLBACK[vehicleType];
  if (!bundle?.engines) return primary || '1500';
  if (bundle.engines[primary]) return primary;
  if (bundle.engines[fallback]) return fallback;
  const found = Object.values(bundle.engines).find(e => e.vehicle_type === vehicleType);
  if (found) return found.code;
  return '1500';
}

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
  const router = useRouter();
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
  const [showSos, setShowSos] = useState(false);
  const [sosComment, setSosComment] = useState('');
  const [nearbyDrivers, setNearbyDrivers] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const intervalRef = useRef(null);
  const isManualBackRef = useRef(false);
  const hasRedirected = useRef(false);

  const activeOrder = orders.find(o => o.id === activeOrderId) || orders[0] || null;

  useEffect(() => {
    localStorage.removeItem('taxi_pending_order');
    localStorage.removeItem('taxi_pending_orders');
    localStorage.removeItem('taxi_pending');
    localStorage.removeItem('taxi_orders');
    let cancelled = false;
    fetch('/api/me', { cache: 'no-store', credentials: 'include' })
 .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          if (!hasRedirected.current) {
            hasRedirected.current = true;
            router.replace('/login');
          }
          return;
        }
        const d = await res.json();
        // حماية جديدة - taxi ENUM
        if (d.user?.taxi!== 'yes') {
          if (!hasRedirected.current) {
            hasRedirected.current = true;
            if (d.user?.taxi === 'no') {
              alert('🔒 خدمة MD-TAXI   غير متاحة لحسابك -  تواصل مع فريق الدعم');
            }
            router.replace('/shop');
          }
          return;
        }
        if (d.user?.customerId) {
          setCustomer(d.user);
          fetchMyOrders(d.user.customerId);
        } else {
          if (!hasRedirected.current) {
            hasRedirected.current = true;
            router.replace('/shop');
          }
        }
      })
 .catch(() => {
        if (!hasRedirected.current) {
          hasRedirected.current = true;
          router.replace('/login');
        }
      })
 .finally(() => { if (!cancelled) setMeLoading(false); });
    return () => { cancelled = true; };
  }, [router]);

  const fetchMyOrders = async (cid) => {
    const id = cid || customer?.customerId || customer?.id;
    if(!id) return;
    const res = await fetch(`/api/taxi/my-orders?customer_id=${id}&t=${Date.now()}`, { cache: 'no-store', credentials: 'include' }).then(r=>r.json()).catch(()=>({orders:[]}));
    const activeOnly = (res.orders || []).filter(o =>!['cancelled','completed','expired'].includes(o.status));
    setOrders(activeOnly);
    if(activeOnly.length === 0){
      setStep('form');
      if(intervalRef.current) clearInterval(intervalRef.current);
    } else {
      const inProg = activeOnly.find(o => ['code_verified','in_progress'].includes(o.status));
      if(inProg &&!isManualBackRef.current){
        setActiveOrderId(inProg.id);
        setStep('in_progress');
      }
      startPolling(id);
    }
  };

  useEffect(() => { getPricingConfig().then(setBundle).catch(console.error); }, []);
  useEffect(() => { return () => { if(intervalRef.current) clearInterval(intervalRef.current); }; }, []);

  useEffect(() => {
    if (!distanceData ||!bundle) return;
    try {
      const engineCode = getEngineCode(vehicleType, bundle);
      const fare = calculateFare({
        cityKm: distanceData.cityKm,
        highwayKm: distanceData.highwayKm,
        totalKm: distanceData.totalKm,
        pricingBundle: bundle,
        engineCode,
        area,
        vehicle_type: vehicleType
      });
      setPricing(fare);
    } catch(e) { console.error('recalc fare error', e); }
  }, [vehicleType, area, distanceData, bundle]);

  const startPolling = (cid) => {
    if(intervalRef.current) clearInterval(intervalRef.current);
    const customerId = cid || customer?.customerId || customer?.id;
    if(!customerId) return;
    intervalRef.current = setInterval(async () => {
      if(isManualBackRef.current) return;
      const res = await fetch(`/api/taxi/my-orders?customer_id=${customerId}&t=${Date.now()}`, { cache: 'no-store', credentials: 'include' }).then(r=>r.json()).catch(()=>null);
      if(res){
        const activeOnly = (res.orders || []).filter(o =>!['cancelled','completed','expired'].includes(o.status));
        setOrders(activeOnly);
        if(activeOnly.length === 0){
          setStep('form');
          clearInterval(intervalRef.current);
          return;
        }
        const inProg = activeOnly.find(o => ['code_verified','in_progress'].includes(o.status));
        if(inProg){ setActiveOrderId(inProg.id); setStep('in_progress'); return; }
        const accepted = activeOnly.find(o => ['accepted','on_the_way','arrived'].includes(o.status));
        if(accepted){ setActiveOrderId(accepted.id); setStep('accepted'); }
      }
    }, 3000);
  };

  const fetchNearby = async (lat, lng, vType) => {
    if(!lat ||!lng) return;
    setNearbyLoading(true);
    try {
      const res = await fetch(`/api/taxi/nearby?lat=${lat}&lng=${lng}&vehicle_type=${vType}&t=${Date.now()}`, { cache: 'no-store' }).then(r=>r.json()).catch(()=>({drivers:[]}));
      setNearbyDrivers(res.drivers || []);
    } catch { setNearbyDrivers([]); }
    setNearbyLoading(false);
  };

  const handleDistanceCalculated = async (data) => {
    setDistanceData(data);
    if (!bundle) return;
    let currentArea = area;
    if (data.pickup?.lat) {
      currentArea = await getAreaFromLatLng(data.pickup.lat, data.pickup.lng);
      setArea(currentArea);
      fetchNearby(data.pickup.lat, data.pickup.lng, vehicleType);
    }
    try {
      const engineCode = getEngineCode(vehicleType, bundle);
      const fare = calculateFare({ cityKm: data.cityKm, highwayKm: data.highwayKm, totalKm: data.totalKm, pricingBundle: bundle, engineCode, area: currentArea, vehicle_type: vehicleType });
      setPricing(fare);
    } catch(e) { console.error('calc fare error', e); }
  };

  useEffect(() => {
    if(distanceData?.pickup?.lat) {
      fetchNearby(distanceData.pickup.lat, distanceData.pickup.lng, vehicleType);
    }
  }, [vehicleType]);

  const handleConfirmMap = async (mapData) => {
    if (!customer ||!mapData.origin ||!mapData.dest) return;
    if (tripType === 'scheduled' &&!scheduledAt) { alert('يرجى اختيار تاريخ ووقت الحجز المسبق'); return; }
    setLoading(true);
    try {
      const engineCode = getEngineCode(vehicleType, bundle);
      const draftRes = await fetch('/api/taxi/create-draft', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({
          origin_name: mapData.origin?.name || mapData.origin?.display_name,
          origin_display_name: mapData.origin?.display_name,
          origin_lat: mapData.origin.lat, origin_lng: mapData.origin.lng,
          dest_name: mapData.dest?.name || mapData.dest?.display_name,
          dest_display_name: mapData.dest?.display_name,
          dest_lat: mapData.dest.lat, dest_lng: mapData.dest.lng,
          vehicle_type: vehicleType,
          engine_code: engineCode,
          cityKm: mapData.cityKm, highwayKm: mapData.highwayKm, totalKm: mapData.totalKm, area,
          trip_type: tripType,
          scheduled_at: tripType === 'scheduled'? scheduledAt : null,
        })
      }).then(r=>r.json());
      if (!draftRes.success) { alert(draftRes.error || draftRes.message); setLoading(false); return; }

      const confirmRes = await fetch('/api/taxi/confirm', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({
          draft_id: draftRes.draft.id,
          origin_lat: mapData.origin.lat,
          origin_lng: mapData.origin.lng,
          vehicle_type: vehicleType,
          engine_code: engineCode,
          area
        })
      }).then(r=>r.json());

      if (confirmRes.success) {
        await fetchMyOrders();
        setActiveOrderId(confirmRes.order.id);
        setStep(confirmRes.isScheduled? 'scheduled' : 'searching');
        startPolling();
      } else {
        alert(confirmRes.error || 'فشل التأكيد');
      }
    } catch(e){ console.error(e); alert(e.message); }
    setLoading(false);
  };

  const handleCancel = async (orderId) => {
    const id = orderId || activeOrder?.id;
    if(!id ||!confirm('تأكيد إلغاء الرحلة!')) return;
    await fetch('/api/taxi/cancel', { method:'POST', headers:{'Content-Type':'application/json'}, credentials: 'include', body: JSON.stringify({order_id: id}) });
    setOrders(prev => prev.filter(o => o.id!== id));
    if(activeOrderId === id || orders.length <= 1){ setActiveOrderId(null); setStep('form'); }
    await fetchMyOrders();
  };

  const handleBackToMap = () => {
    isManualBackRef.current = true;
    if(intervalRef.current) clearInterval(intervalRef.current);
    setStep('form');
    setTimeout(()=>{ isManualBackRef.current = false; startPolling(); }, 5000);
  };

  const handleSos = async () => {
    if(!activeOrder ||!sosComment) return alert('يرجى كتابة ملخص');
    await fetch('/api/taxi/sos', { method:'POST', headers:{'Content-Type':'application/json'}, credentials: 'include', body: JSON.stringify({ order_id: activeOrder.id, comment: sosComment }) });
    alert('تم ارسال بلاغ SOS'); setShowSos(false); setSosComment('');
  };

  const handleShare = () => {
    const link = `${window.location.origin}/taxi/share/${activeOrder.order_code}/${activeOrder.id}`;
    const text = `تابع رحلتي رقم: ${activeOrder.order_code} - السائق: ${activeOrder.taxi_name} ${activeOrder.taxi_phone} - السيارة: ${activeOrder.taxi_car_type} ${activeOrder.taxi_plate_number} ${activeOrder.taxi_car_color} - الرابط: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (meLoading) return <div className="min-h-screen gradient-bg flex items-center justify-center" style={{padding:20, textAlign:'center', color:'white'}}>يتم التحميل...</div>;
  if (!customer) return null;

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const draftOrders = orders.filter(o => o.status === 'draft' && o.requested_start_at);
  const acceptedOrders = orders.filter(o => ['accepted','on_the_way','arrived'].includes(o.status));
  const inProgressOrders = orders.filter(o => ['code_verified','in_progress'].includes(o.status));

  const renderOrderCard = (o) => (
    <div key={o.id} style={{background:'#f8fafc', border:'1px solid #e5e7eb', borderRadius:12, padding:10, fontSize:12, marginBottom:10, width:'100%', maxWidth:'100%', wordBreak:'break-word', overflowWrap:'anywhere', boxSizing:'border-box'}}>
      <div>📍 من: {o.origin_name}</div>
      <div style={{marginTop:4}}>🎯 إلى: {o.dest_name}</div>
      <div style={{marginTop:8, display:'flex', justifyContent:'space-between', fontWeight:900}}>
        <span>{o.status === 'draft'? 'حجز مسبق' : o.status === 'pending'? 'السعر التقريبي' : 'السعر النهائي'}</span><span>{o.total_amount?.toLocaleString()} ل.ل - {o.distance_traveled} كم</span>
      </div>
      {o.status === 'draft' && <div style={{fontSize:11, marginTop:4}}>🕒 الموعد: {new Date(o.requested_start_at).toLocaleString('ar-LB')}</div>}
      {o.status === 'pending'? (
        <div style={{fontSize:10, opacity:0.6, marginTop:4}}>⚠ احتمالية تخفيض السعر عند موافقة السائق حسب المسار الفعلي والمسافة والمنطقة</div>
      ) : o.status === 'draft'? null : (
        <div style={{fontSize:10, marginTop:4, color:'#166534', background:'#dcfce7', padding:'6px 10px', borderRadius:8}}>✅ تم تثبيت السعر بناء على مواصفات سيارة السائق</div>
      )}
      <div style={{marginTop:10, background:'#0a1930', color:'white', borderRadius:10, padding:10, textAlign:'center'}}>
        <div style={{fontSize:9, opacity:0.7}}>🔒 رمز الرحلة - لا تشارك الرمز مع أحد غير السائق عندما يصل</div>
        <div style={{fontSize:28, fontWeight:900, letterSpacing:6, marginTop:4}}>{o.secret_code}</div>
      </div>
    </div>
  );

  if (step!== 'form') {
    return (
      <div dir="rtl" className="min-h-screen gradient-bg" style={{minHeight:'100vh', fontFamily:'Cairo', width:'100%', maxWidth:'100vw', overflowX:'hidden', boxSizing:'border-box'}}>
        {step === 'searching' && (
          <div style={{background:'white', borderRadius:16, padding:16, maxWidth:480, width:'100%', margin:'12px auto', boxSizing:'border-box', overflowX:'hidden'}}>
            <div style={{textAlign:'center'}}><div style={{fontSize:32}}>🔍</div><h3 style={{fontWeight:900, margin:'8px 0', wordBreak:'break-word'}}>طلباتك النشطة ({pendingOrders.length}) - يتم البحث على سائق ضمن 3 كم...</h3></div>
            <div style={{marginTop:12}}>{pendingOrders.map(o=>(
              <div key={o.id} style={{border:o.id===activeOrder?.id?'2px solid #0a1930':'1px solid #e5e7eb', borderRadius:12, padding:8, marginBottom:10, width:'100%', maxWidth:'100%', boxSizing:'border-box'}}>
                {renderOrderCard(o)}
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginTop:8}}>
                  <button onClick={()=>setActiveOrderId(o.id)} style={{padding:8, borderRadius:8, border:'1px solid #e5e7eb', background: activeOrderId===o.id? '#0a1930' : 'white', color: activeOrderId===o.id? 'white' : 'black', fontWeight:900, fontSize:11}}>{activeOrderId===o.id?'محدد':'تحديد'}</button>
                  <button onClick={()=>handleCancel(o.id)} style={{padding:8, borderRadius:8, background:'#fee2e2', color:'#dc2626', fontWeight:900, fontSize:11, border:'1px solid #fecaca'}}>❌ إلغاء الطلب</button>
                </div>
              </div>
            ))}
            {pendingOrders.length===0 && <div style={{textAlign:'center', opacity:0.5, fontSize:12}}>لا يوجد طلبات pending - الرجوع للخريطة</div>}
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:12}}>
              <button onClick={handleBackToMap} style={{padding:12, borderRadius:12, border:'1px solid #e5e7eb', background:'white', fontWeight:900, fontSize:13}}>⬅ الرجوع للخريطة</button>
              <button onClick={()=>window.location.href='/shop'} style={{padding:12, borderRadius:12, border:'1px solid #e5e7eb', background:'white', fontWeight:900, fontSize:13}}>🛒 المتجر</button>
            </div>
          </div>
        )}
        {step === 'scheduled' && (
          <div style={{background:'white', borderRadius:16, padding:16, maxWidth:480, width:'100%', margin:'12px auto', boxSizing:'border-box', overflowX:'hidden'}}>
            <div style={{textAlign:'center'}}><div style={{fontSize:32}}>🕒</div><h3 style={{fontWeight:900}}>حجوزاتك المسبقة ({draftOrders.length})</h3></div>
            <div style={{marginTop:12}}>{draftOrders.map(o=>(
              <div key={o.id} style={{border:'1px solid #e5e7eb', borderRadius:12, padding:8, marginBottom:10, width:'100%', boxSizing:'border-box'}}>
                {renderOrderCard(o)}
                <button onClick={()=>handleCancel(o.id)} style={{width:'100%', marginTop:8, padding:8, borderRadius:8, background:'#fee2e2', color:'#dc2626', fontWeight:900, fontSize:11}}>❌ إلغاء الحجز</button>
              </div>
            ))}</div>
            {draftOrders.length===0 && <div style={{textAlign:'center', opacity:0.5, fontSize:12}}>لا يوجد حجز مسبق</div>}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:12}}>
              <button onClick={handleBackToMap} style={{padding:12, borderRadius:12, border:'1px solid #e5e7eb', background:'white', fontWeight:900}}>⬅ الخريطة</button>
              <button onClick={()=>setStep('searching')} style={{padding:12, borderRadius:12, background:'#FFC107', fontWeight:900}}>🔍 طلبات فورية</button>
            </div>
          </div>
        )}
        {step === 'accepted' && (
          <div style={{background:'white', borderRadius:16, padding:16, maxWidth:480, width:'100%', margin:'12px auto', boxSizing:'border-box', overflowX:'hidden'}}>
            <div style={{background:'#dcfce7', padding:12, borderRadius:12, textAlign:'center', fontWeight:900, color:'#16a34a'}}>✅ تم قبول طلبك - {activeOrder?.taxi_name || acceptedOrders[0]?.taxi_name || 'السائق في الطريق'}</div>
            {acceptedOrders.map(o=> renderOrderCard(o))}
            {pendingOrders.length>0 && <div style={{fontSize:11, opacity:0.6, marginTop:8}}>عندك كمان {pendingOrders.length} طلب قيد البحث</div>}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:12}}>
              <button onClick={handleBackToMap} style={{padding:12, borderRadius:12, border:'1px solid #e5e7eb', background:'white', fontWeight:900}}>⬅ الخريطة</button>
              <button disabled style={{padding:12, borderRadius:12, background:'#dcfce7', color:'#166534', fontWeight:900, border:'1px solid #22c55e', cursor:'not-allowed'}}>🚕 السائق في طريقه اليك</button>
            </div>
          </div>
        )}
        {step === 'in_progress' && (
          <div style={{background:"white", borderRadius:16, padding:16, maxWidth:480, width:'100%', margin:"12px auto", boxSizing:'border-box', overflowX:'hidden'}}>
          <div style={{background:"#0a1930", color:"white", padding:12, borderRadius:12, textAlign:"center", fontWeight:900}}>🚕 الرحلة جارية - {activeOrder?.taxi_name} - {activeOrder?.taxi_plate_number}</div>
          <div style={{marginTop:12, height:320, borderRadius:12, overflow:"hidden", border:"1px solid #ddd", width:'100%', maxWidth:'100%'}}>
              <TaxiActiveMap myLocation={activeOrder?.taxi_lat_live? {lat: Number(activeOrder.taxi_lat_live), lng: Number(activeOrder.taxi_lng_live)} : null} origin_lat={activeOrder?.origin_lat} origin_lng={activeOrder?.origin_lng} dest_lat={activeOrder?.dest_lat} dest_lng={activeOrder?.dest_lng} />
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:12}}>
              <button onClick={()=>setShowSos(!showSos)} style={{padding:14, borderRadius:12, background:'#dc2626', color:'white', fontWeight:900}}>🆘 SOS</button>
              <button onClick={handleShare} style={{padding:14, borderRadius:12, background:'#25D366', color:'white', fontWeight:900}}>📤 مشاركة الرحلة</button>
            </div>
            {showSos && <div style={{marginTop:12, background:'#fee2e2', padding:12, borderRadius:12, border:'1px solid #fecaca'}}><textarea value={sosComment} onChange={e=>setSosComment(e.target.value)} placeholder="ماذا حصل" style={{width:'100%', padding:10, borderRadius:8, border:'1px solid #fecaca'}} rows={3}/><button onClick={handleSos} style={{marginTop:8, width:'100%', padding:10, borderRadius:8, background:'#dc2626', color:'white', fontWeight:900}}>ارسال البلاغ</button></div>}
            <div style={{marginTop:12, fontSize:12, background:'#f8fafc', padding:10, borderRadius:10, border:'1px solid #e5e7eb', wordBreak:'break-word'}}>
              <div>رقم الرحلة: {activeOrder?.order_code}</div>
              <div>التاريخ: {activeOrder?.created_at? new Date(activeOrder.created_at).toLocaleString('ar-LB') : ''}</div>
              <div>السيارة: {activeOrder?.taxi_car_type} - {activeOrder?.taxi_plate_number} - {activeOrder?.taxi_car_color}</div>
              <div>السائق: {activeOrder?.taxi_name} - {activeOrder?.taxi_phone}</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen gradient-bg" style={{minHeight:'100vh', fontFamily:'Cairo', width:'100%', maxWidth:'100vw', overflowX:'hidden', boxSizing:'border-box'}}>
      <div className="glass border-b border-white/10 p-4 sticky top-0 z-20" style={{background:'rgba(10,25,48,0.8)', backdropFilter:'blur(10px)', color:'white', padding:'10px 16px', display:'flex', justifyContent:'space-between', position:'sticky', top:0, zIndex:20, width:'100%', maxWidth:'100vw', boxSizing:'border-box'}}>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <a href="/shop" style={{fontSize:12, background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)', padding:'6px 12px', borderRadius:10, color:'white', textDecoration:'none', fontWeight:900, display:'flex', alignItems:'center', gap:4}}>⬅ المتجر</a>
          <b>🚕 طلب تاكسي</b>
        </div>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <a href="/taxi/history" style={{fontSize:11, background:'rgba(255,255,255,0.2)', padding:'4px 10px', borderRadius:8, color:'white', textDecoration:'none', fontWeight:900}}>📜 سجلي</a>
          <span style={{fontSize:11, opacity:0.8, maxWidth:80, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{customer.name} {orders.length>0?`(${orders.length} نشط)`:''}</span>
        </div>
      </div>

      <div style={{maxWidth:480, width:'100%', margin:'0 auto', padding:12, boxSizing:'border-box', overflowX:'hidden'}}>
        <div style={{background:'white', borderRadius:10, padding:10, marginBottom:8, fontSize:12, border:'1px solid #e5e7eb', width:'100%', boxSizing:'border-box', wordBreak:'break-word'}}>📍 عنوانك الثابت: {customer.address || customer.area || '-'}<br/><span style={{fontSize:10, opacity:0.5}}> لدينا عبر سجلاتنا </span></div>
        <div style={{background:'white', borderRadius:16, padding:12, marginBottom:12, width:'100%', boxSizing:'border-box'}}>
          <div style={{display:'flex', gap:8, marginBottom:12}}>
            <button onClick={()=>setTripType('now')} style={{flex:1, padding:10, borderRadius:12, fontWeight:900, background:tripType==='now'?'#FFC107':'white', border:'2px solid #e5e7eb'}}>⚡ فوري {pendingOrders.length>0?`(${pendingOrders.length})`:''}</button>
            <button onClick={()=>setTripType('scheduled')} style={{flex:1, padding:10, borderRadius:12, fontWeight:900, background:tripType==='scheduled'?'#FFC107':'white', border:'2px solid #e5e7eb'}}>🕒 مسبق {draftOrders.length>0?`(${draftOrders.length})`:''}</button>
          </div>
          {tripType==='scheduled' && <input type="datetime-local" value={scheduledAt} onChange={e=>setScheduledAt(e.target.value)} style={{width:'100%', padding:12, borderRadius:10, border:'1px solid #ddd', marginBottom:12, boxSizing:'border-box'}}/>}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
            {[{id:'car',label:'سيارة'},{id:'van',label:'فان'},{id:'moto',label:'موتو'},{id:'toktok',label:'توكتوك'}].map(v=>(
              <button key={v.id} onClick={()=>setVehicleType(v.id)} style={{padding:10, borderRadius:12, border:'2px solid', borderColor:vehicleType===v.id?'#0a1930':'#e5e7eb', background:vehicleType===v.id?'#0a1930':'white', color:vehicleType===v.id?'white':'black', fontWeight:900, fontSize:12}}>{v.label}</button>
            ))}
          </div>
        </div>
        <div style={{height:'60vh', width:'100%', maxWidth:'100%', borderRadius:16, overflow:'hidden', border:'1px solid #ddd', boxSizing:'border-box'}}><TaxiMap onDistanceCalculated={handleDistanceCalculated} onConfirm={handleConfirmMap} /></div>

        <div style={{marginTop:12, background:'white', borderRadius:16, padding:12, border:'1px solid #e5e7eb', width:'100%', boxSizing:'border-box', overflowX:'hidden'}}>
          <div style={{fontWeight:900, fontSize:13, marginBottom:8, wordBreak:'break-word'}}>🚕 السيارات القريبة ضمن 3 كم {nearbyLoading? '(جاري البحث...)': `(${nearbyDrivers.length})`}</div>
          {nearbyDrivers.length === 0 &&!nearbyLoading && <div style={{fontSize:12, opacity:0.5, textAlign:'center', padding:10}}>لا يوجد سيارات {vehicleType} قريبة حاليا - نعتذر عن التأخير</div>}
          {nearbyDrivers.map((d, idx) => (
            <div key={d.Taxi_ID || idx} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom: idx!== nearbyDrivers.length-1? '1px solid #f3f4f6' : 'none', fontSize:12, width:'100%', boxSizing:'border-box'}}>
              <div style={{flex:1, minWidth:0, overflow:'hidden'}}>
                <div style={{fontWeight:900, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{idx+1}. {d.full_name} - {d.car_type || d.vehicle_type}</div>
                <div style={{fontSize:11, opacity:0.7, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>المحرك: {d.engine_cc || '1500'} - اللوحة: {d.plate_number || '-'}</div>
              </div>
              <div style={{textAlign:'left', flexShrink:0, marginLeft:8}}>
                <div style={{fontWeight:900, color:'#0a1930'}}>{d.distance_km?.toFixed(2)} كم</div>
                <div style={{fontSize:10, color: d.is_online? '#16a34a' : '#9ca3af'}}>{d.is_online? '● متاح' : 'غير متاح'}</div>
              </div>
            </div>
          ))}
        </div>

       {orders.length>0 && (
       <div style={{marginTop:12, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, width:'100%', boxSizing:'border-box'}}>
       <button onClick={()=>setStep('searching')} style={{padding:10, borderRadius:10, background:'white', border:'1px solid #ddd', fontWeight:900, fontSize:12}}>🔍 طلباتي الفورية ({pendingOrders.length})</button>
       <button onClick={()=>setStep('scheduled')} style={{padding:10, borderRadius:10, background:'white', border:'1px solid #ddd', fontWeight:900, fontSize:12}}>🕒 حجوزاتي المسبقة ({draftOrders.length})</button>
    </div>
  )}

     <div style={{marginTop:8, width:'100%', boxSizing:'border-box'}}>
     <a href="/taxi/history" style={{display:'block', textAlign:'center', padding:12, borderRadius:12, background:'white', border:'1px solid #e5e7eb', fontWeight:900, fontSize:13, textDecoration:'none', color:'#0a1930', width:'100%', boxSizing:'border-box'}}>📜 عرض سجل الرحلات المكتملة والملغية</a>
    </div>

        {pricing && distanceData && (
          <div style={{marginTop:12, background:'#FFC107', borderRadius:12, padding:12, width:'100%', boxSizing:'border-box'}}><div style={{fontSize:11, opacity:0.7, wordBreak:'break-word'}}>منطقة {area} - {distanceData.totalKm} كم - محرك {getEngineCode(vehicleType, bundle)} - {tripType==='scheduled'?'مسبق':''}</div><div style={{fontSize:22, fontWeight:900}}>{pricing.customer_pays_lbp?.toLocaleString()} ل.ل</div><div style={{fontSize:10, opacity:0.6}}>احتمالية تغيير السعر عند الموافقة</div></div>
        )}

      </div>
    </div>
  );
}
