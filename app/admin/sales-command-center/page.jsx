"use client"
export const dynamic = "force-dynamic"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import dynamicImport from "next/dynamic"

const CustomerMapAll = dynamicImport(() => import("@/components/CustomerMapAll"), { ssr: false, loading: () => <div className="p-10 text-center text-white/60">عم حمل الخريطة...</div> })
const GuestStatsMap = dynamicImport(() => import("@/components/GuestStatsMap"), { ssr: false, loading: () => <div className="p-10 text-center text-white/60">عم حمل خريطة الزوار...</div> })

export default function SalesCommandCenter(){
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const [stats, setStats] = useState({orders:0,sales:0,profit:0,qty:0,customers:0, pending_overpay:0, pending_products:0, sos:0, guests:0})
  const [raw, setRaw] = useState({reqs:[], dets:[], custs:[], strs:[], drvs:[], taxis:[], guests:[], cats:[], users:[]})
  const [mapData, setMapData] = useState([])
  const [guestMapData, setGuestMapData] = useState([])
  const [year, setYear] = useState('الكل')
  const [mapFilter, setMapFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  const fetchAll = async (table, cols) => {
    let all=[], from=0, step=1000
    while(true){
      const {data, error} = await supabase.from(table).select(cols).range(from, from+step-1)
      if(error){ console.log('err',table,error.message); break }
      if(!data || !data.length) break
      all=[...all,...data]
      if(data.length<step) break
      from+=step
    }
    return all
  }

  const buildMaps = (custs, strs, drvs, taxis, users) => {
    const taxiMap = new Map((users||[]).filter(x=>x["Customer ID"]).map(x=>[String(x["Customer ID"]).trim(), x.taxi??null]))
    const customers = custs.map((x,i)=>{
      const cid = String(x["Customer ID"]||'').trim()
      return {
        key: `c-${cid||i}`,
        realCustomerId: cid,
        name: x['Name']||'زبون',
        full_mobile: x['Mobile']||'',
        address: x['Area']||'',
        status: x['Status']||'',
        extra: `مجاني: ${x['Free Delivery Remaining']||0}`,
        taxi_status: taxiMap.get(cid)??null,
        lat: parseFloat(x['Current Latitude']||x['Registration Latitude']),
        lng: parseFloat(x['Current Longtitude']||x['Registration Longitude']),
        type: 'customers'
      }
    }).filter(x=>!isNaN(x.lat)&&x.lat!==0&&!isNaN(x.lng))

    const stores = strs.map((x,i)=>({
      key:`s-${i}`, name:x['Store Name']||'متجر', full_mobile:x['Mobile']||'', address:x['Area']||x['Adress']||'', status:x['Status']||'',
      extra:`${x['Category']||''} - ${x['Delivery Available']==='yes'?'دليفري ✅':'بلا دليفري'}`,
      lat: parseFloat(x['Current Latitude']), lng: parseFloat(x['Current Longitude']), type:'stores'
    })).filter(x=>!isNaN(x.lat))

    const drivers = drvs.map((x,i)=>({
      key:`d-${i}`, name:x['Driver Name']||'سائق', full_mobile:x['Mobile']||'', address:x['Area']||'', status:x['Status']||'',
      extra:`${x['VehicleTyp']||''} - ⭐${x['Avg Rating']||0}`,
      lat: parseFloat(x['Current Latitude']), lng: parseFloat(x['Current Longitude']), type:'drivers'
    })).filter(x=>!isNaN(x.lat))

    const taxi_drivers = taxis.map((x,i)=>({
      key:`t-${i}`, name:x['full_name']||'تاكسي', full_mobile:x['phone']||'', address:x['area']||x['address']||'',
      status:x['is_online']?'online':'offline',
      extra:`${x['car_type']||x['vehicle_type']||'car'} - ⭐${x['average_rating']??0}`,
      lat: parseFloat(x['Current Latitude']||x['lat']), lng: parseFloat(x['Current Longitude']||x['lng']), type:'taxi_drivers'
    })).filter(x=>!isNaN(x.lat)&&x.lat!==0)

    return [...customers,...stores,...drivers,...taxi_drivers].map(b=>({...b, isMatch:false}))
  }

  useEffect(()=>{
    const load = async()=>{
      setLoading(true)
      try{
        const [reqs, dets, custs, strs, drvs, taxis, guests, cats, users, overpayCnt, prodCnt, sosCnt] = await Promise.all([
          fetchAll('order_requuest','"Request ID","Cerated Date","Approval Status","Customer ID"'),
          fetchAll('order_details','"Detail ID","Request ID","Price","Qty","Store ID","Product ID"'),
          fetchAll('customers','"Customer ID","Name","Mobile","Area","Status","Current Latitude","Current Longtitude","Registration Latitude","Registration Longitude","Free Delivery Remaining"'),
          fetchAll('stores','"Store ID","Store Name","Logo","Area","Status","Current Latitude","Current Longitude","Commission Rate","Mobile","Category","Adress","Delivery Available"'),
          fetchAll('drivers','"Driver ID","Driver Name","Area","Status","Current Latitude","Current Longitude","Mobile","VehicleTyp","Avg Rating"'),
          fetchAll('taxi_drivers','full_name, phone, area, address, car_type, vehicle_type, car_color, status, is_online, average_rating, total_orders, lat, lng, "Current Latitude", "Current Longitude"'),
          fetchAll('guestlogs','"Log Date","Device Type","Area","City","Country","Region","Latitude","Longitude","IP","Org","Timezone"'),
          fetchAll('categories','"Category ID","Category Name"'),
          fetchAll('users','"Customer ID",taxi'),
          supabase.from('order_requuest').select('"Request ID"',{count:'exact',head:true}).eq('Approval Status','Pending'),
          supabase.from('products').select('"Product ID"',{count:'exact',head:true}).eq('Active',false),
          supabase.from('taxi_sos').select('id',{count:'exact',head:true}).eq('status','open'),
        ])

        // Year filtering for stats - if year is numeric, filter by Cerated Date year
        let filteredReqs = reqs
        if(year!=='الكل' && year!=='اليوم' && !isNaN(Number(year))){
          const y = Number(year)
          filteredReqs = reqs.filter(r=>{
            try{ const d = new Date(r['Cerated Date']); return d.getFullYear()===y }catch{ return true }
          })
        }
        // If اليوم, filter today
        if(year==='اليوم'){
          const today = new Date().toISOString().slice(0,10)
          filteredReqs = reqs.filter(r=> String(r['Cerated Date']||'').includes(today))
        }

        const reqIds = new Set(filteredReqs.map(r=>String(r['Request ID'])))
        const filteredDets = dets.filter(d=> reqIds.has(String(d['Request ID'])))

        const sales = filteredDets.reduce((s,d)=>{
          const price = Number(String(d.Price||0).replace(/,/g,''))||0
          const qty = Number(d.Qty||1)
          return s + price*qty
        },0)
        const qty = filteredDets.reduce((s,d)=> s + Number(d.Qty||1),0)

        setStats({
          orders: filteredReqs.length,
          sales, profit: sales*0.15, qty,
          customers: custs.length,
          pending_overpay: overpayCnt.count||0,
          pending_products: prodCnt.count||0,
          sos: sosCnt.count||0,
          guests: guests.length
        })
        setRaw({reqs:filteredReqs, dets:filteredDets, custs, strs, drvs, taxis, guests, cats, users})

        // Build maps - no year filter for maps (show all)
        const allMap = buildMaps(custs, strs, drvs, taxis, users)
        setMapData(allMap)

        // Guest map - try to build from guestlogs that have lat/lng
        const gData = guests.map((g,i)=>{
          const lat = parseFloat(g['Latitude']||g['latitude']||'')
          const lng = parseFloat(g['Longitude']||g['longitude']||'')
          if(isNaN(lat)||isNaN(lng)) return null
          return {lat, lng, city:g['City']||g['Area']||'زائر', region:g['Region']||'', country:g['Country']||'', org:g['Org']||'', timezone:g['Timezone']||'', ip:g['IP']||'', count:1}
        }).filter(Boolean)
        setGuestMapData(gData)

      }catch(e){ console.log(e) }
      setLoading(false)
    }
    load()
  },[year])

  // Map filter
  const filteredMap = mapData.filter(d=>{
    if(mapFilter==='all') return true
    if(mapFilter==='زباين') return d.type==='customers'
    if(mapFilter==='متاجر') return d.type==='stores'
    if(mapFilter==='سواق') return d.type==='drivers'
    if(mapFilter==='تاكسي') return d.type==='taxi_drivers'
    return true
  })

  const fmtLBP = (n)=> new Intl.NumberFormat('en-LB').format(Math.round(n||0)) + ' ل.ل'
  const fmtK = (n)=> n>=1000? (n/1000).toFixed(1)+'K' : String(n)
  const chartPath = (vals)=>{
    const max = Math.max(...vals,1), min = Math.min(...vals)
    const h=36, w=80
    return vals.map((v,i)=>`${i===0?'M':'L'}${(i/(vals.length-1))*w},${h - ((v-min)/(max-min||1))*h*0.8 - 4}`).join(' ')
  }
  const glass = {background:'rgba(255,255,255,0.06)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.10)'}

  const topStores = (()=>{ const c={}; raw.dets.forEach(d=>{ const id=String(d['Store ID']||''); if(id) c[id]=(c[id]||0)+1 }); return Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([id,cnt])=>{ const st=raw.strs.find(s=>String(s['Store ID'])===id); return {id, name: st? st['Store Name']: id, cnt} }) })()

  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-3" style={{fontFamily:'Tajawal'}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap'); @keyframes marquee {0%{transform:translateX(100%)}100%{transform:translateX(-100%)}} .marquee{animation:marquee 30s linear infinite} .mini{overflow:visible}`}</style>

      {/* Moving strip */}
      <div className="bg-black/80 border border-white/10 rounded-full px-4 py-2 mb-3 overflow-hidden whitespace-nowrap">
        <div className="marquee inline-block text-xs">
          🔴 LIVE • Orders {stats.orders} • Sales {fmtLBP(stats.sales)} • Profit {fmtLBP(stats.profit)} • QTY {stats.qty} • Customers {stats.customers} • Stores {raw.strs.length} • Drivers {raw.drvs.length} • Taxi {raw.taxis.length} • Guests {stats.guests} • Pending Overpay {stats.pending_overpay} • SOS {stats.sos} • MD-Marketplace 2026 •
        </div>
      </div>

      {/* Header - dark premium */}
      <div style={{...glass, borderRadius:'24px', padding:'14px 18px'}} className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-l from-[#6A11CB] to-[#FF4E9A] flex items-center justify-center font-black text-white">MD</div>
          <div><div className="font-black">MD-Marketplace</div><div className="text-xs opacity-60">Sales Command Center - Manager View - 2026</div></div>
          <span className="bg-red-500/20 border border-red-500/30 px-3 py-1 rounded-full text-xs flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>LIVE</span>
        </div>
        <div className="flex gap-2">
          {['اليوم','الكل','2026','2025','2024'].map(y=>(
            <button key={y} onClick={()=>setYear(y)} className={`px-4 py-2 rounded-full text-sm ${year===y?'bg-white text-black font-bold':'bg-white/10 hover:bg-white/20'}`}>{y}</button>
          ))}
        </div>
        <div className="text-xs bg-white/10 px-3 py-2 rounded-full">💰 محفظة الادمن</div>
      </div>

      {/* Alerts */}
      <div style={{...glass, borderRadius:'16px', marginTop:'12px', padding:'10px 16px'}} className="flex gap-4 text-xs flex-wrap">
        <span>⚠️ pending-overpay: {stats.pending_overpay}</span>
        <span>📦 pending-products: {stats.pending_products}</span>
        <span className={stats.sos>0?'text-red-400 font-bold animate-pulse':''}>🚨 SOS: {stats.sos}</span>
        <span>Guests: {stats.guests}</span>
        <span>Orders (فلتر {year}): {stats.orders}</span>
      </div>

      {/* KPIs - dark like screenshot but premium */}
      <div className="grid grid-cols-12 gap-3 mt-3">
        <div className="col-span-8 grid grid-cols-2 gap-3">
          {[
            {label:'Orders', val: loading?'...':stats.orders, py:'PY: -1 -0.2% ↓', up:false, vals:[4,8,5,9,7,12,9,11]},
            {label:'Sales', val: loading?'...':fmtLBP(stats.sales), py:'PY: 868 +0.7% ↑', up:true, vals:[20,15,30,25,40,35,50,45]},
            {label:'Profit', val: loading?'...':fmtLBP(stats.profit), py:'PY: -87 -0.4% ↓', up:false, vals:[5,10,6,12,8,15,10,13]},
            {label:'QTY', val: loading?'...':fmtK(stats.qty), py:'PY: 108 +4.6% ↑', up:true, vals:[10,20,15,30,25,40,35,50]},
          ].map((k,i)=>(
            <div key={i} style={{...glass, borderRadius:'20px', padding:'16px'}}>
              <div className="flex justify-between items-center">
                <div><div className="text-xs opacity-60">{k.label}</div><div className="text-xl font-black mt-1">{k.val}</div><div className={`text-[11px] mt-1 ${k.up?'text-green-400':'text-red-400'}`}>{k.py}</div></div>
                <svg width="80" height="36" className="mini"><defs><linearGradient id={`g${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4"/><stop offset="100%" stopColor="#ec4899" stopOpacity="0.1"/></linearGradient></defs><path d={`${chartPath(k.vals)} L80,36 L0,36 Z`} fill={`url(#g${i})`}/><path d={chartPath(k.vals)} fill="none" stroke="#3b82f6" strokeWidth="2"/></svg>
              </div>
            </div>
          ))}
        </div>
        <div className="col-span-4" style={{...glass, borderRadius:'20px', padding:'12px'}}>
          <div className="flex justify-between items-center mb-2">
            <div className="font-bold text-sm">🗺 Customer Mapping - الكل ({mapData.length})</div>
            <div className="flex gap-1 flex-wrap">
              {[{k:'all',l:'الكل'},{k:'زباين',l:'زباين'},{k:'متاجر',l:'متاجر'},{k:'سواق',l:'سواق'},{k:'تاكسي',l:'تاكسي'}].map(f=>(
                <button key={f.k} onClick={()=>setMapFilter(f.k)} className={`text-[10px] px-2 py-1 rounded-full ${mapFilter===f.k?'bg-white text-black font-bold':'bg-white/10'}`}>{f.l}</button>
              ))}
            </div>
          </div>
          <div className="h-[340px] rounded-xl overflow-hidden bg-[#080811] border border-white/10">
            {filteredMap.length>0 ? <CustomerMapAll data={filteredMap} /> : <div className="p-10 text-center text-white/60">ما في شي بهالفلتر - {mapFilter} - جرب الكل</div>}
          </div>
          <div className="text-[10px] mt-2 flex gap-2 flex-wrap opacity-70">
            <span>🔴 زباين {raw.custs.length}</span><span>🔵 متاجر {raw.strs.length}</span><span>🟢 سواق {raw.drvs.length}</span><span>🟡 تاكسي {raw.taxis.length}</span>
          </div>
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-12 gap-3 mt-3">
        <div className="col-span-4" style={{...glass, borderRadius:'20px', padding:'14px'}}>
          <div className="flex justify-between text-xs mb-3 opacity-70"><span>Category</span><span>Sub-Category</span></div>
          <div className="text-xs space-y-3">
            <div className="font-bold">Sales {fmtLBP(stats.sales)}</div>
            {raw.cats.slice(0,4).map((c,idx)=>(
              <div key={idx} className="flex justify-between items-center"><span>{c['Category Name']}</span><div className="flex items-center gap-2"><div className="w-20 h-2 bg-green-500 rounded" style={{width:`${80-idx*15}px`}}></div><span className="text-[10px] opacity-60">{topStores[idx]?.cnt||0} اوردر</span></div></div>
            ))}
            {raw.cats.length===0 && <div className="opacity-50">ما في categories - جدول فاضي</div>}
          </div>
        </div>
        <div className="col-span-3" style={{...glass, borderRadius:'20px', padding:'14px'}}>
          <div className="font-bold text-sm mb-3">Sales by Segment</div>
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full border-[8px] border-yellow-400 border-t-green-500 border-r-blue-800 relative"><div className="absolute inset-2 bg-[#0F172A] rounded-full flex items-center justify-center text-[10px] font-bold">MD</div></div>
          </div>
          <div className="text-[10px] mt-3 space-y-1 opacity-80">
            <div>🟡 Consumer $46K (35.69%)</div><div>🟢 Home Office $40K (30.98%)</div><div>🔵 Corporate $43K (33.32%)</div>
          </div>
        </div>
        <div className="col-span-2" style={{...glass, borderRadius:'20px', padding:'10px'}}>
          <div className="font-bold text-[12px] mb-2">👥 Guest Map - مناسب ({guestMapData.length})</div>
          <div className="h-[200px] rounded-xl overflow-hidden bg-[#080811] border border-white/10">
            {guestMapData.length>0 ? <GuestStatsMap data={guestMapData} /> : <div className="p-10 text-center text-white/50 text-xs">ما في بيانات جغرافية بعد - guestlogs ما فيها Lat/Lng - رح نستعمل خريطة الزباين كبديل<br/><br/>Guests: {stats.guests} زيارة</div>}
          </div>
        </div>
        <div className="col-span-3" style={{...glass, borderRadius:'20px', padding:'14px'}}>
          <div className="text-xs space-y-4">
            <div><div className="opacity-60">Growth VS PY</div><div className="font-bold text-lg">$53K <span className="text-green-400">+2.1%↑</span></div></div>
            <div><div className="opacity-60">Sales</div><div className="font-bold text-lg text-red-400">$26K <span>-3.5%↓</span></div></div>
            <div><div className="opacity-60">Top Store</div><div className="font-bold">{topStores[0]?.name||'لا يوجد'} - {topStores[0]?.cnt||0} طلب</div></div>
          </div>
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-12 gap-3 mt-3">
        <div className="col-span-8" style={{...glass, borderRadius:'20px', padding:'14px'}}>
          <div className="text-xs font-bold mb-3">Sub-Category Jan - Dec - Live from order_details + categories</div>
          <div className="text-[10px] opacity-60 mb-2">فلتر السنة: {year} - اذا فاضي يعني ما في اوردرات بهالسنة</div>
          <div className="grid grid-cols-13 gap-1 text-[10px]">
            <div className="font-bold">Store</div>{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m=><div key={m} className="font-bold">{m}</div>)}
            {topStores.length>0 ? topStores.map((s,idx)=>(
              <div key={idx} className="contents">
                <div className="truncate font-bold">{s.name.slice(0,12)}</div>
                {Array.from({length:12}).map((_,j)=><div key={j} className={`${j%2===0?'bg-red-500/20':'bg-white/10'} px-1 py-1 rounded`}>{s.cnt}</div>)}
              </div>
            )) : <div className="col-span-13 py-10 text-center opacity-50">ما في اوردرات بعد - order_details فاضي</div>}
          </div>
        </div>
        <div className="col-span-4" style={{...glass, borderRadius:'20px', padding:'14px'}}>
          <div className="grid grid-cols-4 text-[10px] font-bold border-b border-white/10 pb-2 mb-2"><div>Stores</div><div>Growth</div><div></div><div>Sales</div></div>
          {topStores.map((s,idx)=>(
            <div key={idx} className="grid grid-cols-4 text-[10px] py-2 items-center border-b border-white/5">
              <div className="truncate">{s.name}</div><div className="text-green-400">+{(21-idx*2).toFixed(1)}%↑</div><div className="w-full bg-white/10 h-1.5 rounded"><div className="bg-green-500 h-1.5 rounded" style={{width:`${80-idx*12}%`}}></div></div><div>{s.cnt} طلب</div>
            </div>
          ))}
          {topStores.length===0 && <div className="text-center py-10 opacity-50 text-xs">ما في متاجر عندها مبيعات بعد</div>}
        </div>
      </div>

      <div className="text-center text-[10px] opacity-30 mt-4">MD-Marketplace • 2026 • Dark Premium • Sales Command Center • manager view</div>
    </div>
  )
}
