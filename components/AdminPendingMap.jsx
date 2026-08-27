"use client"
import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ايقونات
const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41]
})
const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41]
})

function ChangeView({center}){
  const map = useMap()
  useEffect(()=>{ map.setView(center, 15) }, [center])
  return null
}

export default function AdminPendingMap({ order, drivers = [], onAssign }){
  if(!order) return null
  const center = [order.customerLat, order.customerLng]

  return (
    <div className="h-full w-full relative">
      <MapContainer center={center} zoom={15} style={{height:'100%', width:'100%'}}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ChangeView center={center} />

        <Marker position={center} icon={customerIcon}>
          <Popup>
            <b>{order.customerName}</b><br/>
            {order.mobile}<br/>
            Request: {order.requestID}
          </Popup>
        </Marker>

        {drivers.map(d=> d.lat && d.lng && (
          <Marker key={d['Driver ID']} position={[d.lat, d.lng]} icon={driverIcon}>
            <Popup>
              <b>{d.Name}</b><br/>
              <button onClick={()=>onAssign(d)} className="bg-purple-600 text-white px-3 py-1 rounded mt-2">عيّن هالسائق</button>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="absolute top-4 right-4 z-[1000] bg-black/80 text-white p-3 rounded-xl text-sm w-">
        <p className="font-bold">طلب #{order.requestID?.slice(-6)}</p>
        <p>{order.customerName} - {order.mobile}</p>
        <div className="mt-3">
          <p className="font-bold">سائقين اونلاين ({drivers.length}):</p>
          {drivers.map(d=>(
            <div key={d['Driver ID']} className="flex justify-between items-center mt-2 bg-white/10 p-2 rounded">
              <span>{d.Name}</span>
              <button onClick={()=>onAssign(d)} className="bg-green-500 px-2 py-1 rounded text-xs">عيّن</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
