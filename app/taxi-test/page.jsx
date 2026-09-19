'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { getPricingConfig, calculateFare } from '@/lib/taxi/pricingEngine';

const TaxiMap = dynamic(() => import('@/components/taxi/TaxiMap'), { ssr: false });

export default function TaxiTest() {
  const [distance, setDistance] = useState(null);
  const [fare, setFare] = useState(null);
  const [bundle, setBundle] = useState(null);
  const [engineCode, setEngineCode] = useState('1200');

  useEffect(() => {
    getPricingConfig().then(setBundle).catch(console.error);
  }, []);

  const handleDistance = (data) => {
    setDistance(data);
    if (!bundle) return;

    const result = calculateFare({
     ...data,
      pricingBundle: bundle, // مش pricingConfig
      engineCode: engineCode, // مش engineCC
      routeKey: 'default'
    });
    setFare(result);
  };

  return (
    <div className="w-full h-screen flex flex-col">
      {!bundle && <div className="p-3 bg-yellow-100 text-sm text-center">عم جيب التسعيرة (بنزين + محركات)...</div>}

      {bundle && (
        <div className="p-2 bg-gray-100 flex gap-2 text-sm justify-center">
          <span>تنكة اليوم: {bundle.fuel.tank_price_lbp.toLocaleString()} ل.ل ({bundle.fuel.price_usd}$)</span>
          <span> | {bundle.fuel.effective_date}</span>
          <select value={engineCode} onChange={e => setEngineCode(e.target.value)} className="ml-2 border rounded px-1">
            {Object.keys(bundle.engines).map(code => (
              <option key={code} value={code}>{code} - {bundle.engines[code].vehicle_type}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex-1">
        <TaxiMap
          onDistanceCalculated={handleDistance}
          onConfirm={() => alert(`الأجرة ${fare?.customer_pays_lbp.toLocaleString()} ل.ل`)}
        />
      </div>

      {fare && distance && (
        <div className="p-3 bg-black text-white rounded-t-2xl -mt-4 z-[900] space-y-1">
          <div className="flex justify-between text-lg font-bold">
            <span>{distance.totalKm} كم ({distance.cityKm} بلد + {distance.highwayKm} أوتوستراد)</span>
            <span>{fare.customer_pays_lbp.toLocaleString()} ل.ل</span>
          </div>
          <div className="text-xs opacity-70 flex justify-between">
            <span>{fare.isNight? '🌙 ليل' : '☀ نهار'} - {fare.breakdown.vehicle_type} {fare.breakdown.engineCode} - بنزين/كم {fare.breakdown.fuel_per_km.toLocaleString()}</span>
            <span>عمولتك: {fare.commission_lbp.toLocaleString()} ل.ل ({bundle.pricing.default_commission_percent}%)</span>
          </div>
          {fare.isCapped && <div className="text-xs text-orange-400">⚠ انطبق سقف {fare.capApplied.toLocaleString()} ل.ل</div>}
        </div>
      )}
    </div>
  );
}
