"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { createClient } from '@supabase/supabase-js';

// هون الحل - ما منخلي السيرفر يرندر الخريطة
const GuestStatsMap = dynamic(() => import("@/components/GuestStatsMap"), {
  ssr: false,
  loading: () => <div className="p-10 text-center">جاري تحميل الخريطة...</div>
});

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function GuestStatsPage(){
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({ total:0, countries:0, topCountry:'-', topCity:'-' });

  useEffect(()=>{
    (async()=>{
      const { data: logs } = await supabase
      .from('guestlogs')
      .select('*')
      .not('lat','is',null)
      .order('Log Date', {ascending:false})
      .limit(1000);

      if(!logs) return;

      const mapData = logs.map(l=>({
        lat: l.lat,
        lng: l.lng,
        city: l.city,
        country: l.country,
        ip: l["IP Adresse"],
        date: new Date(l["Log Date"]).toLocaleDateString('ar-LB')
      }));
      setData(mapData);

      const countryCount = {};
      const cityCount = {};
      logs.forEach(l=>{
        countryCount[l.country] = (countryCount[l.country]||0)+1;
        cityCount[l.city] = (cityCount[l.city]||0)+1;
      });
      const topCountry = Object.entries(countryCount).sort((a,b)=>b[1]-a[1])[0];
      const topCity = Object.entries(cityCount).sort((a,b)=>b[1]-a[1])[0];

      setStats({
        total: logs.length,
        countries: Object.keys(countryCount).length,
        topCountry: topCountry? `${topCountry[0]} (${topCountry[1]})` : '-',
        topCity: topCity? `${topCity[0]} (${topCity[1]})` : '-'
      });
    })();
  },[]);

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl shadow p-4 border">
          <div className="text-xs text-gray-500">إجمالي الزيارات</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border">
          <div className="text-xs text-gray-500">أكثر بلد</div>
          <div className="text-lg font-bold">🌍 {stats.topCountry}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border">
          <div className="text-xs text-gray-500">أكثر مدينة</div>
          <div className="text-lg font-bold">📍 {stats.topCity}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border">
          <div className="text-xs text-gray-500">عدد الدول</div>
          <div className="text-2xl font-bold">{stats.countries}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <div className="p-3 font-bold border-b">خريطة الزوار العالمية</div>
        <div className="w-full">
          <GuestStatsMap data={data} />
        </div>
      </div>
    </div>
  )
}
