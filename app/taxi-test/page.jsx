'use client';
import dynamic from 'next/dynamic';
import { useState } from 'react';

// الخريطة لازم dynamic مشان Leaflet
const TaxiMap = dynamic(() => import('@/components/taxi/TaxiMap'), { ssr: false });

export default function TaxiTest() {
  const [distance, setDistance] = useState(null);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">تجربة خريطة التاكسي</h1>
      <TaxiMap onDistanceCalculated={(data) => setDistance(data)} />
      
      {distance && (
        <div className="mt-4 p-3 bg-green-50 border rounded">
          <p>كلي: {distance.totalKm} كم</p>
          <p>بلد: {distance.cityKm} كم</p>
          <p>أوتوستراد: {distance.highwayKm} كم</p>
          <p>وقت: {distance.durationMin} دقيقة</p>
        </div>
      )}
    </div>
  );
}
