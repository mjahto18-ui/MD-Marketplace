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

// هيدي ايقونة نقطة واحدة - أحمر
const guestIcon = new L.DivIcon({
  html: `
    <div style="position:relative; width:36px; height:48px;">
      <div style="width:36px; height:36px; background:#ef4444; border-radius:50%; border:3px solid white; box-shadow:0 3px 10px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center;">
        <div style="width:12px; height:12px; background:white; border-radius:50%;"></div>
      </div>
      <div style="width:0; height:0; border-left:10px solid transparent; border-right:10px solid transparent; border-top:14px solid #ef4444; margin:-4px auto 0 auto;"></div>
    </div>
  `,
  iconSize: [36, 48],
  iconAnchor: [18, 44],
  className: ''
})

// هيدي ايقونة الغروب - أزرق غامق و أكبر
const guestClusterIcon = (count) => new L.DivIcon({
  html: `
    <div style="position:relative; width:48px; height:60px;">
      <div style="width:48px; height:48px; background:#1e40af; border-radius:50%; border:3px solid white; box-shadow:0 4px 14px rgba(30,64,175,0.5); display:flex; align-items:center; justify-content:center;">
        <span style="color:white; font-weight:900; font-size:18px;">${count}</span>
      </div>
      <div style="width:0; height:0; border-left:12px solid transparent; border-right:12px solid transparent; border-top:18px solid #1e40af; margin:-6px auto 0 auto;"></div>
    </div>
  `,
  iconSize: [48, 60],
  iconAnchor: [24, 56],
  className: ''
})

// هيدي بتحسب المسافة بين نقطتين بالمتر
function getDistance(lat1, lon1, lat2, lon2) {

  const R = 6371e3;

  const dLat = (lat2-lat1) * Math.PI/180;

  const dLon = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

}

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

  // هون منجمع الزيارات اللي قريبة من بعض 350 متر بنقطة وحدة
  // 350 متر بيجمع الـ 5 تبع المدينة المنورة كلهم نقطة وحدة
  // قبل كنا 100 متر فكان يفرق الخامسة لحالا
  const grouped = [];

  data.forEach((item)=>{

    if(!item.lat ||!item.lng) {
      return;
    }

    // ندور اذا فيه غروب قريب ضمن 350 متر
    let found = null;

    for(let g of grouped){

      const dist = getDistance(item.lat, item.lng, g.lat, g.lng);

      if(dist <= 350){
        found = g;
        break;
      }

    }

    if(found){

      found.count += 1;

      // نحدث المركز متوسط
      found.lat = (found.lat * (found.count-1) + Number(item.lat)) / found.count;

      found.lng = (found.lng * (found.count-1) + Number(item.lng)) / found.count;

      if(item.ip) {
        found.ips.push(item.ip);
      }

      if(item.org) {
        found.orgs.push(item.org);
      }

      if(item.timezone) {
        found.timezones.push(item.timezone);
      }

      if(item.city) {
        found.cities.push(item.city);
      }

    } else {

      grouped.push({
      ...item,
        count: 1,
        lat: Number(item.lat),
        lng: Number(item.lng),
        ips: item.ip? [item.ip] : [],
        orgs: item.org? [item.org] : [],
        timezones: item.timezone? [item.timezone] : [],
        cities: item.city? [item.city] : []
      });

    }

  });

  const points = grouped;

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
                    عدد الزيارات: <b>{item.count}</b> (بـ 350 متر)
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
