"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BackToDashboard from "@/components/BackToDashboard"

export default function ReportsPage() {
  const router = useRouter();
  const [period, setPeriod] = useState("daily");
  const [storeId, setStoreId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    let url = `/api/admin/reports-amount?period=${period}`;
    if (storeId) url += `&store_id=${storeId}`;
    if (from) url += `&from=${from}`;
    if (to) url += `&to=${to}`;
    const res = await fetch(url, { credentials: 'include' });
    if(res.status === 401 || res.status === 403){
      router.push('/admin/dashboard');
      return;
    }
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  useEffect(() => {
    const checkRole = async () => {
      try{
        const r = await fetch('/api/admin/me', { credentials: 'include', cache: 'no-store' });
        if(!r.ok){
          router.push('/admin/dashboard');
          return;
        }
        const sess = await r.json();
        const role = String(sess.role || sess.Role || "").trim();
        if(!['Admin','Accounting'].includes(role)){
          router.push('/admin/dashboard');
          return;
        }
        setChecking(false);
        fetchData();
      }catch{
        router.push('/admin/dashboard');
      }
    };
    checkRole();
  }, []);

  if(checking){
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Andika:wght@400;700&display=swap');`}</style>
        <div className="px-6 py-3 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/60 font-bold tracking-widest" style={{fontFamily:'Andika'}}>عم نتأكد من الصلاحيات...</div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#0F0F0F] text-white selection:bg-[#FFD700]/30">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Andika:wght@400;700&family=JetBrains+Mono:wght@400;500&display=swap');
        *{font-family:'Andika',sans-serif}
       .mono{font-family:'JetBrains Mono',monospace!important}
       .gold-glow{box-shadow:0 0 40px rgba(255,215,0,0.15), 0 0 80px rgba(255,215,0,0.05), inset 0 1px 0 rgba(255,215,0,0.2)}
       .grid-pattern{background-image:radial-gradient(rgba(255,215,0,0.08) 1px, transparent 1px); background-size:24px 24px}
      `}</style>

      {/* HEADER نفس الخريطة */}
      <div className="sticky top-0 z-50 backdrop-blur- bg-[#0F0F0F]/80 border-b border-white/[0.06]">
        <div className="max-w- mx-auto px-6 md:px-10 h- flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackToDashboard />
            <div className="hidden md:flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFD700] flex items-center justify-center text-black font-black">MD</div>
              <div>
                <h1 className="text- font-bold tracking-[0.14em] leading-none">لوحة التقارير - REPORTS</h1>
                <div className="mono text- tracking-widest text-white/40 mt-1">ADMIN / ACCOUNTING ONLY • {period.toUpperCase()}</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-4 py-2 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/20 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FFD700] animate-pulse"></div>
              <span className="mono text- font-bold tracking-widest text-[#FFD700]">WALLET SYSTEM SECURED</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w- mx-auto px-6 md:px-10 py-8 space-y-6">

        {/* FILTERS - نفس ستايل الخريطة */}
        <div className="relative rounded- bg-[#141414] border border-white/[0.06] p-6 backdrop-blur-xl">
          <div className="absolute inset-0 grid-pattern opacity-[0.3] rounded-"></div>
          <div className="relative flex flex-wrap gap-3 items-center">
            <div className="flex gap-2">
              {[
                {k:"daily", l:"يومي"},
                {k:"weekly", l:"اسبوعي"},
                {k:"monthly", l:"شهري"},
                {k:"all", l:"الكل"},
              ].map(p=>(
                <button key={p.k} onClick={()=>setPeriod(p.k)} className={`px-5 h-11 rounded-full text- font-bold tracking-widest border transition-all ${period===p.k?"bg-[#FFD700] text-black border-[#FFD700] gold-glow":"bg-white/[0.04] border-white/[0.08] text-white/60 hover:text-white/80 hover:border-white/[0.1]"}`}>{p.l}</button>
              ))}
            </div>
            <div className="h-6 w-px bg-white/10 hidden md:block"></div>
            <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="h-11 px-4 rounded-full bg-[#0F0F0F] border border-white/[0.06] text-white/80 mono text- focus:border-[#FFD700]/30 outline-none" />
            <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="h-11 px-4 rounded-full bg-[#0F0F0F] border border-white/[0.06] text-white/80 mono text- focus:border-[#FFD700]/30 outline-none" />
            <input placeholder="Store ID (فاضي للادمن)" value={storeId} onChange={e=>setStoreId(e.target.value)} className="h-11 px-4 rounded-full bg-[#0F0F0F] border border-white/[0.06] text-white/60 mono text- w-64 focus:border-[#FFD700]/30 outline-none placeholder:text-white/20" />
            <button onClick={fetchData} className="h-11 px-8 rounded-full bg-[#FFD700] text-black font-black text- tracking-widest hover:bg-white transition-all ml-auto">عرض</button>
          </div>
        </div>

        {loading && <div className="text-center py-10 text-white/40 mono tracking-widest">عم حمّل...</div>}

        {data && (
          <>
            {/* CARDS - نفس FINANCE cards من الخريطة */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="rounded- bg-white/[0.03] border border-white/[0.06] p-5"><div className="mono text- tracking-[0.18em] text-white/40">الطلبات</div><div className="text- font-black mt-2">{data.summary.orders}</div></div>
              <div className="rounded- bg-white/[0.03] border border-white/[0.06] p-5"><div className="mono text- tracking-[0.18em] text-white/40">المبيعات</div><div className="text- font-black mt-2">{data.summary.items_cost}</div></div>
              <div className="rounded- bg-white/[0.03] border border-white/[0.06] p-5"><div className="mono text- tracking-[0.18em] text-white/40">التوصيل</div><div className="text- font-black mt-2">{data.summary.delivery_fee}</div></div>
              <div className="rounded- bg-white/[0.03] border border-white/[0.06] p-5"><div className="mono text- tracking-[0.18em] text-white/40">العمولة</div><div className="text- font-black mt-2">{data.summary.commission}</div></div>
              <div className="rounded- bg-[#0F0F0F] border border-white/[0.06] p-5"><div className="mono text- tracking-[0.18em] text-white/40">الاجمالي</div><div className="text- font-black mt-2">{data.summary.total_amount}</div></div>

              <div className="rounded- bg-[#FFD700]/[0.06] border border-[#FFD700]/20 p-5 gold-glow"><div className="mono text- tracking-[0.18em] text-[#FFD700]/60">الصافي للتجار</div><div className="text- font-black mt-2 text-[#FFD700]">{data.summary.net_for_stores}</div></div>
              <div className="rounded- bg-[#141414] border border-white/[0.06] p-5"><div className="mono text- tracking-[0.18em] text-white/40">المدفوع cash_payouts</div><div className="text- font-black mt-2 text-white/80">{data.summary.total_paid || 0}</div></div>
              <div className={`rounded- border p-5 ${ (data.summary.total_remaining||0) <=0? 'bg-white/[0.03] border-white/[0.06]' : 'bg-red-500/10 border-red-500/20'}`}><div className="mono text- tracking-[0.18em] text-white/40">الباقي المستحق</div><div className={`text- font-black mt-2 ${ (data.summary.total_remaining||0) <=0? 'text-white/50' : 'text-red-400'}`}>{data.summary.total_remaining || 0}</div></div>
              <div className="rounded- bg-[#FFD700] text-black p-5 gold-glow"><div className="mono text- tracking-[0.18em] text-black/60">صافي ربحي</div><div className="text- font-black mt-2">{data.summary.my_net}</div></div>
              <div className="rounded- bg-white/[0.02] border border-white/[0.04] p-5 flex items-center justify-center"><div className="mono text- text-white/20">SUM = ADD - DEDUCT</div></div>
            </div>

            {/* TABLE 1 */}
            <div className="rounded- bg-[#141414] border border-white/[0.06] overflow-hidden">
              <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
                <span className="mono text- tracking-[0.15em] font-bold">تفصيل حسب التاريخ - {period}</span>
                <span className="mono text- text-white/30">{data.breakdown.length} rows</span>
              </div>
              <div className="overflow-auto">
                <table className="w-full text-right">
                  <thead className="bg-[#0F0F0F] border-b border-white/[0.06]">
                    <tr className="mono text- tracking-[0.15em] text-white/40">
                      <th className="p-4 font-bold">التاريخ</th><th className="p-4">طلبات</th><th className="p-4">مبيعات</th><th className="p-4">توصيل</th><th className="p-4">عمولة</th><th className="p-4 text-[#FFD700]">اجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.breakdown.length===0 && <tr><td colSpan={6} className="p-10 text-center text-white/20 mono">ما في داتا بهالفترة</td></tr>}
                    {data.breakdown.map((r,i)=>(
                      <tr key={i} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors mono text- text-white/70">
                        <td className="p-4 font-bold text-white">{r.date}</td>
                        <td className="p-4">{r.orders}</td>
                        <td className="p-4">{r.items}</td>
                        <td className="p-4">{r.delivery}</td>
                        <td className="p-4">{r.commission}</td>
                        <td className="p-4 font-bold text-[#FFD700]">{r.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TABLE 2 */}
            <div className="rounded- bg-[#141414] border border-white/[0.06] overflow-hidden">
              <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
                <span className="mono text- tracking-[0.15em] font-bold">تفصيل المتاجر - {period} {from||to? `(${from} الى ${to})` : ""}</span>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#FFD700] animate-pulse"></div><span className="mono text- text-white/30">live wallet link</span></div>
              </div>
              <div className="overflow-auto">
                <table className="w-full text-right">
                  <thead className="bg-[#0F0F0F] border-b border-white/[0.06]">
                    <tr className="mono text- tracking-[0.15em] text-white/40">
                      <th className="p-4">المتجر</th><th className="p-4">طلبات</th><th className="p-4">اجمالي</th><th className="p-4">عمولة</th><th className="p-4 text-[#FFD700]">الصافي للدفع</th><th className="p-4">المدفوع</th><th className="p-4 text-red-400">الباقي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!data.stores_breakdown || data.stores_breakdown.length===0 && <tr><td colSpan={7} className="p-10 text-center text-white/20 mono">ما في متاجر بهالفترة</td></tr>}
                    {data.stores_breakdown?.map((s,i)=>(
                      <tr key={i} className="border-t border-white/[0.04] hover:bg-white/[0.03] transition-colors mono text-">
                        <td className="p-4 font-bold text-white">{s.store_name} <span className="text- text-white/20 ml-1">({String(s.store_id).slice(0,8)})</span></td>
                        <td className="p-4 text-white/60">{s.orders}</td>
                        <td className="p-4 text-white/60">{s.items}</td>
                        <td className="p-4 text-white/60">{s.commission}</td>
                        <td className="p-4 font-bold text-[#FFD700]">{s.net_to_pay}</td>
                        <td className="p-4 font-bold text-white/50">{s.paid || 0}</td>
                        <td className={`p-4 font-bold ${s.remaining>0? 'text-red-400' : 'text-white/30'}`}>{s.remaining}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
