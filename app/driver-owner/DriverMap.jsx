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

const storeIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/869/869636.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const customerIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [32, 38],
  iconAnchor: [16, 38],
});

const driverIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/744/744465.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

export default function DriverMap({
  stores = [],
  storeLat, storeLng,
  customerLat, customerLng,
  driverLat, driverLng,
  onSelectPoint
}) {
  const cLat = parseFloat(customerLat)
  const cLng = parseFloat(customerLng)
  const hasCustomer =!isNaN(cLat) &&!isNaN(cLng) && cLat!== 0

  const dLat = parseFloat(driverLat)
  const dLng = parseFloat(driverLng)
  const hasDriver =!isNaN(dLat) &&!isNaN(dLng) && dLat!== 0

  const sLat = parseFloat(storeLat)
  const sLng = parseFloat(storeLng)
  const hasSingleStore =!isNaN(sLat) &&!isNaN(sLng) && sLat!== 0

  const firstStore = stores && stores[0]

  // السنتر صار ذكي: زبون -> اول متجر -> سائق -> بيروت
  const center = hasCustomer
   ? [cLat, cLng]
    : firstStore
   ? [firstStore.lat, firstStore.lng]
    : hasSingleStore
   ? [sLat, sLng]
    : hasDriver
   ? [dLat, dLng]
    : [33.8938, 35.5018]

  const handleSelect = (lat, lng, label) => {
    if(onSelectPoint) onSelectPoint({ lat, lng, label })
  }

  return (
    <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* متاجر - اكتر من واحد */}
      {stores.length > 0? stores.map((s,i)=>(
        <Marker key={`store-${i}`} position={[s.lat, s.lng]} icon={storeIcon}
          eventHandlers={{ click: ()=> handleSelect(s.lat, s.lng, s.name || `متجر ${i+1}`) }}>
          <Popup>{s.name || 'المتجر'} - اضغط تنقل</Popup>
        </Marker>
      )) : hasSingleStore && (
        <Marker position={[sLat, sLng]} icon={storeIcon}
          eventHandlers={{ click: ()=> handleSelect(sLat, sLng, 'المتجر') }}>
          <Popup>المتجر - اضغط تنقل</Popup>
        </Marker>
      )}

      {hasCustomer && (
        <Marker position={[cLat, cLng]} icon={customerIcon}
          eventHandlers={{ click: ()=> handleSelect(cLat, cLng, 'الزبون') }}>
          <Popup>الزبون - اضغط تنقل</Popup>
        </Marker>
      )}

      {hasDriver && (
        <Marker position={[dLat, dLng]} icon={driverIcon}>
          <Popup>انت هنا</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
