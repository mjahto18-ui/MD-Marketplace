"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { createClient } from '@supabase/supabase-js';
import BackToDashboard from "@/components/BackToDashboard"

// هون الحل - ما منخلي السيرفر يرندر الخريطة
// لأنو الخريطة بدها window و السيرفر ما عندو window
const GuestStatsMap = dynamic(() => import("@/components/GuestStatsMap"), {
  ssr: false,
  loading: () => <div className="p-10 text-center">جاري تحميل الخريطة...</div>
});

// نجهز السوبربيز
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function GuestStatsPage(){

  // هون منحفظ بيانات الخريطة
  const [data, setData] = useState([]);

  // هون منحفظ الاحصائيات فوق
  const [stats, setStats] = useState({
    total: 0,
    countries: 0,
    topCountry: '-',
    topCity: '-',
    topRegion: '-',
    topOrg: '-'
  });

  // بس تفتح الصفحة نجيب البيانات
  useEffect(()=>{

    (async()=>{

      // 1. نجيب اخر 1000 زيارة من السوبربيز
      // نجيب بس اللي عندو lat و lng مشان الخريطة
      const { data: logs } = await supabase
       .from('guestlogs')
       .select('*')
       .not('lat','is',null)
       .not('lng','is',null)
       .order('supa_id', {ascending:false})
       .limit(1000);

      // اذا ما فيه شي منوقف
      if(!logs) {
        return;
      }

      if(logs.length === 0) {
        return;
      }

      // 2. نحول البيانات لشكل الخريطة بتحبو
      const mapData = logs.map((l)=>{

        return {
          lat: l.lat,
          lng: l.lng,
          city: l.city,
          region: l.region, // جديد - Liban-Nord
          country: l.country, // Lebanon
          org: l.org, // جديد - Wave Net LLC
          timezone: l.timezone, // جديد - Asia/Beirut
          ip: l["IP Adresse"],
          date: new Date(l["Log Date"] || l["Date Time"]).toLocaleDateString('ar-LB')
        };

      });

      // منحطا بالخريطة
      setData(mapData);

      // 3. نحسب الاحصائيات
      const countryCount = {};
      const cityCount = {};
      const regionCount = {};
      const orgCount = {};

      logs.forEach((l)=>{

        // نحسب البلدان
        if(l.country) {
          countryCount[l.country] = (countryCount[l.country] || 0) + 1;
        }

        // نحسب المدن
        if(l.city) {
          cityCount[l.city] = (cityCount[l.city] || 0) + 1;
        }

        // نحسب المناطق - جديد
        if(l.region) {
          regionCount[l.region] = (regionCount[l.region] || 0) + 1;
        }

        // نحسب شركات النت - جديد
        if(l.org) {
          orgCount[l.org] = (orgCount[l.org] || 0) + 1;
        }

      });

      // نلاقي اكتر بلد
      const topCountryEntry = Object.entries(countryCount).sort((a,b)=>b[1]-a[1])[0];

      // نلاقي اكتر مدينة
      const topCityEntry = Object.entries(cityCount).sort((a,b)=>b[1]-a[1])[0];

      // نلاقي اكتر منطقة - جديد
      const topRegionEntry = Object.entries(regionCount).sort((a,b)=>b[1]-a[1])[0];

      // نلاقي اكتر شركة نت - جديد
      const topOrgEntry = Object.entries(orgCount).sort((a,b)=>b[1]-a[1])[0];

      // منحطن فوق
      setStats({

        total: logs.length,

        countries: Object.keys(countryCount).length,

        topCountry: topCountryEntry? `${topCountryEntry[0]} (${topCountryEntry[1]})` : '-',

        topCity: topCityEntry? `${topCityEntry[0]} (${topCityEntry[1]})` : '-',

        topRegion: topRegionEntry? `${topRegionEntry[0]} (${topRegionEntry[1]})` : '-',

        topOrg: topOrgEntry? `${topOrgEntry[0]} (${topOrgEntry[1]})` : '-'

      });

    })();

  },[]);

  return (
    <div className="p-4 space-y-4">

      <BackToDashboard />

      {/* الكروت فوق */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">

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
          <div className="text-xs text-gray-500">أكثر منطقة</div>
          <div className="text-lg font-bold">🗺️ {stats.topRegion}</div>
        </div>

        <div className="bg-white rounded-xl shadow p-4 border">
          <div className="text-xs text-gray-500">أكثر شركة نت</div>
          <div className="text-lg font-bold">📡 {stats.topOrg}</div>
        </div>

        <div className="bg-white rounded-xl shadow p-4 border">
          <div className="text-xs text-gray-500">عدد الدول</div>
          <div className="text-2xl font-bold">{stats.countries}</div>
        </div>

      </div>

      {/* الخريطة */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">

        <div className="p-3 font-bold border-b">
          خريطة الزوار العالمية
        </div>

        <div className="w-full">
          <GuestStatsMap data={data} />
        </div>

      </div>

    </div>
  )

}
