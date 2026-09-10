"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function BroadcastPage() {
  const [list, setList] = useState([]);
  const [areas, setAreas] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);

  const [qArea, setQArea] = useState("");
  const [qStore, setQStore] = useState("");
  const [qProd, setQProd] = useState("");

  const [form, setForm] = useState({
    title: "",
    message: "",
    audience: "All",
    areaIds: [],
    storeId: "",
    productId: "",
    price: "",
    image: "",
    btnText: "",
    deepLink: "",
    schedule: "",
  });

  const load = async () => {
    console.log("Loading broadcasts and areas");
    const res = await supabase.from("broadcast").select("*").order("Created At", { ascending: false }).limit(50);
    if (res.error) console.error("load broadcast error", res.error);
    setList(res.data || []);

    const resArea = await supabase.from("areas").select(`"Area ID","Area Name"`).eq("Active", "Active");
    if (resArea.error) console.error("load areas error", resArea.error);
    setAreas(resArea.data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const searchStores = async (v) => {
    setQStore(v);
    if (v.length < 2) {
      setStores([]);
      return;
    }
    const res = await supabase.from("stores").select(`"Store ID","Store Name","Logo"`).ilike("Store Name", `%${v}%`).limit(5);
    if (res.error) console.error("search stores error", res.error);
    setStores(res.data || []);
  };

  const searchProducts = async (v) => {
    setQProd(v);
    if (v.length < 2) {
      setProducts([]);
      return;
    }
    const res = await supabase.from("products").select(`"Product ID","Product Name","Price","Image"`).ilike("Product Name", `%${v}%`).limit(5);
    if (res.error) console.error("search products error", res.error);
    setProducts(res.data || []);
  };

  const submit = async (e) => {
    e.preventDefault();
    console.log("Submitting", form);

    const res = await fetch("/api/admin/broadcasts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const j = await res.json();
    console.log("Response", j);

    if (j.ok) {
      alert("تم الحفظ Pending");
      load();
      setForm({
        title: "",
        message: "",
        audience: "All",
        areaIds: [],
        storeId: "",
        productId: "",
        price: "",
        image: "",
        btnText: "",
        deepLink: "",
        schedule: "",
      });
      setQArea("");
      setQStore("");
      setQProd("");
    } else {
      console.error("Save error", j);
      alert("Error: " + j.error + "\n" + JSON.stringify(j.details || {}, null, 2));
    }
  };

  const filteredAreas = areas.filter((a) => {
    const name = a["Area Name"] || "";
    return name.toLowerCase().includes(qArea.toLowerCase());
  });

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Broadcast - إنشاء برودكاست</h1>

      <form onSubmit={submit} className="bg-white border rounded-xl p-4 grid grid-cols-12 gap-3 mb-8">

        <input
          className="col-span-8 border p-2 rounded"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({...form, title: e.target.value })}
          required
        />

        <select
          className="col-span-4 border p-2 rounded"
          value={form.audience}
          onChange={(e) => setForm({...form, audience: e.target.value })}
        >
          <option value="All">All</option>
          <option value="Customer">Customer</option>
          <option value="Store Owner">Store Owner</option>
          <option value="Driver">Driver</option>
          <option value="Area">Area</option>
        </select>

        <textarea
          className="col-span-12 border p-2 rounded"
          placeholder="Message"
          value={form.message}
          onChange={(e) => setForm({...form, message: e.target.value })}
          required
        />

        {/* Area - يشوف الاسم بينسخ الكود */}
        <div className="col-span-4 relative">
          <label className="text-xs font-bold">Area - اكتب الاسم</label>
          <input
            className="w-full border p-2 rounded"
            placeholder="ابحث Area Name"
            value={qArea}
            onChange={(e) => setQArea(e.target.value)}
          />
          {qArea && (
            <div className="absolute z-10 bg-white border w-full max-h-40 overflow-auto">
              {filteredAreas.map((a) => (
                <div
                  key={a["Area ID"]}
                  className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between"
                  onClick={() => {
                    const newIds = [...new Set([...form.areaIds, a["Area ID"]])];
                    setForm({...form, areaIds: newIds });
                    setQArea(a["Area Name"]);
                  }}
                >
                  <span>{a["Area Name"]}</span>
                  <span className="text- text-gray-400">{a["Area ID"].slice(0, 6)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="text-xs mt-1 bg-gray-100 p-1 rounded">IDs: {form.areaIds.join(", ")}</div>
          <button type="button" className="text-xs text-red-500" onClick={() => setForm({...form, areaIds: [] })}>مسح</button>
        </div>

        {/* Store - يشوف Store Name بينسخ Store ID */}
        <div className="col-span-4 relative">
          <label className="text-xs font-bold">Store - اكتب الاسم</label>
          <input
            className="w-full border p-2 rounded"
            placeholder="ابحث Store Name"
            value={qStore}
            onChange={(e) => searchStores(e.target.value)}
          />
          <div className="absolute z-10 bg-white border w-full">
            {stores.map((s) => (
              <div
                key={s["Store ID"]}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setForm({
                   ...form,
                    storeId: s["Store ID"],
                    deepLink: form.deepLink || `/store/${s["Store ID"]}`,
                  });
                  setQStore(s["Store Name"]);
                  setStores([]);
                }}
              >
                {s["Store Name"]}
              </div>
            ))}
          </div>
          <div className="text-xs mt-1 bg-gray-100 p-1 rounded">ID: {form.storeId}</div>
        </div>

        {/* Product - يشوف Product Name بينسخ Product ID */}
        <div className="col-span-4 relative">
          <label className="text-xs font-bold">Product - اكتب الاسم</label>
          <input
            className="w-full border p-2 rounded"
            placeholder="ابحث Product Name"
            value={qProd}
            onChange={(e) => searchProducts(e.target.value)}
          />
          <div className="absolute z-10 bg-white border w-full">
            {products.map((p) => (
              <div
                key={p["Product ID"]}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setForm({
                   ...form,
                    productId: p["Product ID"],
                    price: p["Price"]? p["Price"].toString() : "",
                    image: p["Image"] || "",
                    deepLink: form.deepLink || `/product/${p["Product ID"]}`,
                  });
                  setQProd(p["Product Name"]);
                  setProducts([]);
                }}
              >
                {p["Product Name"]} - {p["Price"]}
              </div>
            ))}
          </div>
          <div className="text-xs mt-1 bg-gray-100 p-1 rounded">ID: {form.productId}</div>
        </div>

        <input className="col-span-2 border p-2 rounded" placeholder="Price" value={form.price} onChange={(e) => setForm({...form, price: e.target.value })} />
        <input className="col-span-4 border p-2 rounded" placeholder="Image URL" value={form.image} onChange={(e) => setForm({...form, image: e.target.value })} />
        <input className="col-span-3 border p-2 rounded" placeholder="Button Text - فاليو" value={form.btnText} onChange={(e) => setForm({...form, btnText: e.target.value })} />
        <input className="col-span-3 border p-2 rounded" placeholder="Deep Link - فاليو" value={form.deepLink} onChange={(e) => setForm({...form, deepLink: e.target.value })} />

        <input className="col-span-4 border p-2 rounded" type="datetime-local" value={form.schedule} onChange={(e) => setForm({...form, schedule: e.target.value })} />
        <button className="col-span-8 bg-black text-white rounded p-2">
          {form.schedule? "جدولة Pending" : "إرسال فوري Pending"}
        </button>
      </form>

      <div className="bg-white border rounded-xl overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr><th className="p-2 text-left">Title</th><th>Audience</th><th>Area IDs</th><th>Status</th><th>Sent</th><th>Date</th></tr>
          </thead>
          <tbody>
            {list.map((b) => (
              <tr key={b["Broadcast ID"]} className="border-t">
                <td className="p-2">{b["Title"]}</td>
                <td className="p-2">{b["Audience"]}</td>
                <td className="p-2 text-xs">{b["Area ID"]? b["Area ID"].join(",") : "-"}</td>
                <td className="p-2">{b["Status"]}</td>
                <td className="p-2">{b["Sent Count"]}/{b["Recipients"]}</td>
                <td className="p-2 text-xs">{b["Created At"]? b["Created At"].slice(0, 16) : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
