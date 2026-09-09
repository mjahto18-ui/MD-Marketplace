"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// هون منصلح ايقونة الخريطة الافتراضية
if (typeof window!== 'undefined') {

  delete L.Icon.Default.prototype._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });

}

// هيدي ايقونة نقطة واحدة
const guestIcon = new L.DivIcon({
  html: `<div style="width:14px;height:14px;background:#3b82f6;border-radius:50%;border:2px solid white;box-shadow:0 0 4px black"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
})

// هيدي ايقونة لما يكون فيه اكتر من زيارة بنفس المكان (100 متر)
const guestClusterIcon = (count) => new L.DivIcon({
  html: `<div style="width:36px;height:36px;background:#3b82f6;border-radius:50%;border:3px solid white;box-shadow:0 0 8px #3b82f6;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:13px">${count}</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18]
})

// هيدي بتخلي الخريطة تعمل زووم اوتوماتيك على كل النقاط
function FitWorld({ data }){

  const map = useMap();

  useEffect(()=>{

    if(!data || data.length === 0) {
      return;
    }

    const points = data.map(c => [c.lat, c.lng]).filter(p=> p[0] && p[1]);

    if(points.length === 0) {
      return;
    }

    if(points.length === 1) {
      map.setView(points[0], 10);
    } else {
      map.fitBounds(points, {padding:[80,80], maxZoom: 12});
    }

  }, [data, map]);

  return null

}

// هيدا المكون الرئيسي للخريطة
export default function GuestStatsMap({ data = [] }) {

  // اذا ما فيه بيانات
  if(data.length === 0) {
    return <div className="p-10 text-center text-gray-500">ما في بيانات جغرافية بعد</div>
  }

  // هون منجمع الزيارات اللي قريبة من بعض 100 متر بنقطة وحدة
  const grouped = {};

  data.forEach((item)=>{

    if(!item.lat ||!item.lng) {
      return;
    }

    // منقرب الاحداثيات لـ 3 ارقام
    // 0.001 درجة = 100 متر تقريبا
    // يعني كل اللي بفرق اقل من 100 متر بصيرو نقطة وحدة
    const latKey = Number(item.lat).toFixed(3);
    const lngKey = Number(item.lng).toFixed(3);

    const key = `${latKey}---${lngKey}`;

    if(!grouped[key]) {

      grouped[key] = {
       ...item,
        count: 0,
        lat_sum: 0,
        lng_sum: 0,
        ips: [],
        orgs: [],
        timezones: [],
        cities: []
      };

    }

    grouped[key].count += 1;

    grouped[key].lat_sum += Number(item.lat);

    grouped[key].lng_sum += Number(item.lng);

    if(item.ip) {
      grouped[key].ips.push(item.ip);
    }

    if(item.org) {
      grouped[key].orgs.push(item.org);
    }

    if(item.timezone) {
      grouped[key].timezones.push(item.timezone);
    }

    if(item.city) {
      grouped[key].cities.push(item.city);
    }

  });

  // منحسب النقطة الوسطية لكل غروب
  const points = Object.values(grouped).map((g)=>{

    return {
     ...g,
      lat: g.lat_sum / g.count,
      lng: g.lng_sum / g.count,
    };

  });

  if(points.length === 0) {
    return <div className="p-10 text-center text-gray-500">ما في نقاط صالحة للعرض</div>
  }

  const center = [points[0].lat, points[0].lng];

  return (

    <div style={{ height: '600px', width: '100%', background: '#e5e7eb' }}>

      <MapContainer center={center} zoom={3} style={{ height: '100%', width: '100%' }} worldCopyJump={true}>

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        <FitWorld data={points} />

        {points.map((item, idx)=>{

          const icon = item.count > 1? guestClusterIcon(item.count) : guestIcon;

          const topOrg = item.orgs.length > 0? item.orgs[0] : null;

          return (

            <Marker key={`guest-${idx}`} position={[item.lat, item.lng]} icon={icon}>

              <Popup>

                <div className="text-sm min-w-">

                  <div className="font-bold text-">
                    👁 {item.city || 'غير معروف'}
                    {item.region? `, ${item.region}` : ''}
                    {item.country? ` - ${item.country}` : ''}
                  </div>

                  <div className="text-xs mt-2">
                    عدد الزيارات: <b>{item.count}</b> (بـ 100 متر)
                  </div>

                  {topOrg && (
                    <div className="text-xs mt-1 text-gray-700">
                      📡 {topOrg}
                    </div>
                  )}

                  {item.timezone && (
                    <div className="text-xs mt-1 text-gray-700">
                      🕐 {item.timezone}
                    </div>
                  )}

                  <div className="text- text-gray-500 mt-2">
                    {Number(item.lat).toFixed(5)}, {Number(item.lng).toFixed(5)}
                  </div>

                </div>

              </Popup>

            </Marker>

          )

        })}

      </MapContainer>

    </div>

  );

}
