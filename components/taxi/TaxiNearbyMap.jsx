"use client"
import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// استعملنا jsdelivr مشان ما ينكسر متل github
const driverIcon = L.icon({
  iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.1/images/marker-shadow.png',
  iconSize:[25,41], iconAnchor:[12,41]
})
const originIcon = L.icon({
  iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.1/images/marker-shadow.png',
  iconSize:[25,41], iconAnchor:[12,41]
})
const destIcon = L.icon({
  iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.1/images/marker-shadow.png',
  iconSize:[25,41], iconAnchor:[12,41]
})

function FitBounds({ points }){
  const map = useMap()
  useEffect(()=>{
    setTimeout(()=>{
      map.invalidateSize()
      if(points.length > 1){
        map.fitBounds(L.latLngBounds(points), {padding:[40,40]})
      }
    }, 200)
  },[points, map])
  return null
}

export default function TaxiNearbyMap({ myLocation, origin_lat, origin_lng, dest_lat, dest_lng, routeCoords }){
  const points = []
  if(myLocation) points.push([myLocation.lat, myLocation.lng])
  points.push([Number(origin_lat), Number(origin_lng)])
  points.push([Number(dest_lat), Number(dest_lng)])

  return (
    <div style={{height:220, width:'100%', position:'relative', zIndex:0}}>
      <MapContainer center={[Number(origin_lat), Number(origin_lng)]} zoom={13} style={{height:'100%', width:'100%'}} scrollWheelZoom={true} dragging={true} zoomControl={true}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {routeCoords && <Polyline positions={routeCoords} color="#22c55e" weight={5} />}
        {myLocation && <Marker position={[myLocation.lat, myLocation.lng]} icon={driverIcon} />}
        <Marker position={[Number(origin_lat), Number(origin_lng)]} icon={originIcon} />
        <Marker position={[Number(dest_lat), Number(dest_lng)]} icon={destIcon} />
        <FitBounds points={points} />
      </MapContainer>
    </div>
  )
}
