"use client";
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ايقونة السائق - موتوسيكل
const driverIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/744/744465.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

export default function Map({ lat, lng, customerLat, customerLng, driverLat, driverLng }) {
  // اذا اجت customerLat يعني خريطة الطلب الحالي، اذا لا يعني الخريطة الثابتة
  const cLat = parseFloat(customerLat || lat);
  const cLng = parseFloat(customerLng || lng);
  const dLat = parseFloat(driverLat);
  const dLng = parseFloat(driverLng);

  const hasDriver = driverLat && driverLng && !isNaN(dLat) && !isNaN(dLng);
  
  // اذا في سائق، خلي السنتر بالنص بين الاتنين
  const center = hasDriver ? [(cLat + dLat) / 2, (cLng + dLng) / 2] : [cLat, cLng];
  const zoom = hasDriver ? 13 : 15;

  return (
    <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
      {/* ماركر العميل */}
      <Marker position={[cLat, cLng]} />

      {/* ماركر السائق + خط */}
      {hasDriver && (
        <>
          <Marker position={[dLat, dLng]} icon={driverIcon} />
          <Polyline positions={[[cLat, cLng], [dLat, dLng]]} color="#a855f7" dashArray="10, 10" weight={3} />
        </>
      )}
    </MapContainer>
  );
}
