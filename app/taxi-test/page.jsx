'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { getPricingConfig, calculateFare } from '@/lib/taxi/pricingEngine';

const TaxiMap = dynamic(() => import('@/components/taxi/TaxiMap'), { ssr: false });

export default function TaxiTest() {
  const [distance, setDistance] = useState(null);
  const [fare, setFare] = useState(null);
  const [cfg, setCfg] = useState(null);

  // 1. جيب التسعيرة من الجدول مرة وحدة
  useEffect(() => {
    getPricingConfig().then(setCfg).catch(console.error);
  }, []);

  const handleDistance = (data) => {
    setDistance(data);
    if (!cfg) return;

    // 2. هلأ احسب لبناني من الجدول
    const result = calculateFare({
     ...data,
      pricingConfig: cfg,
      engineCC: '1200',
      routeKey: 'default' // بعدين بتصير beirut-tripoli حسب Nominatim
    });
    setFare(result);
  };

  return (
    <div className="w-full h- flex flex-col">
      {!cfg && <div className="p-3 bg-yellow-100 text-sm text-center">عم جيب التسعيرة من الجدول...</div>}

      <div className="flex-1">
        <TaxiMap
          onDistanceCalculated={handleDistance}
          onConfirm={() => alert(`الأجرة ${fare?.customer_pays_lbp.toLocaleString()} ل.ل`)}
        />
      </div>

      {fare && (
        <div className="p-3 bg-black text-white rounded-t-2xl -mt-4 z-[900] space-y-1">
          <div className="flex justify-between text-lg font-bold">
            <span>كلي {distance.totalKm} كم ({distance.cityKm} بلد + {distance.highwayKm} أوتوستراد)</span>
            <span>{fare.customer_pays_lbp.toLocaleString()} ل.ل</span>
          </div>
          <div className="text- opacity-70 flex justify-between">
            <span>{fare.isNight? '🌙 تسعيرة ليل' : '☀️ تسعيرة نهار'} - عامل {fare.breakdown.engineCC}: {fare.breakdown.engine_factor}x</span>
            <span>عمولتك: {fare.commission_lbp.toLocaleString()} ل.ل ({cfg.default_commission_percent}%)</span>
          </div>
          {fare.isCapped && <div className="text- text-orange-400">⚠️ انطبق سقف {fare.capApplied.toLocaleString()} ل.ل</div>}
        </div>
      )}
    </div>
  );
}
