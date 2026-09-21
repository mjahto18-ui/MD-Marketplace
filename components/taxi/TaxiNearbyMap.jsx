"use client"
import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const originIcon = L.icon({ iconUrl: 'https://raw.githubusercontent.[STRIPPED 65 bytes].png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', iconSize:[25,41], iconAnchor:[12,41] })
const destIcon = L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', iconSize:[25,41], iconAnchor:[12,41] })

function FitBounds({ origin_lat, origin_lng, dest_lat, dest_lng }){
  const map = useMap()
  useEffect(()=>{
    setTimeout(()=>{ map.invalidateSize(); const bounds = L.latLngBounds([[origin_lat, origin_lng],[dest_lat, dest_lng]]); map.fitBounds(bounds, {padding:[30,30]}) }, 200)
  },[origin_lat, origin_lng, dest_lat, dest_lng, map])
  return null
}

export default function TaxiNearbyMap({ origin_lat, origin_lng, dest_lat, dest_lng, routeCoords }){
  return (
    <div style={{height:220, width:'100%'}}>
      <MapContainer center={[Number(origin_lat), Number(origin_lng)]} zoom={13} style={{height:'100%', width:'100%'}} scrollWheelZoom={true} dragging={true} zoomControl={true}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {routeCoords && <Polyline positions={routeCoords} color="#22c55e" weight={5} />}
        <Marker position={[Number(origin_lat), Number(origin_lng)]} icon={originIcon} />
        <Marker position={[Number(dest_lat), Number(dest_lng)]} icon={destIcon} />
        <FitBounds origin_lat={origin_lat} origin_lng={origin_lng} dest_lat={dest_lat} dest_lng={dest_lng} />
      </MapContainer>
    </div>
  )
}
