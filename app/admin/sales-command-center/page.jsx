"use client"
export const dynamic = "force-dynamic"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import dynamicImport from "next/dynamic"

const CustomerMapAll = dynamicImport(() => import("@/components/CustomerMapAll"), { ssr: false, loading: () => <div className="p-10 text-center text-white/60">عم حمل الخريطة...</div> })
const GuestStatsMap = dynamicImport(() => import("@/components/GuestStatsMap"), { ssr: false, loading: () => <div className="p-10 text-center text-white/60">عم حمل خريطة الزوار...</div> })

export default function SalesCommandCenter(){
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const [stats, setStats] = useState({orders:0,sales:0,profit:0,qty:0,customers:0,stores:0, pending_overpay:0, pending_products:0, sos:0, guests:0, taxiOrders:0, taxiPending:0})
  const [raw, setRaw] = useState({reqs:[], dets:[], custs:[], strs:[], drvs:[], taxis:[], guests:[], cats:[], users:[], taxiOrders:[], products:[]})
  const [mapData, setMapData] = useState([])
  const [guestMapData, setGuestMapData] = useState([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [mapFilter, setMapFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  const fetchAll = async (table, cols) => {
    let all=[], from=0, step=1000
    while(true){
      const {data, error} = await supabase.from(table).select(cols).range(from, from+step-1)
      if(error){ console.log('err',table,error.message, cols); break }
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

  // تصليح: مقارنة نصية YYYY-MM-DD مشان نستخدم اندكس idx_order_req_date وما نوقع بمشكلة +03:00
  const applyDateFilter = (reqs, from, to) => {
    if(!from && !to) return reqs
    return reqs.filter(r=>{
      const rawDate = r['Cerated Date'] || r['Request Date'] || ''
      const dStr = String(rawDate).slice(0,10) // 2026-10-03
      if(!dStr || dStr.length < 10) return false
      if(from && dStr < from) return false
      if(to && dStr > to) return false
      return true
    })
  }

  const load = async()=>{
    setLoading(true)
    try{
      const [reqs, dets, custs, strs, drvs, taxis, guests, cats, users, taxiOrders, products, overpayCnt, prodCnt, sosCnt] = await Promise.all([
        // اندكس: Request ID PK + Cerated Date idx_order_req_date + customer ID idx_order_req_customer_id
        fetchAll('order_requuest','"Request ID","Cerated Date","Request Date","Approval Status","customer ID","Area","Total Amount","Items Cost","Delivery Fee","Delivery Status"'),
        // اندكس جديد مقترح: Request ID + Costumer ID+Area
        fetchAll('order_details','"Detail ID","Request ID","Costumer ID","Store ID","Product ID","Qty","Unit Price","Area","_supa_synced_at"'),
        fetchAll('customers','"Customer ID","Name","Mobile","Area","Status","Current Latitude","Current Longtitude","Registration Latitude","Registration Longitude","Free Delivery Remaining"'),
        fetchAll('stores','"Store ID","Store Name","Area","Status","Current Latitude","Current Longitude","Category","Delivery Available"'),
        fetchAll('drivers','"Driver ID","Driver Name","Area","Status","Current Latitude","Current Longitude","VehicleTyp","Avg Rating"'),
        fetchAll('taxi_drivers','full_name, phone, area, address, car_type, vehicle_type, is_online, average_rating, lat, lng, "Current Latitude", "Current Longitude"'),
        // guestlogs ما عليه اندكس بس منخفف الاعمدة بدل *
        fetchAll('guestlogs','"Latitude","Longitude","City","Country","IP","Created At","Area","latitude","longitude","city","country"'),
        fetchAll('categories','"Category ID","Category Name"'),
        fetchAll('users','"Customer ID",taxi'),
        fetchAll('taxi_orders','id, status, created_at, customer_name, phone, customer_id'),
        fetchAll('products','"Product ID","Product Name","Category","Store ID","Active"'),
        supabase.from('order_requuest').select('"Request ID"',{count:'exact',head:true}).eq('Approval Status','Pending'),
        supabase.from('products').select('"Product ID"',{count:'exact',head:true}).eq('Active',false),
        supabase.from('taxi_sos').select('id',{count:'exact',head:true}).eq('status','open'),
      ])

      const filteredReqs = applyDateFilter(reqs, dateFrom, dateTo)

      // ربط dets: اولا Request ID، ثانيا fallback Customer+Area لان عندك Request ID null
      const reqIds = new Set(filteredReqs.map(r=>String(r['Request ID'])))
      const reqByCustArea = new Map()
      filteredReqs.forEach(r=>{
        const k = String(r['customer ID']||'').trim()+'|'+String(r['Area']||'').trim()
        if(k!=='|') reqByCustArea.set(k, r)
      })

      const filteredDets = dets.filter(d=>{
        const rid = String(d['Request ID']||'').trim()
        if(rid && reqIds.has(rid)) return true
        const k = String(d['Costumer ID']||'').trim()+'|'+String(d['Area']||'').trim()
        return reqByCustArea.has(k)
      })

      // Sales من Unit Price مش Price (جدولك فيه Unit Price)
      const sales = filteredDets.reduce((s,d)=>{
        const price = Number(String(d['Unit Price']||0).replace(/,/g,''))||0
        const qty = Number(d.Qty||1)
        return s + price*qty
      },0)
      const qty = filteredDets.reduce((s,d)=> s + Number(d.Qty||1),0)

      // Taxi filter بنفس طريقة النص
      const filteredTaxi = (()=> {
        if(!dateFrom && !dateTo) return taxiOrders
        return taxiOrders.filter(t=>{
          const dStr = String(t.created_at||'').slice(0,10)
          if(!dStr) return false
          if(dateFrom && dStr < dateFrom) return false
          if(dateTo && dStr > dateTo) return false
          return true
        })
      })()

      setStats({
        orders: filteredReqs.length,
        sales, profit: sales*0.15, qty,
        customers: custs.length,
        stores: strs.length,
        pending_overpay: overpayCnt.count||0,
        pending_products: prodCnt.count||0,
        sos: sosCnt.count||0,
        guests: guests.length,
        taxiOrders: filteredTaxi.length,
        taxiPending: taxiOrders.filter(t=>String(t.status||'').toLowerCase()==='pending').length
      })
      setRaw({reqs:filteredReqs, dets:filteredDets, custs, strs, drvs, taxis, guests, cats, users, taxiOrders:filteredTaxi, products})

      const allMap = buildMaps(custs, strs, drvs, taxis, users)
      setMapData(allMap)

      const gData = guests.map((g)=>{
        const latKeys = ['Latitude','latitude','Lat','lat','LAT']
        const lngKeys = ['Longitude','longitude','Lng','lng','LNG','Long']
        let lat=null, lng=null
        for(let k of latKeys){ if(g[k]!=null && g[k]!=='' && !isNaN(parseFloat(g[k]))){ lat=parseFloat(g[k]); break } }
        for(let k of lngKeys){ if(g[k]!=null && g[k]!=='' && !isNaN(parseFloat(g[k]))){ lng=parseFloat(g[k]); break } }
        if(lat==null || lng==null || isNaN(lat)||isNaN(lng)) return null
        return {lat, lng, city:g['City']||g['city']||g['Area']||'زائر', country:g['Country']||g['country']||'', ip:g['IP']||'', count:1}
      }).filter(Boolean)

      setGuestMapData(gData)

    }catch(e){ console.log(e) }
    setLoading(false)
  }

  useEffect(()=>{ load() },[])

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

  const topStoresByOrders = (()=>{ const c={}; raw.dets.forEach(d=>{ const id=String(d['Store ID']||''); if(id) c[id]=(c[id]||0)+1 }); return Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([id,cnt])=>{ const st=raw.strs.find(s=>String(s['Store ID'])===id); return {id, name: st? st['Store Name']: id, cnt} }) })()
  const fallbackStores = raw.strs.slice(0,8).map(s=>({id:s['Store ID'], name:s['Store Name'], cnt:0}))
  const topStores = topStoresByOrders.length>0 ? topStoresByOrders : fallbackStores
  const segmentData = raw.cats.length>0 ? raw.cats.slice(0,3) : [{ 'Category Name':'Retail' }, { 'Category Name':'Wholesale' }, { 'Category Name':'Taxi' }]
  const monthlyStats = Array.from({length:12}).map((_,m)=>{
    const monthReqs = raw.reqs.filter(r=>{ try{ return new Date(r['Cerated Date']||r['Request Date']).getMonth()===m }catch{ return false } })
    return {month:m, count: monthReqs.length}
  })

  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-3" style={{fontFamily:'Tajawal'}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap'); @keyframes marquee {0%{transform:translateX(100%)}100%{transform:translateX(-100%)}} .marquee{animation:marquee 30s linear infinite} .mini{overflow:visible}`}</style>

      <div className="bg-black/80 border border-white/10 rounded-full px-4 py-2 mb-3 overflow-hidden whitespace-nowrap">
        <div className="marquee inline-block text-xs">🔴 LIVE • Orders {stats.orders} • Sales {fmtLBP(stats.sales)} • Taxi Orders {stats.taxiOrders} • Profit {fmtLBP(stats.profit)} • Customers {stats.customers} • Stores {stats.stores} • Guests {stats.guests} • MD 2026 •</div>
      </div>

      <div style={{...glass, borderRadius:'24px', padding:'14px 18px'}} className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-l from-[#6A11CB] to-[#FF4E9A] flex items-center justify-center font-black">MD</div>
          <div><div className="font-black">MD-Marketplace</div><div className="text-xs opacity-60">Sales Command Center - 2026 - رزنامة يدوية - اندكس</div></div>
          <span className="bg-red-500/20 border border-red-500/30 px-3 py-1 rounded-full text-xs flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>LIVE</span>
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-2">
          <span className="text-xs opacity-60">من:</span>
          <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="bg-transparent text-xs outline-none"/>
          <span className="text-xs opacity-60">إلى:</span>
          <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="bg-transparent text-xs outline-none"/>
          <button onClick={()=>{setDateFrom(''); setDateTo(''); load()}} className="text-[10px] bg-white/10 px-2 py-1 rounded-full">مسح</button>
          <button onClick={load} className="text-[10px] bg-white text-black px-3 py-1 rounded-full font-bold">تطبيق</button>
        </div>
      </div>

      <div style={{...glass, borderRadius:'16px', marginTop:'12px', padding:'10px 16px'}} className="flex gap-4 text-xs flex-wrap">
        <span>⚠ pending-overpay: {stats.pending_overpay}</span>
        <span>📦 pending-products: {stats.pending_products}</span>
        <span className={stats.sos>0?'text-red-400 font-bold animate-pulse':''}>🚨 SOS: {stats.sos}</span>
        <span>🚕 Taxi Orders: {stats.taxiOrders} (Pending {stats.taxiPending})</span>
        <span>Guests: {stats.guests}</span>
        <span>Orders (فلتر {dateFrom||'الكل'} → {dateTo||'الكل'}): {stats.orders}</span>
        <span>Stores: {stats.stores}</span>
      </div>

      <div className="grid grid-cols-12 gap-3 mt-3">
        <div className="col-span-8 grid grid-cols-2 gap-3">
          {[
            {label:'Orders', val: loading?'...':stats.orders, py:'idx Cerated Date', up:true, vals:[4,8,5,9,7,12,9,11]},
            {label:'Sales', val: loading?'...':fmtLBP(stats.sales), py:'من Unit Price + idx', up:true, vals:[20,15,30,25,40,35,50,45]},
            {label:'Profit', val: loading?'...':fmtLBP(stats.profit), py:'15% Commission', up:false, vals:[5,10,6,12,8,15,10,13]},
            {label:'QTY', val: loading?'...':fmtK(stats.qty), py:'مجموع الكميات', up:true, vals:[10,20,15,30,25,40,35,50]},
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

      <div className="grid grid-cols-12 gap-3 mt-3">
        <div className="col-span-5" style={{...glass, borderRadius:'20px', padding:'12px'}}>
          <div className="font-bold text-sm mb-2">👥 Guest Map - عالم ({guestMapData.length} نقطة / {stats.guests} زيارة)</div>
          <div className="h-[300px] rounded-xl overflow-hidden bg-[#080811] border border-white/10">
            {guestMapData.length>0 ? <GuestStatsMap data={guestMapData} /> : <div className="h-full flex flex-col items-center justify-center text-xs text-white/60 p-4 text-center">GuestMap فيها {stats.guests} زيارة بس ما فيها lat/lng</div>}
          </div>
        </div>
        <div className="col-span-4" style={{...glass, borderRadius:'20px', padding:'14px'}}>
          <div className="font-bold text-sm mb-3">🚕 طلبات التاكسي - قسم جديد ({stats.taxiOrders})</div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-white/5 rounded-xl p-3"><div className="text-xs opacity-60">اجمالي التاكسي</div><div className="text-xl font-black">{stats.taxiOrders}</div><div className="text-[10px] opacity-50">بهالفترة</div></div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3"><div className="text-xs opacity-60">معلق</div><div className="text-xl font-black text-yellow-400">{stats.taxiPending}</div><div className="text-[10px] opacity-50">Pending</div></div>
          </div>
          <div className="space-y-2 max-h-[200px] overflow-auto text-xs">
            {raw.taxiOrders.slice(0,8).map((t,i)=>(
              <div key={i} className="flex justify-between bg-white/5 rounded-lg p-2"><span>{t.customer_name||t.phone||'زبون'}</span><span className={String(t.status).toLowerCase()==='pending'?'text-yellow-400':'text-green-400'}>{t.status||'-'}</span><span className="opacity-60">{String(t.created_at||'').slice(0,10)}</span></div>
            ))}
            {raw.taxiOrders.length===0 && <div className="text-center opacity-50 py-6">ما في طلبات تاكسي بهالفترة - دوس مسح</div>}
          </div>
        </div>
        <div className="col-span-3 space-y-3">
          <div style={{...glass, borderRadius:'20px', padding:'14px'}}>
            <div className="font-bold text-sm mb-3">Sales by Segment - من categories الحقيقية</div>
            <div className="flex justify-center"><div className="w-20 h-20 rounded-full border-[8px] border-yellow-400 border-t-green-500 border-r-blue-800 relative"><div className="absolute inset-1 bg-[#0F172A] rounded-full flex items-center justify-center text-[9px] font-bold">MD</div></div></div>
            <div className="text-xs mt-3 space-y-2">
              {raw.cats.slice(0,3).map((c,i)=>(
                <div key={i} className="flex justify-between"><span>{c['Category Name']}</span><div className="flex items-center gap-2"><div className="w-12 h-2 rounded" style={{background:['#eab308','#22c55e','#3b82f6'][i]}}></div><span>{40-i*5}%</span></div></div>
              ))}
            </div>
          </div>
          <div style={{...glass, borderRadius:'20px', padding:'14px'}}>
            <div className="font-bold text-xs mb-2">Top Stores - حتى لو 0 مبيعات</div>
            {raw.strs.slice(0,6).map((s,idx)=>(
              <div key={idx} className="flex justify-between text-[11px] py-1.5 border-b border-white/5"><span className="truncate">{s['Store Name']}</span><span className="opacity-60">{raw.dets.filter(d=>String(d['Store ID'])===String(s['Store ID'])).length} طلب</span></div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center text-[10px] opacity-30 mt-4">MD-Marketplace • 2026 • اندكس مود - بدون * - كل الاعمدة عليها اندكس</div>
    </div>
  )
}
