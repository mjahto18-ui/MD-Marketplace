"use client";
import { useState, useEffect } from "react";

export default function ReportsPage() {
  const [period, setPeriod] = useState("daily");
  const [storeId, setStoreId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    let url = `/api/admin/reports-amount?period=${period}`;
    if (storeId) url += `&store_id=${storeId}`;
    if (from) url += `&from=${from}`;
    if (to) url += `&to=${to}`;
    const res = await fetch(url);
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div dir="rtl" className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">لوحة التقارير</h1>

      {/* فلاتر */}
      <div className="bg-white p-4 rounded-xl shadow flex flex-wrap gap-3 mb-6">
        <div className="flex gap-2">
          <button onClick={()=>setPeriod("daily")} className={`px-4 py-2 rounded ${period==="daily"?"bg-green-600 text-white":"bg-gray-200"}`}>يومي</button>
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
          {/* ملخص */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow"><div className="text-gray-500 text-sm">الطلبات</div><div className="text-2xl font-bold">{data.summary.orders}</div></div>
            <div className="bg-white p-4 rounded-xl shadow"><div className="text-gray-500 text-sm">المبيعات</div><div className="text-2xl font-bold">{data.summary.items_cost}</div></div>
            <div className="bg-white p-4 rounded-xl shadow"><div className="text-gray-500 text-sm">التوصيل</div><div className="text-2xl font-bold">{data.summary.delivery_fee}</div></div>
            <div className="bg-white p-4 rounded-xl shadow"><div className="text-gray-500 text-sm">العمولة {data.summary.commission===0 && "(تجربة)"}</div><div className="text-2xl font-bold">{data.summary.commission}</div></div>
            <div className="bg-white p-4 rounded-xl shadow"><div className="text-gray-500 text-sm">الاجمالي</div><div className="text-2xl font-bold">{data.summary.total_amount}</div></div>
            <div className="bg-green-50 p-4 rounded-xl shadow border border-green-200"><div className="text-gray-500 text-sm">الصافي للتجار</div><div className="text-2xl font-bold text-green-700">{data.summary.net_for_stores}</div></div>
          </div>

          {/* جدول */}
          <div className="bg-white rounded-xl shadow overflow-auto">
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
        </>
      )}
    </div>
  );
}
