'use client';
import { useEffect, useState } from 'react';

export function useGeofence(service) {
  const [status, setStatus] = useState({ loading: true, allowed: false, center: null });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await fetch('/api/check-geofence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            service
          })
        });
        const data = await res.json();
        setStatus({ loading: false,...data });
      } catch {
        setStatus({ loading: false, allowed: false, error: true });
      }
    }, () => {
      setStatus({ loading: false, allowed: false, error: 'no_location' });
    });
  }, [service]);

  return status;
}

// كومبوننت جاهزة بتسكر الخدمة لحالها
export default function GeofenceGate({ service, children, fallback }) {
  const { loading, allowed, center, distance_km } = useGeofence(service);

  if (loading) return <div className="p-4">عم نحدد موقعك...📍</div>;

  if (!allowed) {
    return fallback || (
      <div className="p-6 text-center bg-gray-100 rounded-xl">
        <h3 className="font-bold">🚫 خارج التغطية حالياً</h3>
        <p className="text-sm mt-2">خدمة الـ {service} مش متوفرة بمنطقتك بعد، قريباً منوصل لعندك!</p>
      </div>
    );
  }

  return (
    <>
      <div className="text-xs text-green-600 mb-2">✅ ضمن {center} - {distance_km}km</div>
      {children}
    </>
  );
}
