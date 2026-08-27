"use client"
import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ايقونات
const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41]
})
const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41]
})

function ChangeView({center, drivers}){
  const map = useMap()
  useEffect(()=>{
    const points = [center]
    drivers.forEach(d=>{
      const lat = parseFloat(d['Current Latitude'] || d.lat)
      const lng = parseFloat(d['Current Longitude'] || d.lng)
      if(!isNaN(lat)) points.push([lat,lng])
    })
    if(points.length>1) map.fitBounds(points, {padding:[50,50]})
    else map.setView(center, 15)
  }, [center, drivers])
  return null
}

export default function AdminPendingMap({ order, drivers = [], onAssign }){
  if(!order) return null
  const center = [order.customerLat, order.customerLng]

  const handleAssign = (d)=>{
    const name = d['Driver Name'] || d.Name || d['Driver ID']
    if(!confirm(`تأكيد تعيين السائق ${name} للطلب #${order.requestID} ؟`)) return
    onAssign(d)
  }

  return (
    <div className="h-full w-full relative">
      <MapContainer center={center} zoom={15} style={{height:'100%', width:'100%'}}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ChangeView center={center} drivers={drivers} />

        <Marker position={center} icon={customerIcon}>
          <Popup>
            <b>{order.customerName}</b><br/>
            {order.mobile}<br/>
            Request: {order.requestID}
          </Popup>
        </Marker>

        {drivers.map(d=>{
          const lat = parseFloat(d['Current Latitude'] || d.lat)
          const lng = parseFloat(d['Current Longitude'] || d.lng)
          const name = d['Driver Name'] || d.Name || d['Driver ID']
          if(isNaN(lat) || isNaN(lng)) return null
          return (
            <Marker key={d['Driver ID'] || d.driverId} position={[lat, lng]} icon={driverIcon}>
              <Popup>
                <b>{name}</b><br/>
                {getDistance(center[0], center[1], lat, lng)}<br/>
                <button onClick={()=>handleAssign(d)} className="bg-purple-600 text-white px-3 py-1 rounded mt-2">عيّن هالسائق</button>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      <div className="absolute top-4 right-4 z-[1000] bg-black/80 text-white p-3 rounded-xl text-sm w-64">
        <p className="font-bold">طلب #{order.requestID?.slice(-6)}</p>
        <p>{order.customerName} - {order.mobile}</p>
        <div className="mt-3">
          <p className="font-bold">سائقين اونلاين ({drivers.length}):</p>
          {drivers.map(d=>{
            const name = d['Driver Name'] || d.Name || d['Driver ID']
            const lat = parseFloat(d['Current Latitude'] || d.lat)
            const lng = parseFloat(d['Current Longitude'] || d.lng)
            return (
              <div key={d['Driver ID']} className="flex justify-between items-center mt-2 bg-white/10 p-2 rounded">
                <span>{name} {isNaN(lat)?'':`(${lat.toFixed(3)})`}</span>
                <button onClick={()=>handleAssign(d)} className="bg-green-500 px-2 py-1 rounded text-xs">عيّن</button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function getDistance(lat1,lng1,lat2,lng2){
  const R=6371
  const dLat=(lat2-lat1)*Math.PI/180
  const dLng=(lng2-lng1)*Math.PI/180
  const a=Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return (R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))).toFixed(1)+' كم'
}
