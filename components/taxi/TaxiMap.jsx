// components/taxi/TaxiMap.jsx - نهائي مع اسم تقريبي + احداثيات
'use client';
import { useState, useEffect } from 'react';
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
  useEffect(() => { setTimeout(() => map.invalidateSize(), 300); }, []);
  useEffect(() => { if (center) map.setView(center, 15); }, [center, map]);
  useEffect(() => { if (flyTo) map.flyTo(flyTo, 16, { duration: 1 }); }, [flyTo, map]);
  return null;
}
function ClickHandler({ onPick, selecting }) {
  useMapEvents({ click(e) { onPick(e.latlng, selecting); } });
  return null;
}

async function searchNominatim(q) {
  if (!q || q.length < 3) return [];
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=lb&limit=5&addressdetails=1&accept-language=ar`;
    const res = await fetch(url);
    return await res.json();
  } catch { return []; }
}

async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=ar`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data ||!data.address) return null;
    const a = data.address;
    // اسم تقريبي - اذا ما لقى شارع بيحط منطقة
    const name = data.display_name || `${a.village || a.town || a.city || a.county || 'منطقة'} - ${a.state || a.city || 'لبنان'}`;
    return { full: data.display_name, short: name, area: a.city || a.town || a.village || a.state || 'default' };
  } catch { return null; }
}

export default function TaxiMap({ onDistanceCalculated, onConfirm }) {
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
  const [showFromList, setShowFromList] = useState(false);
  const [showToList, setShowToList] = useState(false);
  const [gpsTried, setGpsTried] = useState(false);
  const [permission, setPermission] = useState('prompt');

  const requestLocation = (withMarker = false) => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = [pos.coords.latitude, pos.coords.longitude];
        setMapCenter(c);
        setFlyTo(c);
        setPermission('granted');
        setGpsTried(true);
        if (withMarker) {
          const o = { lat: pos.coords.latitude, lng: pos.coords.longitude, name: 'موقعي الحالي', display_name: 'موقعي الحالي' };
          setOrigin(o);
          setFromQuery('موقعي الحالي');
          setSelecting('dest');
          setShowFromList(false);
          // جيب اسم تقريبي بالخلفية
          reverseGeocode(pos.coords.latitude, pos.coords.longitude).then(r => {
            if (r) {
              const updated = {...o, name: r.short, display_name: r.full };
              setOrigin(updated);
              setFromQuery(r.short);
            }
          });
        }
      },
      (err) => {
        if (err.code === 1) setPermission('denied');
        else setPermission('prompt');
        setGpsTried(true);
        fetch('https://ipapi.co/json/').then(r=>r.json()).then(data=>{
          if(data.latitude) {
            const c=[data.latitude,data.longitude];
            setMapCenter(c);
            setFlyTo(c);
          }
        }).catch(()=>{});
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        setPermission(result.state);
        if (result.state === 'granted') requestLocation(false);
        else if (result.state === 'prompt') requestLocation(false);
        else setGpsTried(true);
        result.onchange = () => setPermission(result.state);
      }).catch(()=> requestLocation(false));
    } else {
      requestLocation(false);
    }
  }, []);

  const handlePick = async (latlng, mode) => {
    let name = 'نقطة على الخريطة';
    let full = `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`;
    const rev = await reverseGeocode(latlng.lat, latlng.lng);
    if (rev) {
      name = rev.short;
      full = rev.full;
    }

    if (mode === 'origin') {
      const o = { lat: latlng.lat, lng: latlng.lng, name, display_name: full };
      setOrigin(o);
      setFromQuery(name);
      setSelecting('dest');
    } else {
      const d = { lat: latlng.lat, lng: latlng.lng, name, display_name: full };
      setDest(d);
      setToQuery(name);
    }
  };

  const handleCurrentLocation = () => { requestLocation(true); };

  const handleSearchSelect = (item, type) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    const pos = [lat, lon];
    setFlyTo(pos);
    setMapCenter(pos);
    if (type === 'from') {
      const o = { lat, lng: lon, name: item.display_name, display_name: item.display_name };
      setOrigin(o);
      setFromQuery(item.display_name);
      setFromResults([]);
      setShowFromList(false);
      setSelecting('dest');
    } else {
      const d = { lat, lng: lon, name: item.display_name, display_name: item.display_name };
      setDest(d);
      setToQuery(item.display_name);
      setToResults([]);
      setShowToList(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(async () => {
      if (fromQuery.length >= 3 && showFromList) {
        const res = await searchNominatim(fromQuery);
        setFromResults(res);
      } else if (fromQuery.length < 3) setFromResults([]);
    }, 400);
    return () => clearTimeout(t);
  }, [fromQuery, showFromList]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (toQuery.length >= 3 && showToList) {
        const res = await searchNominatim(toQuery);
        setToResults(res);
      } else if (toQuery.length < 3) setToResults([]);
    }, 400);
    return () => clearTimeout(t);
  }, [toQuery, showToList]);

  useEffect(() => {
    if (!origin ||!dest) return;
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
            durationMin: Math.round(route.duration / 60),
            origin, dest,
            pickup: origin,
            drop: dest
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
    <div className="w-full flex flex-col bg-white" style={{ height: '100dvh', maxHeight: '-webkit-fill-available' }}>
      <div className="p-3 space-y-2 bg-white shadow z-[1000] shrink-0">
        <div className="relative">
          <div className="flex gap-2">
            <button onClick={handleCurrentLocation} className="shrink-0 px-3 py-3 bg-green-600 text-white rounded-xl text-sm font-bold active:scale-95">📍 موقعي</button>
            <input
              value={fromQuery}
              onChange={e => { setFromQuery(e.target.value); setShowFromList(true); setSelecting('origin'); }}
              onFocus={() => { setShowFromList(true); setSelecting('origin'); }}
              onBlur={() => setTimeout(()=>setShowFromList(false),200)}
              placeholder="من: موقعي الحالي + بحث"
              className={`flex-1 px-3 py-3 border rounded-xl text-sm outline-none ${selecting==='origin'? 'border-green-600 ring-1 ring-green-600' : 'border-gray-300'}`}
            />
          </div>
          {fromResults.length > 0 && showFromList && (
            <div className="absolute top-full mt-1 w-full bg-white border rounded-xl shadow-lg z-[1001] max-h-48 overflow-auto">
              {fromResults.map((r,i) => (
                <div key={i} onMouseDown={() => handleSearchSelect(r,'from')} className="p-3 text-sm border-b last:border-0 active:bg-gray-100 cursor-pointer">{r.display_name}</div>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <input
            value={toQuery}
            onChange={e => { setToQuery(e.target.value); setShowToList(true); setSelecting('dest'); }}
            onFocus={() => { setShowToList(true); setSelecting('dest'); }}
            onBlur={() => setTimeout(()=>setShowToList(false),200)}
            placeholder="إلى: وين بدك تروح؟"
            className={`w-full px-3 py-3 border rounded-xl text-sm outline-none ${selecting==='dest'? 'border-red-600 ring-1 ring-red-600' : 'border-gray-300'}`}
          />
          {toResults.length > 0 && showToList && (
            <div className="absolute top-full mt-1 w-full bg-white border rounded-xl shadow-lg z-[1001] max-h-48 overflow-auto">
              {toResults.map((r,i) => (
                <div key={i} onMouseDown={() => handleSearchSelect(r,'to')} className="p-3 text-sm border-b last:border-0 active:bg-gray-100 cursor-pointer">{r.display_name}</div>
              ))}
            </div>
          )}
        </div>
        {permission === 'denied' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-2 text-center">
            <p className="text-xs text-red-700 mb-1">🚫 الموقع مقفل - كبوس السماح</p>
            <button onClick={()=>requestLocation(false)} className="text-xs bg-red-600 text-white px-3 py-1 rounded-full">🔓 اطلب الاذن مرة تانية</button>
          </div>
        )}
      </div>

      <div className="flex-1 relative min-h- bg-gray-100">
        {gpsTried &&!origin && permission === 'prompt' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[800] bg-white rounded-2xl shadow-2xl p-5 w-[85%] max-w- text-center">
            <p className="text-2xl mb-2">📍</p>
            <p className="font-bold text-sm mb-1">اسمح باستخدام موقعك؟</p>
            <p className="text-xs text-gray-500 mb-3">حتى نجيبك عالخريطة دغري وين انت</p>
            <button onClick={()=>requestLocation(true)} className="w-full bg-black text-white py-3 rounded-xl font-bold text-sm">✅ السماح بالموقع</button>
          </div>
        )}
        <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" detectRetina={true} maxZoom={19} attribution='&copy; OpenStreetMap' />
          <MapController center={mapCenter} flyTo={flyTo} />
          <ClickHandler onPick={handlePick} selecting={selecting} />
          {origin && <Marker position={[origin.lat, origin.lng]} icon={originIcon} />}
          {dest && <Marker position={[dest.lat, dest.lng]} icon={destIcon} />}
          {routeCoords.length > 0 && <Polyline positions={routeCoords} color="#2563eb" weight={6} />}
        </MapContainer>
        <div className="absolute top-3 left-3 z-[500] flex gap-1">
          <button onClick={() => setSelecting('origin')} className={`px-3 py-1.5 rounded-full text-xs font-bold shadow ${selecting==='origin'? 'bg-green-600 text-white' : 'bg-white'}`}>من</button>
          <button onClick={() => setSelecting('dest')} className={`px-3 py-1.5 rounded-full text-xs font-bold shadow ${selecting==='dest'? 'bg-red-600 text-white' : 'bg-white'}`}>إلى</button>
        </div>
      </div>

      <div className="bg-white border-t rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.2)] z-[700] shrink-0">
        <div className="p-4 space-y-2">
          {loading && <p className="text-sm text-center animate-pulse">عم بحسب المسافة...</p>}
          {!origin && <p className="text-sm text-center text-gray-600">📍 كبوس <b>موقعي</b> أو حط دبوس الانطلاق</p>}
          {origin &&!dest && <p className="text-sm text-center text-gray-600">🎯 هلأ حط دبوس الوصول الأحمر</p>}
          {info && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm font-medium"><span>📏 الكلية</span><b>{info.totalKm} كم</b></div>
              <div className="flex justify-between text-xs text-gray-500"><span>🏘 {info.cityKm} بلد + 🛣 {info.highwayKm} أوتوستراد</span><span>⏱ {info.durationMin} د</span></div>
              {origin?.name && <div className="text- text-gray-400 truncate">من: {origin.name}</div>}
              {dest?.name && <div className="text- text-gray-400 truncate">إلى: {dest.name}</div>}
            </div>
          )}
        </div>
        <div className="p-3 pt-0">
          <button
            disabled={!origin ||!dest}
            onClick={() => onConfirm?.({ origin, dest, pickup: origin, drop: dest,...info })}
            className={`w-full py-4 rounded-2xl font-bold text-base ${origin && dest? 'bg-black text-white active:scale-[0.98] shadow-lg' : 'bg-gray-200 text-gray-400'}`}
          >
            {origin && dest? '🚕 اطلب تاكسي' : 'حدد الانطلاق والوصول'}
          </button>
        </div>
      </div>
    </div>
  );
}
