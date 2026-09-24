'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Search, Store, Package, MapPin, Link as LinkIcon, Image as ImageIcon, DollarSign, Clock, Users, Send, Check } from 'lucide-react';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function BroadcastPage() {
  const router = useRouter();
  const [list, setList] = useState([]);
  const [areas, setAreas] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [sending, setSending] = useState(false);

  const [qArea, setQArea] = useState("");
  const [qStore, setQStore] = useState("");
  const [qProd, setQProd] = useState("");

  const [form, setForm] = useState({
    title: "", message: "", audience: "All", areaIds: [],
    storeId: "", productId: "", price: "", image: "", btnText: "", deepLink: "", schedule: "",
  });

  const firstLoad = useRef(true);

  const load = useCallback(async () => {
    if (firstLoad.current) setLoading(true);
    try {
      const res = await supabase.from("broadcast").select("*").order("Created At", { ascending: false }).limit(50);
      if (res.error) console.error("load broadcast error", res.error);
      setList(res.data || []);

      const resArea = await supabase.from("areas").select(`"Area ID","Area Name"`).eq("Active", "Active");
      if (resArea.error) console.error("load areas error", resArea.error);
      setAreas(resArea.data || []);
    } finally {
      setLoading(false);
      firstLoad.current = false;
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const searchStores = async (v) => {
    setQStore(v);
    if (v.length < 2) { setStores([]); return; }
    const res = await supabase.from("stores").select(`"Store ID","Store Name","Logo"`).ilike("Store Name", `%${v}%`).limit(5);
    setStores(res.data || []);
  };

  const searchProducts = async (v) => {
    setQProd(v);
    if (v.length < 2) { setProducts([]); return; }
    const res = await supabase.from("products").select(`"Product ID","Product Name","Price","Image"`).ilike("Product Name", `%${v}%`).limit(5);
    setProducts(res.data || []);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await res.json();
      if (j.ok) {
        setToast("تم الحفظ Pending");
        setTimeout(() => setToast(null), 2000);
        load();
        setForm({ title: "", message: "", audience: "All", areaIds: [], storeId: "", productId: "", price: "", image: "", btnText: "", deepLink: "", schedule: "" });
        setQArea(""); setQStore(""); setQProd("");
      } else {
        setToast("Error: " + j.error);
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err) {
      setToast("خطأ بالاتصال");
      setTimeout(() => setToast(null), 2000);
    } finally {
      setSending(false);
    }
  };

  const filteredAreas = areas.filter((a) => {
    const name = a["Area Name"] || "";
    return name.toLowerCase().includes(qArea.toLowerCase());
  });

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 flex items-center justify-center text-white">
      <div className="text-center"><div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p>جاري التحميل...</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white" style={{ direction: 'rtl' }}>
      <header className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} className="bg-white/10 p-2 rounded-xl active:scale-90 transition"><ChevronRight className="w-5 h-5" /></button>
          <h1 className="text-2xl font-bold">إنشاء برودكاست</h1>
          <div className="mr-auto bg-white/10 px-3 py-1.5 rounded-full text-xs">{list.length} برودكاست</div>
        </div>
      </header>

      <div className="px-4 pb-6 max-w-7xl mx-auto">
        <form onSubmit={submit} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-5 mb-6">
          <div className="grid grid-cols-12 gap-3 md:gap-4">

            <div className="col-span-12 md:col-span-8">
              <label className="text-xs text-purple-300 mb-2 block">العنوان - Title</label>
              <input className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl py-3.5 px-4 text-white placeholder:text-purple-300 focus:border-purple-500 focus:outline-none transition" placeholder="عرض جديد..." value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} required />
            </div>

            <div className="col-span-12 md:col-span-4">
              <label className="text-xs text-purple-300 mb-2 flex items-center gap-1"><Users className="w-3 h-3"/> الجمهور</label>
              <select className="w-full bg-slate-900 border border-white/10 rounded-2xl py-3.5 px-4 text-white focus:border-purple-500 focus:outline-none transition" value={form.audience} onChange={(e) => setForm({...form, audience: e.target.value})}>
                <option value="All">All</option><option value="Customer">Customer</option><option value="Store Owner">Store Owner</option><option value="Driver">Driver</option><option value="Area">Area</option>
              </select>
            </div>

            <div className="col-span-12">
              <label className="text-xs text-purple-300 mb-2 block">الرسالة - Message</label>
              <textarea className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl py-3.5 px-4 text-white placeholder:text-purple-300 focus:border-purple-500 focus:outline-none transition min-h-" placeholder="منتج جديد..." value={form.message} onChange={(e) => setForm({...form, message: e.target.value})} required />
            </div>

            <div className="col-span-12 md:col-span-4">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden p-3">
                <label className="text-xs font-bold text-purple-300 flex items-center gap-1 mb-2"><MapPin className="w-4 h-4"/> Area - اكتب الاسم</label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300" />
                  <input type="text" placeholder="ابحث Area Name" value={qArea} onChange={(e) => setQArea(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-10 pl-3 text-white placeholder:text-purple-300 focus:border-purple-500 focus:outline-none text-sm" />
                  {qArea && (
                    <div className="absolute z-10 bg-slate-900 border border-white/10 w-full mt-2 rounded-xl overflow-hidden max-h-40 overflow-auto">
                      {filteredAreas.map((a) => (
                        <div key={a["Area ID"]} className="p-2.5 hover:bg-white/10 cursor-pointer flex justify-between text-sm" onClick={() => { const newIds = [...new Set([...form.areaIds, a["Area ID"]])]; setForm({...form, areaIds: newIds}); setQArea(a["Area Name"]); }}>
                          <span>{a["Area Name"]}</span><span className="text- text-gray-400">{a["Area ID"].slice(0, 6)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text- mt-2 bg-white/5 p-2 rounded-xl text-purple-300 truncate">IDs: {form.areaIds.join(", ") || "-"}</div>
                <button type="button" className="text-xs text-red-400 mt-2" onClick={() => setForm({...form, areaIds: []})}>مسح</button>
              </div>
            </div>

            <div className="col-span-12 md:col-span-4">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden p-3">
                <label className="text-xs font-bold text-purple-300 flex items-center gap-1 mb-2"><Store className="w-4 h-4"/> Store - اكتب الاسم</label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300" />
                  <input type="text" placeholder="ابحث Store Name" value={qStore} onChange={(e) => searchStores(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-10 pl-3 text-white placeholder:text-purple-300 focus:border-purple-500 focus:outline-none text-sm" />
                  {stores.length > 0 && (
                    <div className="absolute z-10 bg-slate-900 border border-white/10 w-full mt-2 rounded-xl overflow-hidden">
                      {stores.map((s) => (
                        <div key={s["Store ID"]} className="p-2.5 hover:bg-white/10 cursor-pointer text-sm" onClick={() => { setForm({...form, storeId: s["Store ID"], deepLink: form.deepLink || `/store/${s["Store ID"]}`}); setQStore(s["Store Name"]); setStores([]); }}>{s["Store Name"]}</div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text- mt-2 bg-white/5 p-2 rounded-xl text-purple-300 truncate">ID: {form.storeId || "-"}</div>
              </div>
            </div>

            <div className="col-span-12 md:col-span-4">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden p-3">
                <label className="text-xs font-bold text-purple-300 flex items-center gap-1 mb-2"><Package className="w-4 h-4"/> Product - اكتب الاسم</label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300" />
                  <input type="text" placeholder="ابحث Product Name" value={qProd} onChange={(e) => searchProducts(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-10 pl-3 text-white placeholder:text-purple-300 focus:border-purple-500 focus:outline-none text-sm" />
                  {products.length > 0 && (
                    <div className="absolute z-10 bg-slate-900 border border-white/10 w-full mt-2 rounded-xl overflow-hidden">
                      {products.map((p) => (
                        <div key={p["Product ID"]} className="p-2.5 hover:bg-white/10 cursor-pointer text-sm" onClick={() => { setForm({...form, productId: p["Product ID"], price: p["Price"]?.toString() || "", image: p["Image"] || "", deepLink: `/products/${p["Product ID"]}`}); setQProd(p["Product Name"]); setProducts([]); }}>{p["Product Name"]} - {p["Price"]}</div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text- mt-2 bg-white/5 p-2 rounded-xl text-purple-300 truncate">ID: {form.productId || "-"}</div>
              </div>
            </div>

            <div className="col-span-6 md:col-span-2">
              <label className="text-xs text-purple-300 mb-2 flex items-center gap-1"><DollarSign className="w-3 h-3"/> السعر</label>
              <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-white placeholder:text-purple-300 focus:border-purple-500 focus:outline-none text-sm" placeholder="Price" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} />
            </div>
            <div className="col-span-6 md:col-span-5">
              <label className="text-xs text-purple-300 mb-2 flex items-center gap-1"><ImageIcon className="w-3 h-3"/> Image URL</label>
              <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-white placeholder:text-purple-300 focus:border-purple-500 focus:outline-none text-sm" placeholder="Image URL" value={form.image} onChange={(e) => setForm({...form, image: e.target.value})} />
            </div>
            <div className="col-span-6 md:col-span-2">
              <label className="text-xs text-purple-300 mb-2 block">نص الزر</label>
              <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-white placeholder:text-purple-300 focus:border-purple-500 focus:outline-none text-sm" placeholder="اطلب الان" value={form.btnText} onChange={(e) => setForm({...form, btnText: e.target.value})} />
            </div>
            <div className="col-span-6 md:col-span-3">
              <label className="text-xs text-purple-300 mb-2 flex items-center gap-1"><LinkIcon className="w-3 h-3"/> Deep Link</label>
              <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-white placeholder:text-purple-300 focus:border-purple-500 focus:outline-none text-sm" placeholder="/products/..." value={form.deepLink} onChange={(e) => setForm({...form, deepLink: e.target.value})} />
            </div>

            <div className="col-span-12 md:col-span-4">
              <label className="text-xs text-purple-300 mb-2 flex items-center gap-1"><Clock className="w-3 h-3"/> جدولة</label>
              <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-white focus:border-purple-500 focus:outline-none text-sm" type="datetime-local" value={form.schedule} onChange={(e) => setForm({...form, schedule: e.target.value})} />
            </div>
            <div className="col-span-12 md:col-span-8 flex items-end">
              <button disabled={sending} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-50">
                {sending? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Send className="w-4 h-4" />} {form.schedule? "جدولة Pending" : "إرسال فوري Pending"}
              </button>
            </div>

          </div>
        </form>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between"><p className="font-bold">آخر البرودكاست</p><p className="text-xs text-purple-300">{list.length} عنصر</p></div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.03] text-purple-300 text-xs">
                <tr><th className="p-3 text-right">Title</th><th>Audience</th><th>Area IDs</th><th>Status</th><th>Sent</th><th>Date</th></tr>
              </thead>
              <tbody>
                {list.map((b) => (
                  <tr key={b["Broadcast ID"]} className="border-t border-white/5 hover:bg-white/[0.03] transition">
                    <td className="p-3 font-bold truncate max-w-">{b["Title"]}</td>
                    <td className="p-3"><span className="bg-white/10 px-2.5 py-1 rounded-full text-xs">{b["Audience"]}</span></td>
                    <td className="p-3 text-xs truncate max-w-">{b["Area ID"]?.join(",") || "-"}</td>
                    <td className="p-3"><span className={`px-2.5 py-1 rounded-full text-xs ${b["Status"]==="Sent"?"bg-green-500/20 text-green-300": b["Status"]==="Failed"?"bg-red-500/20 text-red-300":"bg-amber-500/20 text-amber-300"}`}>{b["Status"]}</span></td>
                    <td className="p-3 text-xs">{b["Sent Count"]}/{b["Recipients"]}</td>
                    <td className="p-3 text-xs text-purple-300">{b["Created At"]?.slice(0,16)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {toast && (<div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-3 rounded-full shadow-2xl z-[999] flex items-center gap-2"><div className="bg-green-500 rounded-full p-1"><Check className="w-3 h-3 text-white" /></div><span className="text-sm font-bold">{toast}</span></div>)}
    </div>
  );
}
