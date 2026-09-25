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

// ألوانك المطلوبة
const COLORS = {
  customers: '#ef4444', // أحمر
  stores: '#22c55e', // أخضر فاتح
  drivers: '#15803d', // أخضر غامق
  taxi_drivers: '#facc15' // أصفر
}

function makeDot(color, size=14){
  return new L.DivIcon({
    html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;border:2px solid white;box-shadow:0 0 3px black"></div>`,
    iconSize:[size,size], iconAnchor:[size/2,size/2]
  })
}
function makeDotMatch(color, size=26){
  return new L.DivIcon({
    html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;border:3px solid yellow;box-shadow:0 0 10px red"></div>`,
    iconSize:[size,size], iconAnchor:[size/2,size/2]
  })
}
function makeDotOffline(size=10){
  return new L.DivIcon({
    html: `<div style="width:${size}px;height:${size}px;background:#9ca3af;border-radius:50%;border:1px solid white;opacity:0.5"></div>`,
    iconSize:[size,size], iconAnchor:[size/2,size/2]
  })
}

function FitAll({ data }){
  const map = useMap();
  useEffect(()=>{
    if(data.length===0) return
    const points = data.map(c=> [c.lat, c.lng])
    if(points.length===1) map.setView(points[0], 16)
    else map.fitBounds(points, {padding:[60,60]})
  }, [data]);
  return null
}

export default function CustomerMapAll({ data = [] }) {
  if(data.length===0) return <div className="p-10 text-center text-gray-500">ما في شي بهالفلتر</div>
  const center = [data[0].lat, data[0].lng]

  return (
    <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FitAll data={data} />
      {data.map(item=>{
        const col = COLORS[item.type] || COLORS.customers
        let icon
        if(item.isMatch) icon = makeDotMatch(col)
        else if(item.type==='taxi_drivers' && (item.status==='offline' || item.is_online===false)) icon = makeDotOffline()
        else icon = makeDot(col, item.type==='taxi_drivers'?12:14)

        const isTaxi = item.type==='taxi_drivers'

        return (
          <Marker key={`${item.type}-${item.id}`} position={[item.lat, item.lng]} icon={icon}>
            <Popup>
              <div className="text-sm" style={{minWidth: isTaxi?'210px':'auto'}}>
                <div className="font-bold flex items-center gap-1" style={{color: col}}>
                  <span style={{width: '10px', height: '10px', background: col, borderRadius: '50%', display: 'inline-block'}}></span>
                  {item.type==='stores'?'🏪':item.type==='drivers'?'🛵':isTaxi?'🚕':'👤'} {item.name}
                  {item.isMatch && <span className="bg-red-500 text-white text-xs px-2 rounded-full ml-1">MATCH</span>}
                </div>
                <div>🆔 {item.id}</div>
                <div>📞 {item.mobile}</div>
                <div className="text-gray-600">📍 {item.address || item.area}</div>
                {item.status && <div className="text-xs">Status: {item.status}</div>}
                {isTaxi && (
                  <div className="mt-1 text-xs bg-gray-100 p-1 rounded">
                    <div>🚗 {item.vehicle || 'car'} - {item.plate_number || ''}</div>
                    <div>⭐ {item.average_rating || 0} - {item.total_orders || 0} طلب</div>
                  </div>
                )}
                <div className="text- text-gray-400 mt-1">{item.lat.toFixed(5)}, {item.lng.toFixed(5)}</div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  );
}
