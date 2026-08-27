"use client";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useRef } from 'react';

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

function FitBounds({ stores, customerLat, customerLng, driverLat, driverLng, storeLat, storeLng }){
  const map = useMap();
  const didFit = useRef(false);

  useEffect(()=>{
    // اذا عمل fit مرة خلص ما بقا يعيد
    if(didFit.current) return;

    const pts = [];
    stores.forEach(s=>{ if(s.lat && s.lng &&!isNaN(s.lat) &&!isNaN(s.lng)) pts.push([parseFloat(s.lat), parseFloat(s.lng)]) });
    if(!isNaN(parseFloat(storeLat)) &&!isNaN(parseFloat(storeLng))) pts.push([parseFloat(storeLat), parseFloat(storeLng)]);
    if(!isNaN(parseFloat(customerLat)) &&!isNaN(parseFloat(customerLng))) pts.push([parseFloat(customerLat), parseFloat(customerLng)]);
    if(!isNaN(parseFloat(driverLat)) &&!isNaN(parseFloat(driverLng))) pts.push([parseFloat(driverLat), parseFloat(driverLng)]);

    if(pts.length>0) {
      map.fitBounds(pts, { padding:[80,80] });
      didFit.current = true; // اهم سطر - بيمنع يرجعك
    }
    setTimeout(()=> map.invalidateSize(), 200);
  },[stores, customerLat, customerLng, driverLat, driverLng, storeLat, storeLng, map]);

  return null;
}

export default function DriverMap({
  stores = [],
  storeLat, storeLng,
  customerLat, customerLng,
  driverLat, driverLng,
  onSelectPoint
}) {
  const cLat = parseFloat(customerLat)
  const cLng = parseFloat(customerLng)
  const hasCustomer =!isNaN(cLat) &&!isNaN(cLng) && cLat!==0

  const dLat = parseFloat(driverLat)
  const dLng = parseFloat(driverLng)
  const hasDriver =!isNaN(dLat) &&!isNaN(dLng) && dLat!==0

  const sLat = parseFloat(storeLat)
  const sLng = parseFloat(storeLng)
  const hasSingleStore =!isNaN(sLat) &&!isNaN(sLng) && sLat!==0

  const firstStore = stores && stores[0]
  const center = hasCustomer? [cLat, cLng] : firstStore? [parseFloat(firstStore.lat), parseFloat(firstStore.lng)] : hasSingleStore? [sLat, sLng] : hasDriver? [dLat, dLng] : [33.8938, 35.5018]

  const handleSelect = (lat, lng, label) => {
    if(onSelectPoint) onSelectPoint({ lat, lng, label })
  }

  return (
    <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FitBounds stores={stores} customerLat={customerLat} customerLng={customerLng} driverLat={driverLat} driverLng={driverLng} storeLat={storeLat} storeLng={storeLng} />

      {stores.length > 0? stores.map((s,i)=>{
        const lat = parseFloat(s.lat), lng = parseFloat(s.lng);
        if(isNaN(lat)||isNaN(lng)) return null;
        return (
          <Marker key={`store-${i}`} position={[lat, lng]} icon={storeIcon} eventHandlers={{ click: ()=> handleSelect(lat, lng, s.name || `متجر ${i+1}`) }}>
            <Popup>{s.name || 'المتجر'}<br/>lat:{lat} lng:{lng}</Popup>
          </Marker>
        )
      }) : hasSingleStore && (
        <Marker position={[sLat, sLng]} icon={storeIcon} eventHandlers={{ click: ()=> handleSelect(sLat, sLng, 'المتجر') }}>
          <Popup>المتجر - اضغط تنقل</Popup>
        </Marker>
      )}

      {hasCustomer && (
        <Marker position={[cLat, cLng]} icon={customerIcon} eventHandlers={{ click: ()=> handleSelect(cLat, cLng, 'الزبون') }}>
          <Popup>الزبون</Popup>
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
