"use client";
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function parsePos(lat, lng, fallbackLat, fallbackLng){
  if(typeof lat === 'string' && lat.includes(',')){
    const [a,b] = lat.split(',').map(s=>parseFloat(s.trim()))
    return [a,b]
  }
  const cLat = parseFloat(lat || fallbackLat)
  const cLng = parseFloat(lng || fallbackLng)
  return [cLat, cLng]
}

function FitAll({ customers }){
  const map = useMap();
  useEffect(()=>{
    if(customers.length===0) return
    const points = customers.map(c=> [c.lat, c.lng])
    if(points.length>1) map.fitBounds(points, { padding: [50,50] })
    else if(points.length===1) map.setView(points[0], 16)
  }, [customers, map]);
  return null
}

export default function CustomerMapAll({ customers = [] }) {
  if(customers.length===0) return <div className="p-6">ما في زباين بهالفلتر</div>

  const center = [customers[0].lat, customers[0].lng]

  return (
    <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FitAll customers={customers} />
      {customers.map(c=>(
        <Marker key={c['Customer ID']} position={[c.lat, c.lng]} />
      ))}
    </MapContainer>
  );
}
