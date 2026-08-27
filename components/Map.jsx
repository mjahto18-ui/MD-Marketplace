"use client";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const driverIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/744/744465.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

// هون التفصيل - اذا اجا "33.89,35.50" بيفصلو لحالو
function parsePos(lat, lng, fallbackLat, fallbackLng){
  // اذا lat فيها فاصلة يعني مجموع
  if(typeof lat === 'string' && lat.includes(',')){
    const [a,b] = lat.split(',').map(s=>parseFloat(s.trim()))
    return [a,b]
  }
  if(typeof lng === 'string' && lng.includes(',')){
    const [a,b] = lng.split(',').map(s=>parseFloat(s.trim()))
    return [a,b]
  }
  const cLat = parseFloat(lat || fallbackLat)
  const cLng = parseFloat(lng || fallbackLng)
  return [cLat, cLng]
}

function AutoFollow({ cLat, cLng, dLat, dLng, hasDriver }){
  const map = useMap();
  useEffect(()=>{
    if(!hasDriver || isNaN(dLat) || isNaN(cLat)) return;
    map.fitBounds([[cLat, cLng], [dLat, dLng]], { padding: [80,80] });
  }, [dLat, dLng, cLat, cLng, hasDriver, map]);
  return null;
}

export default function Map({ lat, lng, customerLat, customerLng, driverLat, driverLng }) {
  const [cLat, cLng] = parsePos(customerLat, customerLng, lat, lng)
  const [dLat, dLng] = parsePos(driverLat, driverLng, null, null)

  const hasDriver = driverLat && !isNaN(dLat) && !isNaN(dLng);
  const center = hasDriver ? [(cLat + dLat) / 2, (cLng + dLng) / 2] : [cLat, cLng];
  const zoom = hasDriver ? 13 : 15;

  return (
    <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <AutoFollow cLat={cLat} cLng={cLng} dLat={dLat} dLng={dLng} hasDriver={hasDriver} />
      <Marker position={[cLat, cLng]} />
      {hasDriver && (
        <>
          <Marker position={[dLat, dLng]} icon={driverIcon} />
          <Polyline positions={[[cLat, cLng], [dLat, dLng]]} color="#a855f7" dashArray="10, 10" weight={3} />
        </>
      )}
    </MapContainer>
  );
}
