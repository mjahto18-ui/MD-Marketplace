'use client';
import { MapContainer, TileLayer, Circle, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// هذا بيصلح الـ marker المكسور
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function ClickHandler({ onAdd }) {
  useMapEvents({
    click(e) {
      const name = prompt('اسم السنتر؟ مثال: طرابلس-القبة');
      if (!name) return;
      onAdd({
        name,
        center_lat: e.latlng.lat,
        center_lng: e.latlng.lng,
        radius_cart: 1,
        radius_taxi: 3,
        radius_bot: 2,
        is_active: true,
        cart_enabled: true,
        taxi_enabled: true,
        bot_enabled: true
      });
    }
  });
  return null;
}

export default function Map({ centers, onAddCenter }) {
  return (
    <MapContainer center={[34.4367, 35.8444]} zoom={9} className="h-full w-full">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ClickHandler onAdd={onAddCenter} />
      
      {centers.map(c => (
        <div key={c.id}>
          <Marker position={[c.center_lat, c.center_lng]} />
          {c.is_active && c.cart_enabled && <Circle center={[c.center_lat, c.center_lng]} radius={c.radius_cart*1000} pathOptions={{color:'red', fillOpacity:0.1}} />}
          {c.is_active && c.taxi_enabled && <Circle center={[c.center_lat, c.center_lng]} radius={c.radius_taxi*1000} pathOptions={{color:'blue', fillOpacity:0.1}} />}
          {c.is_active && c.bot_enabled && <Circle center={[c.center_lat, c.center_lng]} radius={c.radius_bot*1000} pathOptions={{color:'orange', fillOpacity:0.1}} />}
        </div>
      ))}
    </MapContainer>
  );
}
