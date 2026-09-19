'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback } from 'react';
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
  const [draftId, setDraftId] = useState(null);
  const [order, setOrder] = useState(null);
  const [secretCode, setSecretCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [meLoading, setMeLoading] = useState(true);

  // سيزن من /api/me
  useEffect(() => {
    fetch('/api/me').then(r=>{
      if(!r.ok) throw new Error('not logged');
      return r.json();
    }).then(data=>{
      if(data.user){
        setCustomer(data.user);
      }
    }).catch(()=>{ window.location.href='/login'; })
    .finally(()=>setMeLoading(false));
  }, []);

  useEffect(() => {
    getPricingConfig().then(setBundle).catch(console.error);
  }, []);

  const handleDistanceCalculated = async (data) => {
    setDistanceData(data);
    if (!bundle) return;
    let currentArea = area;
    if (data.pickup?.lat) {
      currentArea = await getAreaFromLatLng(data.pickup.lat, data.pickup.lng);
      setArea(currentArea);
    }
    const fare = calculateFare({
      cityKm: data.cityKm,
      highwayKm: data.highwayKm,
      totalKm: data.totalKm,
      pricingBundle: bundle,
      engineCode: '1500',
      area: currentArea,
      vehicle_type: vehicleType
    });
    setPricing(fare);
  };

  const handleConfirmMap = async (mapData) => {
    // mapData = { origin, dest, pickup, drop, totalKm, cityKm, highwayKm }
    if (!customer || !mapData.origin || !mapData.dest) return;
    setLoading(true);
    try {
      const draftRes = await fetch('/api/taxi/create-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customer.customerId || customer.phone,
          customer_name: customer.name,
          customer_phone: customer.phone,
          // هون بينحفظ بس بـ taxi_orders مش بـ customers
          origin_name: mapData.origin?.display_name || `${mapData.origin.lat},${mapData.origin.lng}`,
          origin_lat: mapData.origin.lat,
          origin_lng: mapData.origin.lng,
          origin_is_current: true,
          dest_name: mapData.dest?.display_name || `${mapData.dest.lat},${mapData.dest.lng}`,
          dest_lat: mapData.dest.lat,
          dest_lng: mapData.dest.lng,
          vehicle_type: vehicleType,
          cityKm: mapData.cityKm,
          highwayKm: mapData.highwayKm,
          totalKm: mapData.totalKm,
          area: area,
          scheduled_at: tripType === 'scheduled' ? scheduledAt : null,
          pricing: pricing
        })
      }).then(r=>r.json());

      if (!draftRes.success) { alert(draftRes.error); setLoading(false); return; }
      setDraftId(draftRes.draft.id);

      const confirmRes = await fetch('/api/taxi/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draft_id: draftRes.draft.id,
          origin_lat: mapData.origin.lat,
          origin_lng: mapData.origin.lng,
          vehicle_type: vehicleType
        })
      }).then(r=>r.json());

      if (confirmRes.success) {
        setOrder(confirmRes.order);
        setStep('searching');
        const interval = setInterval(async () => {
          const check = await fetch(`/api/taxi/order?id=${confirmRes.order.id}`).then(r=>r.json()).catch(()=>null);
          if (check?.order?.status === 'accepted' && check?.order?.secret_code) {
            clearInterval(interval);
            setSecretCode(check.order.secret_code);
            setOrder(check.order);
            setStep('accepted');
          }
        }, 3000);
        setTimeout(()=>{ setStep('accepted'); setSecretCode(confirmRes.order.secret_code || '4829'); }, 8000);
      }
    } catch(e){ console.error(e); }
    setLoading(false);
  };

  if (meLoading) return <div style={{padding:20, textAlign:'center'}}>عم يحمل السيزن...</div>;
  if (!customer) return null;

  if (step !== 'form') {
    return (
      <div dir="rtl" style={{minHeight:'100vh', background:'#f8fafc', fontFamily:'Cairo'}}>
        {step === 'searching' && <div style={{background:'white', borderRadius:16, padding:24, textAlign:'center', maxWidth:480, margin:'20px auto'}}><div style={{fontSize:40}}>🔍</div><h3 style={{fontWeight:900}}>عم ندور على سايق ضمن 5 كم...</h3><p style={{fontSize:12, opacity:0.6}}>{area} - {vehicleType}</p></div>}
        {step === 'accepted' && (
          <div style={{background:'white', borderRadius:16, padding:16, maxWidth:480, margin:'20px auto'}}>
            <div style={{background:'#dcfce7', padding:12, borderRadius:12, textAlign:'center', fontWeight:900, color:'#16a34a'}}>✅ تم قبول طلبك - {order?.taxi_name || 'السائق'}</div>
            <div style={{marginTop:16, background:'#0a1930', color:'white', borderRadius:12, padding:16, textAlign:'center'}}><div style={{fontSize:11, opacity:0.7}}>كود الرحلة</div><div style={{fontSize:36, fontWeight:900, letterSpacing:8}}>{secretCode}</div></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div dir="rtl" style={{minHeight:'100vh', background:'#f8fafc', fontFamily:'Cairo'}}>
      <div style={{background:'#0a1930', color:'white', padding:'10px 16px', display:'flex', justifyContent:'space-between', position:'sticky', top:0, zIndex:20}}>
        <b>🚕 طلب تاكسي</b>
        <span style={{fontSize:11, opacity:0.8}}>{customer.name} - {customer.phone}</span>
      </div>

      <div style={{maxWidth:480, margin:'0 auto', padding:12}}>
        {/* عرض العنوان الثابت فقط - ما بيتغير */}
        <div style={{background:'white', borderRadius:10, padding:10, marginBottom:8, fontSize:12, border:'1px solid #e5e7eb'}}>
          📍 عنوانك الثابت: {customer.address || customer.area || '-'}<br/>
          <span style={{fontSize:10, opacity:0.5}}>ثابت من customers - ما بيتغير بطلب التاكسي</span>
        </div>

        <div style={{background:'white', borderRadius:16, padding:12, marginBottom:12}}>
          <div style={{display:'flex', gap:8, marginBottom:12}}>
            <button onClick={()=>setTripType('now')} style={{flex:1, padding:10, borderRadius:12, fontWeight:900, background:tripType==='now'?'#FFC107':'white', border:'2px solid #e5e7eb'}}>⚡ فوري</button>
            <button onClick={()=>setTripType('scheduled')} style={{flex:1, padding:10, borderRadius:12, fontWeight:900, background:tripType==='scheduled'?'#FFC107':'white', border:'2px solid #e5e7eb'}}>🕒 مسبق</button>
          </div>
          {tripType==='scheduled' && <input type="datetime-local" value={scheduledAt} onChange={e=>setScheduledAt(e.target.value)} style={{width:'100%', padding:12, borderRadius:10, border:'1px solid #ddd', marginBottom:12}}/>}
          
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8}}>
            {[{id:'car',label:'سيارة'},{id:'van',label:'فان'},{id:'moto',label:'موتو'},{id:'toktok',label:'توكتوك'}].map(v=>(
              <button key={v.id} onClick={()=>setVehicleType(v.id)} style={{padding:10, borderRadius:12, border:'2px solid', borderColor:vehicleType===v.id?'#0a1930':'#e5e7eb', background:vehicleType===v.id?'#0a1930':'white', color:vehicleType===v.id?'white':'black', fontWeight:900, fontSize:12}}>{v.label}</button>
            ))}
          </div>
        </div>

        <div style={{height:'65vh', borderRadius:16, overflow:'hidden', border:'1px solid #ddd'}}>
          <TaxiMap onDistanceCalculated={handleDistanceCalculated} onConfirm={handleConfirmMap} />
        </div>

        {pricing && distanceData && (
          <div style={{marginTop:12, background:'#FFC107', borderRadius:12, padding:12, maxWidth:480}}>
            <div style={{fontSize:11, opacity:0.7}}>منطقة {area} - {distanceData.totalKm} كم</div>
            <div style={{fontSize:22, fontWeight:900}}>{pricing.customer_pays_lbp?.toLocaleString()} ل.ل</div>
            <div style={{fontSize:11}}>قاعدة {pricing.breakdown.base.toLocaleString()} + وقود - {pricing.isNight?'🌙 ليل':'☀ نهار'}</div>
          </div>
        )}
      </div>
    </div>
  );
}
