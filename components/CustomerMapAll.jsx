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

// ايقونات حسب الرول
const customerIcon = new L.DivIcon({ html: `<div style="width:14px;height:14px;background:#ef4444;border-radius:50%;border:2px solid white;box-shadow:0 0 3px black"></div>`, iconSize:[14,14], iconAnchor:[7,7] })
const customerMatchIcon = new L.DivIcon({ html: `<div style="width:24px;height:24px;background:red;border-radius:50%;border:3px solid yellow;box-shadow:0 0 10px red"></div>`, iconSize:[24,24], iconAnchor:[12,12] })

const storeIcon = new L.Icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/869/869636.png', iconSize:[36,36], iconAnchor:[18,36] })
const storeMatchIcon = new L.Icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/869/869636.png', iconSize:[50,50], iconAnchor:[25,50], className:'drop-shadow-[0_0_8px_red]' })

const driverIcon = new L.Icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/744/744465.png', iconSize:[38,38], iconAnchor:[19,38] })
const driverMatchIcon = new L.Icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/744/744465.png', iconSize:[52,52], iconAnchor:[26,52], className:'drop-shadow-[0_0_10px_red]' })

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
  if(data.length===0) return <div className="p-10 text-center text-gray-500">ما في شي بهالفلتر - جرّب رقم تاني او غيّر التاب</div>

  const center = [data[0].lat, data[0].lng]

  return (
    <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FitAll data={data} />
      {data.map(item=>{
        let icon = customerIcon
        if(item.type==='stores') icon = item.isMatch? storeMatchIcon : storeIcon
        else if(item.type==='drivers') icon = item.isMatch? driverMatchIcon : driverIcon
        else icon = item.isMatch? customerMatchIcon : customerIcon

        return (
          <Marker key={`${item.type}-${item.id}`} position={[item.lat, item.lng]} icon={icon}>
            <Popup>
              <div className="min-w- text-sm">
                <div className="font-bold text-">{item.type==='stores'?'🏪':item.type==='drivers'?'🛵':'👤'} {item.name} {item.isMatch && <span className="bg-red-500 text-white text- px-2 rounded-full ml-1">MATCH</span>}</div>
                <div>🆔 {item.id}</div>
                <div>📞 {item.mobile}</div>
                <div className="text-gray-600">📍 {item.address}</div>
                {item.area && <div>Area: {item.area}</div>}
                {item.status && <div>Status: {item.status}</div>}
                <div className="text- text-gray-400 mt-1">{item.lat.toFixed(6)}, {item.lng.toFixed(6)}</div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  );
}
