// components/taxi/TaxiMap.jsx - نسخة موبايل 100% - منطق: البحث بيطير الخريطة بس، الدبوس بينحط بالكبس
'use client';
import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const originIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [28, 45], iconAnchor: [14, 45]
});
const destIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [28, 45], iconAnchor: [14, 45]
});

function MapController({ center, flyTo }) {
  const map = useMap();
  useEffect(() => { if (center) map.setView(center, 14); }, [center]);
  useEffect(() => { if (flyTo) map.flyTo(flyTo, 16); }, [flyTo]);
  return null;
}
function ClickHandler({ onPick, selecting }) {
  useMapEvents({ click(e) { onPick(e.latlng, selecting); } });
  return null;
}

async function searchNominatim(q) {
  if (!q || q.length < 3) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=lb&limit=5&addressdetails=1`;
  const res = await fetch(url);
  return await res.json();
}

export default function TaxiMap({ onDistanceCalculated }) {
  const [origin, setOrigin] = useState(null);
  const [dest, setDest] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [info, setInfo] = useState(null);
  const [selecting, setSelecting] = useState('origin');
  const [mapCenter, setMapCenter] = useState([33.8938, 35.5018]);
  const [flyTo, setFlyTo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [fromResults, setFromResults] = useState([]);
  const [toResults, setToResults] = useState([]);
  const [gpsReady, setGpsReady] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c = [pos.coords.latitude, pos.coords.longitude];
          setMapCenter(c);
          setGpsReady(true);
        },
        () => setGpsReady(true)
      );
    }
  }, []);

  const handlePick = (latlng, mode) => {
    if (mode === 'origin') {
      setOrigin(latlng);
      setSelecting('dest');
    } else {
      setDest(latlng);
    }
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setOrigin(p);
        setMapCenter([p.lat, p.lng]);
        setFlyTo([p.lat, p.lng]);
        setSelecting('dest');
      });
    }
  };

  const handleSearchSelect = (item, type) => {
    const pos = [parseFloat(item.lat), parseFloat(item.lon)];
    setFlyTo(pos);
    setMapCenter(pos);
    if (type === 'from') {
      setFromQuery(item.display_name);
      setFromResults([]);
      setSelecting('origin');
    } else {
      setToQuery(item.display_name);
      setToResults([]);
      setSelecting('dest');
    }
  };

  useEffect(() => {
    const t = setTimeout(async () => {
      if (fromQuery.length >= 3) setFromResults(await searchNominatim(fromQuery));
    }, 400);
    return () => clearTimeout(t);
  }, [fromQuery]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (toQuery.length >= 3) setToResults(await searchNominatim(toQuery));
    }, 400);
    return () => clearTimeout(t);
  }, [toQuery]);

  useEffect(() => {
    if (!origin || !dest) return;
    const fetchRoute = async () => {
      setLoading(true);
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes?.[0]) {
          const route = data.routes[0];
          const totalKm = route.distance / 1000;
          let cityKm, highwayKm;
          if (totalKm < 8) { cityKm = totalKm; highwayKm = 0; }
          else if (totalKm < 20) { cityKm = totalKm * 0.5; highwayKm = totalKm * 0.5; }
          else { cityKm = totalKm * 0.2; highwayKm = totalKm * 0.8; }
          setRouteCoords(route.geometry.coordinates.map(c => [c[1], c[0]]));
          const result = {
            totalKm: Number(totalKm.toFixed(2)),
            cityKm: Number(cityKm.toFixed(2)),
            highwayKm: Number(highwayKm.toFixed(2)),
            durationMin: Math.round(route.duration / 60)
          };
          setInfo(result);
          onDistanceCalculated?.(result);
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchRoute();
  }, [origin, dest]);

  return (
    <div className="w-full h-[100dvh] flex flex-col bg-white md:h-auto">
      <div className="p-3 space-y-2 bg-white shadow-sm z-[1000]">
        <div className="relative">
          <div className="flex gap-2">
            <button onClick={handleCurrentLocation} className="shrink-0 px-3 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold">📍 موقعي</button>
            <input
              value={fromQuery}
              onChange={e => { setFromQuery(e.target.value); setSelecting('origin'); }}
              onFocus={() => setSelecting('origin')}
              placeholder="من: موقعي الحالي + بحث"
              className={`flex-1 px-3 py-2.5 border rounded-xl text-sm ${selecting==='origin' ? 'border-green-600 ring-1 ring-green-600' : 'border-gray-300'}`}
            />
          </div>
          {fromResults.length > 0 && selecting==='origin' && (
            <div className="absolute top-full mt-1 w-full bg-white border rounded-xl shadow-lg z-[1001] max-h-40 overflow-auto">
              {fromResults.map((r,i) => (
                <div key={i} onClick={() => handleSearchSelect(r,'from')} className="p-2.5 text-sm border-b last:border-0 active:bg-gray-100">{r.display_name}</div>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <input
            value={toQuery}
            onChange={e => { setToQuery(e.target.value); setSelecting('dest'); }}
            onFocus={() => setSelecting('dest')}
            placeholder="إلى: وين بدك تروح؟ (بحث بس)"
            className={`w-full px-3 py-2.5 border rounded-xl text-sm ${selecting==='dest' ? 'border-red-600 ring-1 ring-red-600' : 'border-gray-300'}`}
          />
          {toResults.length > 0 && selecting==='dest' && (
            <div className="absolute top-full mt-1 w-full bg-white border rounded-xl shadow-lg z-[1001] max-h-40 overflow-auto">
              {toResults.map((r,i) => (
                <div key={i} onClick={() => handleSearchSelect(r,'to')} className="p-2.5 text-sm border-b last:border-0 active:bg-gray-100">{r.display_name}</div>
              ))}
            </div>
          )}
        </div>
        <p className="text-[11px] text-gray-500 text-center">البحث بيقرب الخريطة بس — الدبوس بتحطو انت بإيدك عالخريطة</p>
      </div>

      <div className="flex-1 relative">
        <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapController center={mapCenter} flyTo={flyTo} />
          <ClickHandler onPick={handlePick} selecting={selecting} />
          {origin && <Marker position={[origin.lat, origin.lng]} icon={originIcon} />}
          {dest && <Marker position={[dest.lat, dest.lng]} icon={destIcon} />}
          {routeCoords.length > 0 && <Polyline positions={routeCoords} color="#2563eb" weight={6} />}
        </MapContainer>
        <div className="absolute top-3 left-3 z-[500] flex gap-1">
          <button onClick={() => setSelecting('origin')} className={`px-3 py-1.5 rounded-full text-xs font-bold shadow ${selecting==='origin' ? 'bg-green-600 text-white' : 'bg-white'}`}>من</button>
          <button onClick={() => setSelecting('dest')} className={`px-3 py-1.5 rounded-full text-xs font-bold shadow ${selecting==='dest' ? 'bg-red-600 text-white' : 'bg-white'}`}>إلى</button>
        </div>
      </div>

      <div className="p-3 bg-white border-t rounded-t-2xl -mt-4 z-[600] shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        {loading && <p className="text-sm text-center">عم بحسب المسافة...</p>}
        {!origin && <p className="text-sm text-center text-gray-500">كبوس 📍 موقعي أو حط دبوس الانطلاق الأخضر</p>}
        {origin && !dest && <p className="text-sm text-center text-gray-500">هلأ حط دبوس الوصول الأحمر وين بدك تروح</p>}
        {info && (
          <div className="text-sm">
            <div className="flex justify-between"><span>📏 المسافة:</span><b>{info.totalKm} كم</b></div>
            <div className="flex justify-between text-xs text-gray-500"><span>بلد {info.cityKm} + أوتوستراد {info.highwayKm}</span><span>⏱️ {info.durationMin}د</span></div>
          </div>
        )}
      </div>
    </div>
  );
}
