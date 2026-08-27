"use client";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// 3 اشكال مختلفة متل ما طلبت
const storeIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/869/869636.png', // شكل متجر
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const customerIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', // دبوس زبون
  iconSize: [32, 38],
  iconAnchor: [16, 38],
});

const driverIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/744/744465.png', // موتو
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

export default function DriverMap({ 
  stores = [], // [{lat,lng,name}] اذا الطلب من اكتر من متجر
  storeLat, storeLng, 
  customerLat, customerLng, 
  driverLat, driverLng,
  onSelectPoint 
}) {
  const cLat = parseFloat(customerLat)
  const cLng = parseFloat(customerLng)
  const hasCustomer = !isNaN(cLat) && !isNaN(cLng)

  // السنتر - اذا في سائق خليه بالنص
  const dLat = parseFloat(driverLat)
  const dLng = parseFloat(driverLng)
  const hasDriver = !isNaN(dLat) && !isNaN(dLng)
  
  const center = hasCustomer ? [cLat, cLng] : [33.8938, 35.5018]
  const zoom = 14

  const handleSelect = (lat, lng, label) => {
    if(onSelectPoint) onSelectPoint({ lat, lng, label })
  }

  return (
    <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* متاجر - ممكن اكتر من واحد */}
      {stores.length > 0 ? stores.map((s,i)=>(
        <Marker key={i} position={[s.lat, s.lng]} icon={storeIcon}
          eventHandlers={{ click: ()=> handleSelect(s.lat, s.lng, s.name || `متجر ${i+1}`) }}>
          <Popup>{s.name || 'المتجر'} - اضغط تنقل</Popup>
        </Marker>
      )) : storeLat && (
        <Marker position={[parseFloat(storeLat), parseFloat(storeLng)]} icon={storeIcon}
          eventHandlers={{ click: ()=> handleSelect(parseFloat(storeLat), parseFloat(storeLng), 'المتجر') }}>
          <Popup>المتجر - اضغط تنقل</Popup>
        </Marker>
      )}

      {/* زبون */}
      {hasCustomer && (
        <Marker position={[cLat, cLng]} icon={customerIcon}
          eventHandlers={{ click: ()=> handleSelect(cLat, cLng, 'الزبون') }}>
          <Popup>الزبون - اضغط تنقل</Popup>
        </Marker>
      )}

      {/* سائق - ما بينحدد للتنقل */}
      {hasDriver && (
        <Marker position={[dLat, dLng]} icon={driverIcon}>
          <Popup>انت هنا</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
