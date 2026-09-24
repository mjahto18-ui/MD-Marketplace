'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { getPricingConfig, calculateFare } from '@/lib/taxi/pricingEngine';

const TaxiMap = dynamic(() => import('@/components/taxi/TaxiMap'), { ssr: false });

// بيجيب المنطقة من الاحداثيات
async function getAreaFromLatLng(lat, lng) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
      headers: { 'Accept-Language': 'ar' }
    });
    const data = await res.json();
    const city = (data.address?.city || data.address?.town || data.address?.village || '').toLowerCase();
    if (city.includes('beirut')) return 'beirut';
    if (city.includes('tripoli') || city.includes('طرابلس')) return 'tripoli';
    if (city.includes('akkar') || city.includes('عكار')) return 'akkar';
    if (city.includes('saida') || city.includes('صيدا')) return 'saida';
    return 'default';
  } catch {
    return 'default';
  }
}

export default function TaxiTest() {
  const [distance, setDistance] = useState(null);
  const [fare, setFare] = useState(null);
  const [bundle, setBundle] = useState(null);
  const [engineCode, setEngineCode] = useState('1500');
  const [area, setArea] = useState('default');

  useEffect(() => {
    getPricingConfig().then(b => {
      setBundle(b);
      // اذا 1200 مش موجود خد اول واحد
      if (!b.engines['1500'] && Object.keys(b.engines).length > 0) {
        setEngineCode(Object.keys(b.engines)[0]);
      }
    }).catch(console.error);
  }, []);

  const handleDistance = async (data) => {
    setDistance(data);
    if (!bundle) return;

    // 1. جيب المنطقة من نقطة الانطلاق
    let currentArea = area;
    if (data.pickup?.lat) {
      currentArea = await getAreaFromLatLng(data.pickup.lat, data.pickup.lng);
      setArea(currentArea);
    }

    // 2. احسب مع المنطقة
    const result = calculateFare({
     ...data,
      pricingBundle: bundle,
      engineCode: engineCode,
      area: currentArea,
      routeKey: 'default'
    });
    setFare(result);
  };

  return (
    <div className="w-full h-screen flex flex-col">
      {!bundle && <div className="p-3 bg-yellow-100 text-sm text-center">عم جيب التسعيرة (بنزين + محركات + فتحة مناطق)...</div>}

      {bundle && (
        <div className="p-2 bg-gray-100 flex gap-2 text-xs justify-center items-center">
          <span>تنكة: {bundle.fuel.tank_price_lbp.toLocaleString()} ل.ل</span>
          <span>|</span>
          <span className="font-bold">منطقة: {area}</span>
          <span>|</span>
          <span>فتحة: {(bundle.baseFares.find(f => f.area === area && bundle.engines[engineCode]?.vehicle_type === f.vehicle_type)?.base_fare_lbp || 150000).toLocaleString()}</span>
          <select value={engineCode} onChange={e => setEngineCode(e.target.value)} className="ml-2 border rounded px-2 py-1">
            {Object.keys(bundle.engines).map(code => (
              <option key={code} value={code}>{code} - {bundle.engines[code].vehicle_type} - {bundle.engines[code].consumption_l_per_km}L/km</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex-1">
        <TaxiMap
          onDistanceCalculated={handleDistance}
          onConfirm={() => alert(`الأجرة ${fare?.customer_pays_lbp.toLocaleString()} ل.ل - منطقة ${area}`)}
        />
      </div>

      {fare && distance && (
        <div className="p-3 bg-black text-white rounded-t-2xl -mt-4 z-[900] space-y-1">
          <div className="flex justify-between text-lg font-bold">
            <span>{distance.totalKm} كم ({distance.cityKm} بلد + {distance.highwayKm} أوتوستراد)</span>
            <span>{fare.customer_pays_lbp.toLocaleString()} ل.ل</span>
          </div>
          <div className="text-xs opacity-70 flex justify-between">
            <span>{fare.isNight? '🌙 ليل' : '☀ نهار'} - {fare.breakdown.vehicle_type} {fare.breakdown.engineCode} - {area} - فتحة {fare.breakdown.base.toLocaleString()}</span>
            <span>عمولتك: {fare.commission_lbp.toLocaleString()} ل.ل ({bundle.pricing.default_commission_percent}%)</span>
          </div>
          {fare.isCapped && <div className="text-xs text-orange-400">⚠ انطبق سقف {fare.capApplied.toLocaleString()} ل.ل</div>}
        </div>
      )}
    </div>
  );
}
