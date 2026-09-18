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
    // === حماية Admin / Accounting فقط - مربوطة بـ api/admin/me تبعك ===
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
    return <div dir="rtl" className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">عم نتأكد من الصلاحيات...</div>;
  }

  return (
    <div dir="rtl" className="p-6 bg-gray-50 min-h-screen">
      <BackToDashboard />
      <h1 className="text-2xl font-bold mb-6 mt-4">لوحة التقارير - Admin / Accounting Only</h1>

      <div className="bg-white p-4 rounded-xl shadow flex flex-wrap gap-3 mb-6">
        <div className="flex gap-2">
          <button onClick={()=>setPeriod("daily")} className={`px-4 py-2 rounded ${period==="daily"?"bg-green-600 text-white":"bg-gray-200"}`}>يومي</button>
          <button onClick={()=>setPeriod("weekly")} className={`px-4 py-2 rounded ${period==="weekly"?"bg-green-600 text-white":"bg-gray-200"}`}>اسبوعي</button>
          <button onClick={()=>setPeriod("monthly")} className={`px-4 py-2 rounded ${period==="monthly"?"bg-green-600 text-white":"bg-gray-200"}`}>شهري</button>
          <button onClick={()=>setPeriod("all")} className={`px-4 py-2 rounded ${period==="all"?"bg-green-600 text-white":"bg-gray-200"}`}>الكل</button>
        </div>
        <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="border p-2 rounded" />
        <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="border p-2 rounded" />
        <input placeholder="Store ID (اتركو فاضي للادمن)" value={storeId} onChange={e=>setStoreId(e.target.value)} className="border p-2 rounded w-64" />
        <button onClick={fetchData} className="bg-black text-white px-6 py-2 rounded">عرض</button>
      </div>

      {loading && <div>عم حمّل...</div>}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow"><div className="text-gray-500 text-sm">الطلبات</div><div className="text-2xl font-bold">{data.summary.orders}</div></div>
            <div className="bg-white p-4 rounded-xl shadow"><div className="text-gray-500 text-sm">المبيعات</div><div className="text-2xl font-bold">{data.summary.items_cost}</div></div>
            <div className="bg-white p-4 rounded-xl shadow"><div className="text-gray-500 text-sm">التوصيل</div><div className="text-2xl font-bold">{data.summary.delivery_fee}</div></div>
            <div className="bg-white p-4 rounded-xl shadow"><div className="text-gray-500 text-sm">العمولة</div><div className="text-2xl font-bold">{data.summary.commission}</div></div>
            <div className="bg-white p-4 rounded-xl shadow"><div className="text-gray-500 text-sm">الاجمالي</div><div className="text-2xl font-bold">{data.summary.total_amount}</div></div>
            <div className="bg-green-50 p-4 rounded-xl shadow border border-green-200"><div className="text-gray-500 text-sm">الصافي للتجار</div><div className="text-2xl font-bold text-green-700">{data.summary.net_for_stores}</div></div>
            <div className="bg-blue-50 p-4 rounded-xl shadow border border-blue-200"><div className="text-gray-500 text-sm">المدفوع (cash_payouts)</div><div className="text-2xl font-bold text-blue-700">{data.summary.total_paid || 0}</div></div>
            <div className={`p-4 rounded-xl shadow border ${ (data.summary.total_remaining||0) <=0 ? 'bg-gray-100 border-gray-200' : 'bg-red-50 border-red-200'}`}><div className="text-gray-500 text-sm">الباقي المستحق</div><div className={`text-2xl font-bold ${ (data.summary.total_remaining||0) <=0 ? 'text-gray-600' : 'text-red-600'}`}>{data.summary.total_remaining || 0}</div></div>
            <div className="bg-black text-white p-4 rounded-xl shadow"><div className="text-gray-300 text-sm">صافي ربحي (عمولة+توصيل)</div><div className="text-2xl font-bold">{data.summary.my_net}</div></div>
          </div>

          <div className="bg-white rounded-xl shadow overflow-auto mb-8">
            <div className="p-4 font-bold border-b">تفصيل حسب التاريخ - {period}</div>
            <table className="w-full text-right">
              <thead className="bg-gray-100">
                <tr><th className="p-3">التاريخ</th><th className="p-3">طلبات</th><th className="p-3">مبيعات</th><th className="p-3">توصيل</th><th className="p-3">عمولة</th><th className="p-3">اجمالي</th></tr>
              </thead>
              <tbody>
                {data.breakdown.length===0 && <tr><td colSpan={6} className="p-6 text-center text-gray-400">ما في داتا بهالفترة</td></tr>}
                {data.breakdown.map((r,i)=>(
                  <tr key={i} className="border-t">
                    <td className="p-3">{r.date}</td>
                    <td className="p-3">{r.orders}</td>
                    <td className="p-3">{r.items}</td>
                    <td className="p-3">{r.delivery}</td>
                    <td className="p-3">{r.commission}</td>
                    <td className="p-3 font-bold">{r.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-xl shadow overflow-auto">
            <div className="p-4 font-bold border-b">تفصيل المتاجر - {period} {from||to ? `(${from} الى ${to})` : ""}</div>
            <table className="w-full text-right">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3">المتجر</th>
                  <th className="p-3">طلبات</th>
                  <th className="p-3">اجمالي المبيع</th>
                  <th className="p-3">عمولة المنصة</th>
                  <th className="p-3">الصافي للدفع</th>
                  <th className="p-3 bg-blue-50">المدفوع</th>
                  <th className="p-3 bg-red-50">الباقي المستحق</th>
                </tr>
              </thead>
              <tbody>
                {!data.stores_breakdown || data.stores_breakdown.length===0 && <tr><td colSpan={7} className="p-6 text-center text-gray-400">ما في متاجر بهالفترة</td></tr>}
                {data.stores_breakdown?.map((s,i)=>(
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-bold">{s.store_name} <span className="text-xs text-gray-400">({String(s.store_id).slice(0,8)})</span></td>
                    <td className="p-3">{s.orders}</td>
                    <td className="p-3">{s.items}</td>
                    <td className="p-3">{s.commission}</td>
                    <td className="p-3 font-bold text-green-700">{s.net_to_pay}</td>
                    <td className="p-3 font-bold text-blue-700 bg-blue-50/30">{s.paid || 0}</td>
                    <td className={`p-3 font-bold ${s.remaining>0 ? 'text-red-600 bg-red-50/30' : 'text-gray-500'}`}>{s.remaining}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
