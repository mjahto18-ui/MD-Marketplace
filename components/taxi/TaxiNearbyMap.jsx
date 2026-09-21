"use client"
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const originIcon = L.icon({ iconUrl: 'https://raw.githubusercontent.[STRIPPED 65 bytes].png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', iconSize:[25,41], iconAnchor:[12,41] })
const destIcon = L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', iconSize:[25,41], iconAnchor:[12,41] })

export default function TaxiNearbyMap({ origin_lat, origin_lng, dest_lat, dest_lng, routeCoords }){
  return (
    <div style={{height:180, width:'100%', borderRadius:10, overflow:'hidden'}}>
      <MapContainer center={[Number(origin_lat), Number(origin_lng)]} zoom={13} style={{height:'100%', width:'100%'}} zoomControl={false} dragging={false} scrollWheelZoom={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {routeCoords && <Polyline positions={routeCoords} color="#22c55e" weight={5} />}
        <Marker position={[Number(origin_lat), Number(origin_lng)]} icon={originIcon} />
        <Marker position={[Number(dest_lat), Number(dest_lng)]} icon={destIcon} />
      </MapContainer>
    </div>
  )
}
