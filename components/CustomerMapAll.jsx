"use client";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';

if (typeof window!== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

const COLORS = {
  customers: '#ef4444',
  customers_yes: '#16a34a',
  customers_no: '#7f1d1d',
  customers_null: '#9ca3af',
  stores: '#3b82f6',
  drivers: '#15803d',
  taxi_drivers: '#facc15'
}

const getCustomerColor = (status) => {
  if(status==='yes') return COLORS.customers_yes
  if(status==='no') return COLORS.customers_no
  return COLORS.customers_null
}

const makePin = (color, textColor = 'white') => new L.DivIcon({
  html: `
    <div style="position:relative; width:24px; height:30px;">
      <div style="width:24px; height:24px; background:${color}; border-radius:50%; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center;">
        <div style="width:8px; height:8px; background:${textColor}; border-radius:50%;"></div>
      </div>
      <div style="width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:10px solid ${color}; margin:-2px auto 0 auto;"></div>
    </div>
  `,
  iconSize: [24, 30],
  iconAnchor: [12, 28],
})

const makeClusterPin = (count, color = '#1e40af') => new L.DivIcon({
  html: `
    <div style="position:relative; width:36px; height:44px;">
      <div style="width:36px; height:36px; background:${color}; border-radius:50%; border:3px solid white; box-shadow:0 3px 10px rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center;">
        <span style="color:${color==='#facc15'?'black':'white'}; font-weight:900; font-size:14px;">${count}</span>
      </div>
      <div style="width:0; height:0; border-left:8px solid transparent; border-right:8px solid transparent; border-top:12px solid ${color}; margin:-2px auto 0 auto;"></div>
    </div>
  `,
  iconSize: [36, 44],
  iconAnchor: [18, 42],
})

const makeMatchPin = (color) => new L.DivIcon({
  html: `
    <div style="position:relative; width:32px; height:40px;">
      <div style="width:32px; height:32px; background:${color}; border-radius:50%; border:3px solid yellow; box-shadow:0 0 15px red; display:flex; align-items:center; justify-content:center;">
        <div style="width:10px; height:10px; background:white; border-radius:50%;"></div>
      </div>
      <div style="width:0; height:0; border-left:7px solid transparent; border-right:7px solid transparent; border-top:11px solid ${color}; margin:-2px auto 0 auto;"></div>
    </div>
  `,
  iconSize: [32, 40],
  iconAnchor: [16, 38],
})

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const dLat = (lat2-lat1) * Math.PI/180;
  const dLon = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function FitAll({ data }){
  const map = useMap();
  useEffect(()=>{
    if(!data || data.length===0) return
    const points = data.map(c=> [c.lat, c.lng]).filter(p=> p[0] && p[1])
    if(points.length===0) return
    if(points.length===1) map.setView(points[0], 16)
    else map.fitBounds(points, {padding:[60,60]})
  }, [data]);
  return null
}

export default function CustomerMapAll({ data = [] }) {
  const [localData, setLocalData] = useState(data)
  const [updating, setUpdating] = useState(null)

  useEffect(()=>{ setLocalData(data) }, [data])

  if(localData.length===0) return <div className="p-10 text-center text-gray-500">ما في شي بهالفلتر</div>

  const handleTaxiUpdate = async (item, newStatus) => {
    if(!item.realCustomerId){
      alert('ما في Customer ID مربوط - مثال 5555')
      return
    }
    setUpdating(item.key)
    try{
      const res = await fetch('/api/taxi-status', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ customerId: item.realCustomerId, taxi: newStatus })
      })
      const j = await res.json()
      if(!res.ok) throw new Error(j.message || 'فشل التحديث')
      setLocalData(prev => prev.map(p => p.key===item.key? {...p, taxi_status: newStatus} : p))
    }catch(e){
      alert('خطأ: ' + e.message)
    }finally{
      setUpdating(null)
    }
  }

  const matched = localData.filter(d=> d.isMatch)
  const rest = localData.filter(d=>!d.isMatch)

  const grouped = [];
  rest.forEach((item)=>{
    if(!item.lat ||!item.lng) return
    let found = null;
    for(let g of grouped){
      const dist = getDistance(item.lat, item.lng, g.lat, g.lng);
      if(dist <= 200){
        found = g;
        break;
      }
    }
    if(found){
      found.count += 1;
      found.lat = (found.lat * (found.count-1) + Number(item.lat)) / found.count;
      found.lng = (found.lng * (found.count-1) + Number(item.lng)) / found.count;
      found.items.push(item);
    } else {
      grouped.push({
        lat: Number(item.lat),
        lng: Number(item.lng),
        count: 1,
        items: [item],
        type: item.type
      });
    }
  });

  const finalPoints = [
...grouped,
...matched.map(m=> ({ lat: m.lat, lng: m.lng, count: 1, items: [m], isMatch: true }))
  ];

  if(finalPoints.length===0) return <div className="p-10 text-center text-gray-500">ما في نقاط صالحة</div>
  const center = [finalPoints[0].lat, finalPoints[0].lng];

  const TaxiBadge = ({ status }) => {
    const s = status?? 'null'
    const color = s==='yes'? 'bg-green-600' : s==='no'? 'bg-red-600' : 'bg-gray-400'
    const label = s==='yes'? 'TAXI YES' : s==='no'? 'TAXI NO' : 'TAXI NULL'
    return <span className={`text- px-2 py-0.5 rounded-full text-white font-bold ${color}`}>{label}</span>
  }

  return (
    <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FitAll data={finalPoints} />
      {finalPoints.map((group, idx)=>{
        const isSingle = group.count === 1;
        const item = group.items[0];
        const isMatch = group.isMatch || item.isMatch;
        const baseColor = item.type==='customers'? getCustomerColor(item.taxi_status) : (COLORS[item.type] || COLORS.customers);
        const textColor = item.type==='taxi_drivers'? 'black' : 'white';

        let icon;
        if(isMatch) icon = makeMatchPin(baseColor);
        else if(isSingle) icon = makePin(baseColor, textColor);
        else {
          const types = group.items.map(i=>i.type);
          const mostCommon = types.sort((a,b)=> types.filter(v=>v===a).length - types.filter(v=>v===b).length).pop();
          const clusterColor = mostCommon==='customers'? '#16a34a' : (COLORS[mostCommon] || '#1e40af');
          icon = makeClusterPin(group.count, clusterColor);
        }

        return (
          <Marker key={item.key || `group-${idx}`} position={[group.lat, group.lng]} icon={icon}>
            <Popup>
              {group.count > 1 &&!isMatch? (
                <div className="text-sm" style={{minWidth: '280px'}}>
                  <div className="font-bold">📍 {group.count} نقاط بـ 200 متر</div>
                  <div className="text-xs mt-2 space-y-1 max-h-60 overflow-y-auto">
                    {group.items.slice(0,15).map((it,i)=>(
                      <div key={it.key || i} className="flex items-center justify-between gap-2 border-b py-1">
                        <div className="flex items-center gap-2">
                          <span style={{width: '8px', height: '8px', background: it.type==='customers'? getCustomerColor(it.taxi_status) : COLORS[it.type], borderRadius: '50%', display: 'inline-block'}}></span>
                          <span>{it.type==='stores'?'🏪':it.type==='drivers'?'🛵':it.type==='taxi_drivers'?'🚕':'👤'} {it.name}</span>
                          <span className="text- text-gray-500">{it.mobile}</span>
                        </div>
                        {it.type==='customers' && <TaxiBadge status={it.taxi_status} />}
                      </div>
                    ))}
                    {group.items.length>15 && <div className="text-gray-400">+ {group.items.length-15} بعد</div>}
                  </div>
                </div>
              ) : (
                <div className="text-sm" style={{minWidth: '260px'}}>
                  <div className="font-bold flex items-center gap-2" style={{color: baseColor}}>
                    <span style={{width: '10px', height: '10px', background: baseColor, borderRadius: '50%', display: 'inline-block'}}></span>
                    {item.type==='stores'?'🏪':item.type==='drivers'?'🛵':item.type==='taxi_drivers'?'🚕':'👤'} {item.name}
                    {isMatch && <span className="bg-red-500 text-white text-xs px-2 rounded-full">MATCH</span>}
                  </div>

                  <div className="mt-1">📞 {item.mobile} - ID:{item.realCustomerId||''}</div>
                  <div className="text-xs text-gray-700 mt-1 bg-gray-50 p-1 rounded">{item.extra}</div>
                  <div className="text-xs text-gray-600 mt-1">📍 {item.address || ''}</div>

                  {item.type==='customers' && (
                    <div className="mt-3 border-t pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">حالة التاكسي (users.taxi):</span>
                        <TaxiBadge status={item.taxi_status} />
                      </div>
                      <div className="flex gap-1 mt-2">
                        <button disabled={updating===item.key} onClick={()=>handleTaxiUpdate(item, 'yes')} className="flex-1 bg-green-600 disabled:opacity-50 text-white text-xs font-bold px-2 py-1.5 rounded-full hover:bg-green-700">YES</button>
                        <button disabled={updating===item.key} onClick={()=>handleTaxiUpdate(item, 'no')} className="flex-1 bg-red-600 disabled:opacity-50 text-white text-xs font-bold px-2 py-1.5 rounded-full hover:bg-red-700">NO</button>
                        <button disabled={updating===item.key} onClick={()=>handleTaxiUpdate(item, null)} className="flex-1 bg-gray-500 disabled:opacity-50 text-white text-xs font-bold px-2 py-1.5 rounded-full hover:bg-gray-600">NULL</button>
                      </div>
                      {updating===item.key && <div className="text- text-center mt-1 text-gray-500">عم حدث...</div>}
                      <div className="text- text-gray-400 mt-1">YES=اخضر مفتوح | NO=احمر بلوك | NULL=رمادي</div>
                    </div>
                  )}

                  <div className="text- text-gray-400 mt-2">{item.lat.toFixed(5)}, {item.lng.toFixed(5)}</div>
                </div>
              )}
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  );
}
