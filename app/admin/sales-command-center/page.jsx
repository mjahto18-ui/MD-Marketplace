"use client"
export const dynamic = "force-dynamic"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import dynamicImport from "next/dynamic"
import BackToDashboard from "@/components/BackToDashboard"

const CustomerMapAll = dynamicImport(() => import("@/components/CustomerMapAll"), { ssr: false })
const GuestStatsMap = dynamicImport(() => import("@/components/GuestStatsMap"), { ssr: false })

export default function SalesCommandCenter(){
  const [supabase] = useState(()=>createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
  const [stats, setStats] = useState({orders:0,sales:0,profit:0,customers:0, pending_overpay:0, pending_products:0, sos:0, guests:0})
  const [maps, setMaps] = useState({customers:[], stores:[], drivers:[], taxi_drivers:[], guestlogs:[]})
  const [mapFilter, setMapFilter] = useState('all')
  const [year, setYear] = useState('اليوم')
  const [wallet, setWallet] = useState(0)

  const fetchAll = async (table, cols) => {
    let all=[], from=0, step=1000
    while(true){
      const {data} = await supabase.from(table).select(cols).range(from, from+step-1)
      if(!data || !data.length) break
      all=[...all,...data]
      if(data.length<step) break
      from+=step
    }
    return all
  }

  useEffect(()=>{
    (async()=>{
      const [reqs, dets, custs, strs, drvs, taxis, guests, overpayCnt, prodCnt, sosCnt] = await Promise.all([
        fetchAll('order_requuest','"Request ID","Cerated Date","Approval Status","Customer ID"'),
        fetchAll('order_details','"Detail ID","Request ID","Price","Qty","Store ID"'),
        fetchAll('customers','"Customer ID","Name","Mobile","Area","Status","Current Latitude","Current Longtitude"'),
        fetchAll('stores','"Store ID","Store Name","Area","Status","Current Latitude","Current Longitude","Commission Rate"'),
        fetchAll('drivers','"Driver ID","Driver Name","Status","Current Latitude","Current Longitude"'),
        fetchAll('taxi_drivers','full_name, status, is_online, lat, lng, "Current Latitude", "Current Longitude"'),
        fetchAll('guestlogs','"Log Date","Device Type","Area"'),
        supabase.from('order_requuest').select('"Request ID"',{count:'exact',head:true}).in('Approval Status',['Pending']),
        supabase.from('products').select('"Product ID"',{count:'exact',head:true}).eq('Active',false),
        supabase.from('taxi_sos').select('id',{count:'exact',head:true}).eq('status','open'),
      ])
      const sales = dets.reduce((s,d)=> s + (Number(d.Price||0)*Number(d.Qty||1)),0)
      setStats({
        orders: reqs.length,
        sales: sales,
        profit: sales*0.15,
        customers: custs.length,
        pending_overpay: overpayCnt.count||0,
        pending_products: prodCnt.count||0,
        sos: sosCnt.count||0,
        guests: guests.length
      })
      setMaps({customers:custs, stores:strs, drivers:drvs, taxi_drivers:taxis, guestlogs:guests})
      try{
        const me = await fetch('/api/admin/me').then(r=>r.json())
        if(me?.userId){
          const w = await fetch(`/api/wallet/me?userId=${me.userId}`).then(r=>r.json())
          if(w?.success) setWallet(w.wallet)
        }
      }catch{}
    })()
  },[year])

  const glass = {background:'rgba(255,255,255,0.05)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.08)'}
  const fmt = (n)=> new Intl.NumberFormat('en-LB').format(Math.round(n||0)) + ' ل.ل'

  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-4" style={{fontFamily:'Tajawal'}}>
      <div style={{...glass, borderRadius:'24px', padding:'16px'}} className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <img src="/icon-dark.png" className="w-10 h-10 rounded-xl" alt="logo"/>
          <div><div className="font-black">MD-Marketplace</div><div className="text-xs opacity-60">Sales Command Center - Manager View</div></div>
          <span className="bg-red-500/20 border border-red-500/30 px-3 py-1 rounded-full text-xs flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>LIVE</span>
        </div>
        <div className="flex gap-2">{['2022','2023','2024','اليوم'].map(y=><button key={y} onClick={()=>setYear(y)} className={`px-4 py-2 rounded-full text-sm ${year===y?'bg-white text-black font-bold':'bg-white/10'}`}>{y}</button>)}</div>
        <div className="text-xs bg-white/10 px-3 py-2 rounded-full">💰 {fmt(wallet)}</div>
      </div>

      <div style={{...glass, borderRadius:'16px', marginTop:'12px', padding:'10px'}} className="flex gap-4 text-xs">
        <span>pending-overpay: {stats.pending_overpay}</span>
        <span>pending-products: {stats.pending_products}</span>
        <span className={stats.sos>0?'text-red-400 font-bold':''}>SOS: {stats.sos}</span>
        <span>Guests: {stats.guests}</span>
      </div>

      <div className="grid grid-cols-4 gap-4 mt-4">
        <div style={{...glass, borderRadius:'24px', padding:'16px'}}><div className="text-xs opacity-60">Orders</div><div className="text-2xl font-black">{stats.orders}</div></div>
        <div style={{...glass, borderRadius:'24px', padding:'16px'}}><div className="text-xs opacity-60">Sales</div><div className="text-2xl font-black">{fmt(stats.sales)}</div></div>
        <div style={{...glass, borderRadius:'24px', padding:'16px'}}><div className="text-xs opacity-60">Profit</div><div className="text-2xl font-black">{fmt(stats.profit)}</div></div>
        <div style={{...glass, borderRadius:'24px', padding:'16px'}}><div className="text-xs opacity-60">Customers</div><div className="text-2xl font-black">{stats.customers}</div></div>
      </div>

      <div className="grid grid-cols-12 gap-4 mt-4">
        <div className="col-span-5" style={{...glass, borderRadius:'24px', padding:'12px'}}>
          <div className="flex justify-between mb-2"><span className="font-bold">🗺 Customer Mapping - الكل</span>
            <div className="flex gap-1">{['الكل','زباين','متاجر','سواق','تاكسي'].map(f=><button key={f} onClick={()=>setMapFilter(f)} className={`text-[10px] px-2 py-1 rounded-full ${mapFilter===f?'bg-white text-black':'bg-white/10'}`}>{f}</button>)}</div>
          </div>
          <div className="h-[380px] rounded-xl overflow-hidden bg-[#080811]"><CustomerMapAll /></div>
        </div>
        <div className="col-span-3" style={{...glass, borderRadius:'24px', padding:'12px'}}>
          <div className="font-bold text-sm mb-2">👥 Guest Map - مناسب</div>
          <div className="h-[280px] rounded-xl overflow-hidden bg-[#080811]"><GuestStatsMap /></div>
          <div className="text-[10px] mt-2 opacity-60">الزوار: {maps.guestlogs.length} - من guestlogs</div>
        </div>
        <div className="col-span-4 space-y-4">
          <div style={{...glass, borderRadius:'24px', padding:'16px'}}><div className="font-bold text-sm">Sales by Segment</div><div className="mt-3 text-xs">Retail / Wholesale / Taxi</div></div>
          <div style={{...glass, borderRadius:'24px', padding:'16px'}}><div className="font-bold text-sm">Top Stores</div><div className="text-xs mt-2">من stores - Commission Rate</div></div>
        </div>
      </div>
    </div>
  )
}
