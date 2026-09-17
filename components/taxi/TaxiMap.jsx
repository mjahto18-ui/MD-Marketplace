// components/taxi/TaxiMap.jsx - معزول 100% عن الماركت
// شغلتو بس: يحسب مسافة + يقسم بلد/أوتوستراد + يرجعها لـ pricingEngine
// ما بيحسب سعر!

'use client';
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// أيقونات معزولة
const originIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41]
});
const destIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41]
});

function ClickHandler({ onMapClick, selecting }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng, selecting);
    }
  });
  return null;
}

export default function TaxiMap({ onDistanceCalculated }) {
  // Beirut default
  const [origin, setOrigin] = useState(null); 
  const [dest, setDest] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [info, setInfo] = useState(null); // {totalKm, cityKm, highwayKm, duration}
  const [selecting, setSelecting] = useState('origin'); // origin | dest
  const [loading, setLoading] = useState(false);

  // GPS أوتوماتيك للانطلاق - اذا ما بدك ياه شيل هالـ useEffect
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, []);

  const handleMapClick = (latlng, mode) => {
    if (mode === 'origin') {
      setOrigin(latlng);
      setSelecting('dest');
    } else {
      setDest(latlng);
    }
  };

  // حساب المسافة من OSRM المجاني
  useEffect(() => {
    if (!origin || !dest) return;
    const fetchRoute = async () => {
      setLoading(true);
      try {
        // OSRM العام المجاني - اذا بدك الخاص بتبدل الرابط
        const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes && data.routes[0]) {
          const route = data.routes[0];
          const totalKm = route.distance / 1000;
          const durationMin = Math.round(route.duration / 60);

          // تقسيم بلد / أوتوستراد حسب القاعدة يلي اتفقنا عليها
          let cityKm, highwayKm;
          if (totalKm < 8) {
            cityKm = totalKm; highwayKm = 0;
          } else if (totalKm < 20) {
            cityKm = totalKm * 0.5; highwayKm = totalKm * 0.5;
          } else {
            cityKm = totalKm * 0.2; highwayKm = totalKm * 0.8;
          }

          setRouteCoords(route.geometry.coordinates.map(c => [c[1], c[0]]));
          const result = {
            totalKm: Number(totalKm.toFixed(2)),
            cityKm: Number(cityKm.toFixed(2)),
            highwayKm: Number(highwayKm.toFixed(2)),
            durationMin
          };
          setInfo(result);
          // نرجع البيانات لـ pricingEngine برا الخريطة
          if (onDistanceCalculated) onDistanceCalculated(result);
        }
      } catch (e) {
        console.error('OSRM error', e);
      }
      setLoading(false);
    };
    fetchRoute();
  }, [origin, dest]);

  return (
    <div className="w-full">
      <div className="flex gap-2 mb-2">
        <button 
          onClick={() => setSelecting('origin')} 
          className={`px-3 py-1 rounded text-sm ${selecting==='origin' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
        >
          📍 انطلاق {origin ? `(${origin.lat.toFixed(4)})` : ''}
        </button>
        <button 
          onClick={() => setSelecting('dest')} 
          className={`px-3 py-1 rounded text-sm ${selecting==='dest' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
        >
          🎯 وصول {dest ? `(${dest.lat.toFixed(4)})` : ''}
        </button>
        {(origin || dest) && <button onClick={() => {setOrigin(null); setDest(null); setRouteCoords([]); setInfo(null); setSelecting('origin');}} className="px-3 py-1 bg-gray-800 text-white rounded text-sm">مسح</button>}
      </div>

      <MapContainer 
        center={origin || [33.8938, 35.5018]} 
        zoom={12} 
        style={{ height: '400px', width: '100%', borderRadius: '12px' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ClickHandler onMapClick={handleMapClick} selecting={selecting} />
        {origin && <Marker position={[origin.lat, origin.lng]} icon={originIcon} />}
        {dest && <Marker position={[dest.lat, dest.lng]} icon={destIcon} />}
        {routeCoords.length > 0 && <Polyline positions={routeCoords} color="#2563eb" weight={5} />}
      </MapContainer>

      {loading && <p className="mt-2 text-sm">عم بحسب المسافة...</p>}
      {info && (
        <div className="mt-3 p-3 bg-gray-50 rounded text-sm border">
          <p>📏 كلي: {info.totalKm} كم</p>
          <p>🏘️ بلد: {info.cityKm} كم × 1.20$</p>
          <p>🛣️ أوتوستراد: {info.highwayKm} كم × 0.60$</p>
          <p>⏱️ وقت: {info.durationMin} دقيقة</p>
          <p className="text-xs text-gray-500 mt-1">*الخريطة بتحسب مسافة بس، السعر بيحسبو pricingEngine لحالو</p>
        </div>
      )}
    </div>
  );
}
