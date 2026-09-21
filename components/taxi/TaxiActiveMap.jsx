"use client"
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const driverIcon = L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', iconSize:[25,41], iconAnchor:[12,41] })
const originIcon = L.icon({ iconUrl: 'https://raw.githubusercontent.[STRIPPED 65 bytes].png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', iconSize:[25,41], iconAnchor:[12,41] })
const destIcon = L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', iconSize:[25,41], iconAnchor:[12,41] })

function FitAll({ points }){
  const map = useMap()
  useEffect(()=>{
    setTimeout(()=>{ map.invalidateSize(); if(points.length>1){ map.fitBounds(L.latLngBounds(points), {padding:[40,40]}) } }, 200)
  },[points, map])
  return null
}

export default function TaxiActiveMap({ myLocation, origin_lat, origin_lng, dest_lat, dest_lng }){
  const [routes, setRoutes] = useState({ toPickup: null, toDest: null })

  useEffect(()=>{
    if(!myLocation ||!origin_lat) return
    // خط ازرق: من موقعي لنقطة الزبون
    fetch(`https://router.project-osrm.org/route/v1/driving/${myLocation.lng},${myLocation.lat};${origin_lng},${origin_lat}?overview=full&geometries=geojson`)
     .then(r=>r.json()).then(d=>{ if(d.routes?.[0]) setRoutes(prev=>({...prev, toPickup: d.routes[0].geometry.coordinates.map(c=>[c[1],c[0]])})) }).catch(()=>{})
  },[myLocation?.lat, myLocation?.lng, origin_lat, origin_lng])

  useEffect(()=>{
    if(!origin_lat ||!dest_lat) return
    fetch(`https://router.project-osrm.org/route/v1/driving/${origin_lng},${origin_lat};${dest_lng},${dest_lat}?overview=full&geometries=geojson`)
     .then(r=>r.json()).then(d=>{ if(d.routes?.[0]) setRoutes(prev=>({...prev, toDest: d.routes[0].geometry.coordinates.map(c=>[c[1],c[0]])})) }).catch(()=>{})
  },[origin_lat, origin_lng, dest_lat, dest_lng])

  const points = []
  if(myLocation) points.push([myLocation.lat, myLocation.lng])
  points.push([Number(origin_lat), Number(origin_lng)])
  points.push([Number(dest_lat), Number(dest_lng)])

  return (
    <div style={{height:260, width:'100%'}}>
      <MapContainer center={[Number(origin_lat), Number(origin_lng)]} zoom={13} style={{height:'100%', width:'100%'}} scrollWheelZoom={true} dragging={true}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {routes.toPickup && <Polyline positions={routes.toPickup} color="#3b82f6" weight={6} dashArray="10,10" />}
        {routes.toDest && <Polyline positions={routes.toDest} color="#22c55e" weight={6} />}
        {myLocation && <Marker position={[myLocation.lat, myLocation.lng]} icon={driverIcon} />}
        <Marker position={[Number(origin_lat), Number(origin_lng)]} icon={originIcon} />
        <Marker position={[Number(dest_lat), Number(dest_lng)]} icon={destIcon} />
        <FitAll points={points} />
      </MapContainer>
    </div>
  )
}
