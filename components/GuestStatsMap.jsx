"use client";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

if (typeof window!== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

const guestIcon = new L.DivIcon({
  html: `<div style="width:14px;height:14px;background:#3b82f6;border-radius:50%;border:2px solid white;box-shadow:0 0 4px black"></div>`,
  iconSize:[14,14],
  iconAnchor:[7,7]
})

const guestClusterIcon = (count) => new L.DivIcon({
  html: `<div style="width:36px;height:36px;background:#3b82f6;border-radius:50%;border:3px solid white;box-shadow:0 0 8px #3b82f6;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:13px">${count}</div>`,
  iconSize:[36,36],
  iconAnchor:[18,18]
})

function FitWorld({ data }){
  const map = useMap();
  useEffect(()=>{
    if(!data || data.length===0) return;
    const points = data.map(c=> [c.lat, c.lng]).filter(p=> p[0] && p[1]);
    if(points.length===0) return;
    if(points.length===1) map.setView(points[0], 5);
    else map.fitBounds(points, {padding:[80,80], maxZoom: 6});
  }, [data, map]);
  return null
}

export default function GuestStatsMap({ data = [] }) {
  if(data.length===0) return <div className="p-10 text-center text-gray-500">ما في بيانات جغرافية بعد</div>

  const grouped = {};
  data.forEach(item=>{
    if(!item.lat ||!item.lng) return;
    const key = `${item.city || 'unknown'}-${item.country}-${Number(item.lat).toFixed(2)}-${Number(item.lng).toFixed(2)}`;
    if(!grouped[key]) grouped[key] = {...item, count: 0, ips: [] };
    grouped[key].count += 1;
    if(item.ip) grouped[key].ips.push(item.ip);
  });

  const points = Object.values(grouped);
  if(points.length===0) return <div className="p-10 text-center text-gray-500">ما في نقاط صالحة للعرض</div>

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
          return (
            <Marker key={`guest-${idx}`} position={[item.lat, item.lng]} icon={icon}>
              <Popup>
                <div className="text-sm min-w-">
                  <div className="font-bold">👁️ {item.city || 'غير معروف'} - {item.country || 'Unknown'}</div>
                  <div className="text-xs mt-1">عدد الزيارات: <b>{item.count}</b></div>
                  <div className="text- text-gray-500 mt-1">{Number(item.lat).toFixed(4)}, {Number(item.lng).toFixed(4)}</div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  );
}
