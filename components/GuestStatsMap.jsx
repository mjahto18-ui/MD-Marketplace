"use client";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ايقونة الزائر - ازرق للاحصاء
const guestIcon = new L.DivIcon({
  html: `<div style="width:14px;height:14px;background:#3b82f6;border-radius:50%;border:2px solid white;box-shadow:0 0 4px black"></div>`,
  iconSize:[14,14],
  iconAnchor:[7,7]
})

// اذا نفس المدينة فيها كتير زيارات - دائرة كبيرة فيها العدد
const guestClusterIcon = (count) => new L.DivIcon({
  html: `<div style="width:32px;height:32px;background:#3b82f6;border-radius:50%;border:3px solid white;box-shadow:0 0 8px #3b82f6;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:12px">${count}</div>`,
  iconSize:[32,32],
  iconAnchor:[16,16]
})

function FitWorld({ data }){
  const map = useMap();
  useEffect(()=>{
    if(data.length===0) return
    const points = data.map(c=> [c.lat, c.lng])
    if(points.length===1) {
      map.setView(points[0], 5) // زوم عالمي مش 16 متل لبنان
    } else {
      map.fitBounds(points, {padding:[80,80], maxZoom: 6}) // maxZoom 6 مشان ما يعمل زوم كتير اذا كل الزوار من بلد واحد
    }
  }, [data]);
  return null
}

export default function GuestStatsMap({ data = [] }) {
  if(data.length===0) return <div className="p-10 text-center text-gray-500">ما في بيانات جغرافية بعد - الزوار الجداد رح يبينو هون</div>

  // نجمع الزوار من نفس المدينة بنفس الاحداثيات تقريباً
  const grouped = {};
  data.forEach(item=>{
    if(!item.lat ||!item.lng) return;
    const key = `${item.city || 'unknown'}-${item.country}-${item.lat.toFixed(2)}-${item.lng.toFixed(2)}`;
    if(!grouped[key]) grouped[key] = {...item, count: 0, ips: [] };
    grouped[key].count += 1;
    grouped[key].ips.push(item.ip);
  });

  const points = Object.values(grouped);
  const center = [points[0].lat, points[0].lng]

  return (
    <MapContainer center={center} zoom={2} style={{ height: '100%', width: '100%' }} worldCopyJump={true}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FitWorld data={points} />
      {points.map((item, idx)=>{
        const icon = item.count > 1? guestClusterIcon(item.count) : guestIcon;
        return (
          <Marker key={`guest-${idx}`} position={[item.lat, item.lng]} icon={icon}>
            <Popup>
              <div className="min-w- text-sm">
                <div className="font-bold">👁️ {item.city || 'غير معروف'} - {item.country || 'Unknown'}</div>
                <div className="text-xs mt-1">عدد الزيارات: <b>{item.count}</b></div>
                <div className="text-xs text-gray-600">IP: {item.ip?.substring(0,25)}</div>
                <div className="text-xs text-gray-600">اخر زيارة: {item.date}</div>
                <div className="text- text-gray-400 mt-1">{item.lat?.toFixed(4)}, {item.lng?.toFixed(4)}</div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  );
}
