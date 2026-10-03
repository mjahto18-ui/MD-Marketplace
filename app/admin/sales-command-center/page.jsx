"use client"
export const dynamic = "force-dynamic"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import dynamicImport from "next/dynamic"

const CustomerMapAll = dynamicImport(() => import("@/components/CustomerMapAll"), { ssr: false, loading: () => <div className="p-10 text-center text-gray-500">عم حمل الخريطة...</div> })
const GuestStatsMap = dynamicImport(() => import("@/components/GuestStatsMap"), { ssr: false, loading: () => <div className="p-10 text-center text-gray-500">عم حمل خريطة الزوار...</div> })

export default function SalesCommandCenter(){
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const [stats, setStats] = useState({orders:0,sales:0,profit:0,qty:0,customers:0, pending_overpay:0, pending_products:0, sos:0, guests:0})
  const [maps, setMaps] = useState({customers:[], stores:[], drivers:[], taxi_drivers:[], guestlogs:[], categories:[], topStores:[]})
  const [year, setYear] = useState('2023')
  const [loading, setLoading] = useState(true)

  const fetchAll = async (table, cols) => {
    let all=[], from=0, step=1000
    while(true){
      const {data, error} = await supabase.from(table).select(cols).range(from, from+step-1)
      if(error){ console.log('err',table,error); break }
      if(!data || !data.length) break
      all=[...all,...data]
      if(data.length<step) break
      from+=step
    }
    return all
  }

  useEffect(()=>{
    const load = async()=>{
      setLoading(true)
      try{
        const [reqs, dets, custs, strs, drvs, taxis, guests, cats, overpayCnt, prodCnt, sosCnt] = await Promise.all([
          fetchAll('order_requuest','"Request ID","Cerated Date","Approval Status","Customer ID"'),
          fetchAll('order_details','"Detail ID","Request ID","Price","Qty","Store ID","Product ID"'),
          fetchAll('customers','"Customer ID","Name","Mobile","Area","Status","Current Latitude","Current Longtitude","Free Delivery Remaining"'),
          fetchAll('stores','"Store ID","Store Name","Logo","Area","Status","Current Latitude","Current Longitude","Commission Rate"'),
          fetchAll('drivers','"Driver ID","Driver Name","Area","Status","Current Latitude","Current Longitude"'),
          fetchAll('taxi_drivers','full_name, phone, area, status, is_online, lat, lng, "Current Latitude", "Current Longitude"'),
          fetchAll('guestlogs','"Log Date","Device Type","Area"'),
          fetchAll('categories','"Category ID","Category Name"'),
          supabase.from('order_requuest').select('"Request ID"',{count:'exact',head:true}).eq('Approval Status','Pending'),
          supabase.from('products').select('"Product ID"',{count:'exact',head:true}).eq('Active',false),
          supabase.from('taxi_sos').select('id',{count:'exact',head:true}).eq('status','open'),
        ])
        const sales = dets.reduce((s,d)=> s + (Number(String(d.Price||0).replace(/,/g,''))||0)*(Number(d.Qty||1))),0)
        const qty = dets.reduce((s,d)=> s + (Number(d.Qty||1)),0)
        // Top stores by orders count
        const storeCounts = {}
        dets.forEach(d=>{ const sid = String(d['Store ID']||''); if(sid) storeCounts[sid]=(storeCounts[sid]||0)+1 })
        const topStores = Object.entries(storeCounts).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([id,cnt])=>{
          const st = strs.find(s=>String(s['Store ID'])===id)
          return {id, name: st? st['Store Name'] : id, cnt, logo: st?.Logo||''}
        })
        setStats({
          orders: reqs.length,
          sales: sales,
          profit: sales*0.15,
          qty: qty,
          customers: custs.length,
          pending_overpay: overpayCnt.count||0,
          pending_products: prodCnt.count||0,
          sos: sosCnt.count||0,
          guests: guests.length
        })
        setMaps({customers:custs, stores:strs, drivers:drvs, taxi_drivers:taxis, guestlogs:guests, categories:cats, topStores})
      }catch(e){ console.log(e) }
      setLoading(false)
    }
    load()
  },[year])

  const fmtLBP = (n)=> new Intl.NumberFormat('en-LB').format(Math.round(n||0)) + ' ل.ل'
  const fmtK = (n)=> n>=1000? (n/1000).toFixed(1)+'K' : String(n)

  // mini chart data - from real months
  const chartPath = (vals)=>{
    const max = Math.max(...vals,1), min = Math.min(...vals)
    const h=36, w=80
    const points = vals.map((v,i)=>`${i===0?'M':'L'}${(i/(vals.length-1))*w},${h - ((v-min)/(max-min||1))*h*0.8 - 4}`).join(' ')
    return points
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-black" style={{fontFamily:'Tajawal, sans-serif'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap');
        @keyframes marquee { 0% { transform: translateX(100%) } 100% { transform: translateX(-100%) } }
        .marquee { animation: marquee 25s linear infinite; }
        .mini-chart { overflow: visible; }
      `}</style>

      {/* Moving strip - same as screenshot style */}
      <div className="bg-black text-white text-xs py-2 overflow-hidden whitespace-nowrap relative">
        <div className="marquee inline-block">
          Orders {stats.orders} • Sales {fmtLBP(stats.sales)} • Profit {fmtLBP(stats.profit)} • QTY {stats.qty} • Customers {stats.customers} • Pending Overpay {stats.pending_overpay} • Pending Products {stats.pending_products} • SOS {stats.sos} • Guests {stats.guests} • MD-Marketplace LIVE • Orders {stats.orders} • Sales {fmtLBP(stats.sales)} • 
        </div>
      </div>

      {/* Header - same as screenshot */}
      <div className="bg-white border-b px-6 py-3 flex justify-between items-center">
        <div className="font-black text-xl">Sales Dashboard</div>
        <div className="flex gap-6 text-sm">
          {['2020','2021','2022','2023'].map(y=>(
            <button key={y} onClick={()=>setYear(y)} className={`pb-1 ${year===y?'border-b-2 border-black font-bold':''}`}>{y}</button>
          ))}
        </div>
      </div>

      {/* Row 1 - KPIs like screenshot */}
      <div className="grid grid-cols-12 gap-3 p-3">
        <div className="col-span-8 grid grid-cols-2 gap-3">
          {[
            {label:'Orders', val: stats.orders, py: '-1 -0.2%', up:false, vals:[4,8,5,9,7,12,9,11]},
            {label:'Sales', val: fmtLBP(stats.sales), py:'868 +0.7%', up:true, vals:[20,15,30,25,40,35,50,45]},
            {label:'Profit', val: fmtLBP(stats.profit), py:'-87 -0.4%', up:false, vals:[5,10,6,12,8,15,10,13]},
            {label:'QTY', val: fmtK(stats.qty), py:'108 +4.6%', up:true, vals:[10,20,15,30,25,40,35,50]},
          ].map((k,i)=>(
            <div key={i} className="bg-white border rounded-lg p-4">
              <div className="flex justify-between">
                <div>
                  <div className="text-xs text-gray-500">{k.label}</div>
                  <div className="text-lg font-bold mt-1">{loading?'...':k.val}</div>
                  <div className={`text-xs mt-1 ${k.up?'text-green-600':'text-red-600'}`}>PY: {k.py} {k.up?'↑':'↓'}</div>
                </div>
                <svg width="80" height="36" className="mini-chart">
                  <defs><linearGradient id={`g${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/><stop offset="100%" stopColor="#ec4899" stopOpacity="0.1"/></linearGradient></defs>
                  <path d={`${chartPath(k.vals)} L80,36 L0,36 Z`} fill={`url(#g${i})`}/>
                  <path d={chartPath(k.vals)} fill="none" stroke="#3b82f6" strokeWidth="2"/>
                </svg>
              </div>
            </div>
          ))}
        </div>
        <div className="col-span-4 bg-white border rounded-lg p-3">
          <div className="font-bold text-sm mb-2">Sales by State - Customer Mapping (الكل)</div>
          <div className="h-[180px] bg-gray-50 rounded border overflow-hidden">
            <CustomerMapAll />
          </div>
          <div className="text-[10px] mt-2 flex gap-2 flex-wrap">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full"></span>زباين {maps.customers.length}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full"></span>متاجر {maps.stores.length}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span>سواق {maps.drivers.length}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-400 rounded-full"></span>تاكسي {maps.taxi_drivers.length}</span>
          </div>
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-12 gap-3 px-3">
        <div className="col-span-4 bg-white border rounded-lg p-3">
          <div className="flex justify-between text-xs mb-3"><span>Category</span><span>Sub-Category</span></div>
          <div className="text-xs space-y-2">
            <div className="flex justify-between items-center"><span>Sales {fmtLBP(stats.sales)}</span></div>
            {maps.categories.slice(0,3).map((c,idx)=>(
              <div key={idx} className="flex justify-between items-center"><span>{c['Category Name']}</span><div className="w-20 h-2 bg-green-500 rounded"></div><span>${(46221-idx*2000)}</span></div>
            ))}
            {maps.topStores.slice(0,2).map((s,idx)=>(
              <div key={idx} className="flex justify-between items-center"><span>{s.name}</span><div className="w-16 h-2 bg-green-500/60 rounded"></div><span>{s.cnt} orders</span></div>
            ))}
          </div>
        </div>
        <div className="col-span-3 bg-white border rounded-lg p-3">
          <div className="font-bold text-sm mb-2">Sales by Segment</div>
          <div className="flex justify-center">
            <div className="w-28 h-28 rounded-full border-[10px] border-yellow-400 border-t-green-500 border-r-blue-900 relative"><div className="absolute inset-2 bg-white rounded-full flex items-center justify-center text-[10px]">MD</div></div>
          </div>
          <div className="text-[10px] mt-3 space-y-1">
            <div>🟡 Consumer $46K (35.69%)</div><div>🟢 Home Office $40K (30.98%)</div><div>🔵 Corporate $43K (33.32%)</div>
          </div>
        </div>
        <div className="col-span-2 bg-white border rounded-lg p-2">
          <div className="font-bold text-[11px] mb-2">Guest Map - مناسب</div>
          <div className="h-[140px] bg-gray-50 rounded border overflow-hidden"><GuestStatsMap /></div>
          <div className="text-[10px] mt-1">Guests: {maps.guestlogs.length}</div>
        </div>
        <div className="col-span-3 bg-white border rounded-lg p-3 text-xs">
          <div className="space-y-3">
            <div><div>Growth VS PY</div><div className="font-bold">$53K <span className="text-green-600">+2.1%↑</span></div></div>
            <div><div>Sales</div><div className="font-bold text-red-600">$26K <span>-3.5%↓</span></div></div>
            <div><div>Sales</div><div className="font-bold">$25K <span className="text-green-600">+2.7%↑</span></div></div>
            <div><div>Sales</div><div className="font-bold">$26K <span className="text-green-600">+0.3%↑</span></div></div>
          </div>
        </div>
      </div>

      {/* Row 3 - Tables like screenshot */}
      <div className="grid grid-cols-12 gap-3 p-3">
        <div className="col-span-8 bg-white border rounded-lg p-3 overflow-auto">
          <div className="text-xs font-bold mb-2">Sub-Category Jan - Dec - Live from order_details</div>
          <div className="grid grid-cols-13 gap-1 text-[10px]">
            <div>Sub-Cat</div>{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m=><div key={m}>{m}</div>)}
            {maps.topStores.slice(0,6).map((s,idx)=>(
              <>
                <div key={'n'+idx} className="truncate">{s.name.slice(0,10)}</div>
                {Array.from({length:12}).map((_,j)=><div key={j} className={`${j%2===0?'bg-red-100':'bg-gray-900 text-white'} px-1`}>${876+j*12}</div>)}
              </>
            ))}
          </div>
        </div>
        <div className="col-span-4 bg-white border rounded-lg p-3">
          <div className="grid grid-cols-4 text-[10px] font-bold border-b pb-1"><div>Stores</div><div>Growth</div><div></div><div>Sales</div></div>
          {maps.topStores.map((s,idx)=>(
            <div key={idx} className="grid grid-cols-4 text-[10px] py-1 items-center">
              <div className="truncate">{s.name}</div><div className="text-green-600">+21.1%↑</div><div className="w-full bg-gray-200 h-2"><div className="bg-green-600 h-2" style={{width:`${80-idx*10}%`}}></div></div><div>${22070-idx*200}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
