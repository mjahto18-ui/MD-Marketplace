"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import dynamic from "next/dynamic";
const Map = dynamic(() => import('@/components/Map'), { ssr: false });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const TABLE_MANAGERS = "geofence_center_managers";
const TABLE_CENTERS = "geofence_centers";
const COL_TOWER_ID = "geofence_center_id";
const COL_CENTER_ID = "id";

export default function TowerDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [tower, setTower] = useState(null);
  const [manager, setManager] = useState(null);
  const [orders, setOrders] = useState([]);
  const [taxiOrders, setTaxiOrders] = useState([]);
  const [specials, setSpecials] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [taxiDrivers, setTaxiDrivers] = useState([]);
  const [stores, setStores] = useState([]);
  const [customersMap, setCustomersMap] = useState({});
  const [storesMap, setStoresMap] = useState({});
  const [driversMap, setDriversMap] = useState({});
  const [selectedDriver, setSelectedDriver] = useState({});
  const [specialPrice, setSpecialPrice] = useState({});
  const [specialFee, setSpecialFee] = useState({});
  const [specialNote, setSpecialNote] = useState({});
  const [errorMsg, setErrorMsg] = useState("");
  const [debugMe, setDebugMe] = useState("");
  const [openBox, setOpenBox] = useState("");
  const [towerCustomers, setTowerCustomers] = useState([]);
  const [areasMap, setAreasMap] = useState({});
  const [categoriesMap, setCategoriesMap] = useState({});

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/me");
      const data = await res.json();
      setDebugMe(JSON.stringify(data).slice(0, 800));
      const user = data?.user || data;
      const userId = user?.id || user?.userId || user?.relatedId || null;
      const userRole = user?.role || null;
      if (!user || !userId) {
        setErrorMsg("api/admin/me ما رجع user - اللي رجع: " + JSON.stringify(data).slice(0, 500));
        setLoading(false);
        
        return;
      }
      if (userRole !== "Assistant Admin") {
        window.location.href = "/admin/dashboard";
        return;
      }
      setMe({ ...user, id: userId, name: user?.name || "", role: userRole });

      const { data: mRows, error: mErr } = await supabase
        .from(TABLE_MANAGERS).select("*")
        .eq("manager_user_id", userId).eq("is_active", true).limit(1);
      if (mErr) {
        setErrorMsg("خطأ بجيب المسؤول: " + mErr.message + " - ID تبعك: " + userId);
        setLoading(false); return;
      }
      const m = mRows?.[0];
      if (!m) {
        setErrorMsg("ما لقيت مسؤول مربوط بهيدا الحساب - ID تبعك: " + userId);
        setLoading(false); return;
      }
      setManager(m);
      const towerId = m[COL_TOWER_ID];
      if (!towerId) {
        setErrorMsg("لقيت مسؤول بس معرف البرج فاضي");
        setLoading(false); return;
      }
      const { data: cRows } = await supabase.from(TABLE_CENTERS).select("*").eq(COL_CENTER_ID, towerId).limit(1);
      if (!cRows?.[0]) {
        setErrorMsg("لقيت مسؤول و معرف برج: " + towerId + " - بس هيدا البرج مش موجود");
        setLoading(false); return;
      }
      setTower(cRows[0]);

      const { data: oRows } = await supabase.from("order_requuest").select("*").eq(COL_TOWER_ID, towerId).order("Cerated Date", { ascending: false }).limit(200);
      setOrders(oRows || []);
      const { data: tRows } = await supabase.from("taxi_orders").select("*").eq(COL_TOWER_ID, towerId).order("created_at", { ascending: false }).limit(200);
      setTaxiOrders(tRows || []);
      const { data: sRows } = await supabase.from("special_orders").select("*").eq(COL_TOWER_ID, towerId).order("Cerated Date", { ascending: false }).limit(200);
      setSpecials(sRows || []);

      const custIds = [...new Set((oRows || []).map(x => x["customer ID"]).filter(Boolean))];
      if (custIds.length) {
        const { data: c } = await supabase.from("customers").select("*").in("Customer ID", custIds);
        const map = {};
        (c || []).forEach(x => map[x["Customer ID"]] = x);
        setCustomersMap(map);
      } else { setCustomersMap({}); }

      const { data: dRows } = await supabase.from("drivers").select("*").in("Status", ["Active", "Online"]).limit(200);

// === الخطوة 1: بس درايفر هيدا البرج - جوا radius_cart ===
const towerLat2 = Number(cRows[0].center_lat || 0);
const towerLng2 = Number(cRows[0].center_lng || 0);
const towerRadius = Number(cRows[0].radius_cart || 0);

function distKmDriver(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const towerDrivers = (dRows || []).filter(d => {
  const lat = Number(d["Current Latitude"] || 0);
  const lng = Number(d["Current Longitude"] || 0);
  if (!lat || !lng || !towerLat2 || !towerLng2 || !towerRadius) return false;
  return distKmDriver(lat, lng, towerLat2, towerLng2) <= towerRadius;
});

setDrivers(towerDrivers);
// الـ Map للعرض - من كل الدرايفر - كرمال الاوردرات القديمة يضل يبين اسمن
const dMap = {};
(dRows || []).forEach(x => dMap[x["Driver ID"]] = x);
setDriversMap(dMap);

      const { data: tdRows } = await supabase.from("taxi_drivers").select("*").eq("status", "active").limit(200);
      setTaxiDrivers(tdRows || []);
      const { data: stRows } = await supabase.from("stores").select("*").eq("Status", "Active").limit(200);
      setStores(stRows || []);
      const sMap = {};
      (stRows || []).forEach(x => sMap[x["Store ID"]] = x);
      setStoresMap(sMap);
      // areas + categories - كرمال يطلع اسم مش كود
const { data: arRows } = await supabase.from("areas").select("*").limit(500);
const aMap = {};
(arRows || []).forEach(x => aMap[x["Area ID"]] = x);
setAreasMap(aMap);

const { data: catRows } = await supabase.from("categories").select("*").limit(500);
const cMap = {};
(catRows || []).forEach(x => cMap[x["Category ID"]] = x);
setCategoriesMap(cMap);

// عملاء البرج - من الاحداثيات الصح
const { data: allCust } = await supabase.from("customers").select("*").limit(1000);

function getCoords(c) {
  const uLat = Number(c["Current Latitude"] || 0);
  const uLng = Number(c["Current Longtitude"] || 0);
  if (uLat !== 0 && uLng !== 0) return { lat: uLat, lng: uLng };
  const rLat = Number(c["Registration Latitude"] || 0);
  const rLng = Number(c["Registration Longitude"] || 0);
  if (rLat !== 0 && rLng !== 0) return { lat: rLat, lng: rLng };
  return null;
}
function distKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const towerLat = Number(cRows[0].center_lat || 0);
const towerLng = Number(cRows[0].center_lng || 0);
const filtered = (allCust || []).filter(c => {
  const co = getCoords(c);
  if (!co || !towerLat || !towerLng) return false;
  return distKm(co.lat, co.lng, towerLat, towerLng) <= Number(cRows[0].radius_cart || 0);
});
setTowerCustomers(filtered);
      setLoading(false);
    } catch (e) {
      setErrorMsg("خطأ بالتحميل: " + e.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!tower) return;
    const ch = supabase.channel("tower-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "order_requuest" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "taxi_orders" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "special_orders" }, () => load())
      .subscribe();
    const iv = setInterval(load, 15000);
    return () => { supabase.removeChannel(ch); clearInterval(iv); };
  }, [tower, load]);

  const logout = async () => {
  await fetch('/api/admin/logout', {method:'POST', credentials:'include'});
  window.location.href = '/admin/login';
};

  const acceptOrder = async (id, driverId) => {
  if (!driverId) return alert("اختار سائق أولاً - ما فيك تقبل الاوردر بلا سائق");
  await supabase.from("order_requuest").update({ "Assigned Driver": driverId, "Approval Status": "Approved", "Delivery Status": "Pending" }).eq("Request ID", id);
  load();
};
  const assignDriver = async (orderId, driverId) => {
    if (!driverId) return;
    await supabase.from("order_requuest").update({ "Assigned Driver": driverId, "Approval Status": "Approved", "Delivery Status": "Pending" }).eq("Request ID", orderId);
    load();
  };

  const approveSpecial = async (s) => {
  const priceRaw = specialPrice[s["Request ID"]];
  const feeRaw = specialFee[s["Request ID"]];

  // الفاضي بس هو المرفوض - الصفر مقبول
  if (priceRaw === undefined || priceRaw === "" || feeRaw === undefined || feeRaw === "") {
    return alert("حط سعر القطعة وتكلفة التوصيل أولاً - فيك تحط 0 اذا مجاني");
  }

  const price = Number(priceRaw || 0);
  const fee = Number(feeRaw || 0);

  const res = await fetch('/api/admin/special-orders/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestId: s["Request ID"],
      price,
      deliveryFee: fee,
      adminNote: specialNote[s["Request ID"]] || ""
    })
  });
  const d = await res.json();
  if (d.success) { alert("تحول لاوردر"); load(); }
  else alert(d.message || "ما تحول");
};

  if (loading) return (
    <div style={{ padding: 20, color: "#fff", background: "#0F0F0F", minHeight: "100vh" }}>
      <div>عم يحمل...</div>
      <div style={{ color: "#FFD700", marginTop: 12, fontSize: 13 }}>{errorMsg}</div>
      <div style={{ color: "#aaa", marginTop: 8, fontSize: 12, wordBreak: "break-all" }}>ME: {debugMe}</div>
    </div>
  );
  if (!tower) return (
    <div style={{ padding: 20, color: "#fff", background: "#0F0F0F", minHeight: "100vh" }}>
      <div style={{ fontSize: 18, fontWeight: 800 }}>ما عندك برج مربوط</div>
      <div style={{ color: "#FFD700", marginTop: 10 }}>{errorMsg || "احكي الادارة"}</div>
      <div style={{ color: "#aaa", fontSize: 12, marginTop: 8 }}>ID تبعك: {me?.id || "-"}</div>
    </div>
  );

  const pendingOrders = orders.filter(o => o["Approval Status"] === "Pending");
  const activeOrders = orders.filter(o => ["Approved", "Admin Review", "New Order Delivery"].includes(o["Approval Status"]));
  const completedToday = orders.filter(o => o["Approval Status"] === "Completed" || o["Approval Status"] === "Complete Orders");
  const pendingTaxi = taxiOrders.filter(o => o.status === "pending");
  const activeTaxi = taxiOrders.filter(o => ["accepted", "on_the_way", "arrived"].includes(o.status));
  const pendingSpecial = specials.filter(o => o["Status"] === "Pending");

  const boxTitles = {
    pendingOrders: "اوردرات بندينغ - تفاصيل",
    pendingTaxi: "تاكسي بندينغ - تفاصيل",
    pendingSpecial: "طلبات خاصة بندينغ - تفاصيل",
    activeOrders: "اوردرات نشطة - تفاصيل",
    activeTaxi: "تاكسي نشط - تفاصيل",
    completed: "اوردرات مكتملة - تفاصيل",
    drivers: "سائقين توصيل - تفاصيل",
    taxiDrivers: "سائقين تاكسي - تفاصيل",
    stores: "متاجر نشطة - تفاصيل",
    customers: "عملاء نشطين - تفاصيل",
    towerCustomers: "عملاء البرج - تفاصيل",
  };

  const Card = ({ title, value, sub, color = "#FFD700", box }) => (
    <div onClick={() => setOpenBox(openBox === box ? "" : box)}
      style={{ background: "#1A1A1A", border: `1px solid ${color}33`, borderRadius: 20, padding: 18, minHeight: 130, cursor: "pointer" }}>
      <div style={{ color: "#999", fontSize: 13 }}>{title}</div>
      <div style={{ color: "#fff", fontSize: 38, fontWeight: 800, lineHeight: 1.1 }}>{value}</div>
      <div style={{ color, fontSize: 12, marginTop: 6 }}>{sub} - كبس لتشوف التفاصيل ↓</div>
    </div>
  );

  const Row = ({ children }) => (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "10px 0", borderBottom: "1px solid #222", flexWrap: "wrap" }}>{children}</div>
  );

  return (
    <div dir="rtl" style={{ background: "#0F0F0F", minHeight: "100vh", color: "#fff", padding: 16, fontFamily: "Andika" }}>
      <div style={{ background: "#1A1A1A", borderRadius: 20, padding: 18, border: "1px solid #FFD70033", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{tower.name} - برج {manager?.manager_name || me?.name}</div>
            <div style={{ color: "#aaa", fontSize: 13 }}>الخدمة: {manager?.assigned_service || "كل الخدمات"} - مباشر - دون كاش</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{ background: "#222", padding: "6px 12px", borderRadius: 999 }}>كارت: {tower.radius_cart} كم</span>
            <span style={{ background: "#222", padding: "6px 12px", borderRadius: 999 }}>تاكسي: {tower.radius_taxi} كم</span>
            <span style={{ background: "#222", padding: "6px 12px", borderRadius: 999 }}>بوت: {tower.radius_bot} كم</span>
            <span style={{ background: "#1a3a1a", color: "#7CFC00", padding: "6px 12px", borderRadius: 999 }}>● مباشر</span>
            <button onClick={logout} style={{ background: "#ef4444", color: "#fff", border: 0, padding: "6px 14px", borderRadius: 999, fontWeight: 800, cursor: "pointer" }}>خروج ⏻</button>
          </div>
        </div>
      </div>
      {/* === كارت Generate Code - نفس الادمن - بيفتح نفس الصفحة === */}
<div onClick={() => window.location.href = "/admin/invite-codes"}
  style={{ background: "#1A1A1A", borderRadius: 20, padding: 16, border: "1px solid #FFD70033", marginBottom: 16, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
  <div>
    <b style={{ fontSize: 17 }}>🎟️ Generate Code - كرت دعوة</b>
    <div style={{ color: "#aaa", fontSize: 12, marginTop: 4 }}>ولد كود 6 أرقام - بدون عداد - مربوط بالانفايت - متل الادمن بالزبط</div>
  </div>
  <span style={{ background: "#FFD700", color: "#000", padding: "8px 16px", borderRadius: 999, fontWeight: 800, fontSize: 13 }}>فتح صفحة الاكواد →</span>
</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 12, marginBottom: 16 }}>
        <Card title="اوردرات بندينغ" value={pendingOrders.length} sub="بدا قبول و تعيين" color="#FFD700" box="pendingOrders" />
        <Card title="تاكسي بندينغ" value={pendingTaxi.length} sub="بانتظار سائق" color="#00BFFF" box="pendingTaxi" />
        <Card title="طلبات خاصة بندينغ" value={pendingSpecial.length} sub="بدا تسعير" color="#FF8C00" box="pendingSpecial" />
        <Card title="اوردرات نشطة" value={activeOrders.length} sub="قيد التوصيل" color="#7CFC00" box="activeOrders" />
        <Card title="تاكسي نشط" value={activeTaxi.length} sub="على الطريق" color="#00FA9A" box="activeTaxi" />
        <Card title="اوردرات مكتملة" value={completedToday.length} sub="هيدا البرج" color="#aaa" box="completed" />
        <Card title="سائقين توصيل" value={drivers.length} sub="Online" color="#FFD700" box="drivers" />
        <Card title="سائقين تاكسي" value={taxiDrivers.length} sub="Active" color="#00BFFF" box="taxiDrivers" />
        <Card title="متاجر نشطة" value={stores.length} sub="Active" color="#FF69B4" box="stores" />
        <Card title="عملاء نشطين" value={Object.keys(customersMap).length} sub="اللي طلبو من برجك" color="#FFD700" box="customers" />
        <Card title="عملاء البرج" value={towerCustomers.length} sub="ساكنين بمنطقة برجك" color="#00FA9A" box="towerCustomers" />
      </div>

      {openBox !== "" && (
        <div style={{ background: "#1A1A1A", borderRadius: 20, padding: 16, marginBottom: 16, border: "1px solid #FFD70033" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <b style={{ fontSize: 17 }}>{boxTitles[openBox]}</b>
            <button onClick={() => setOpenBox("")} style={{ background: "#222", color: "#fff", border: 0, padding: "6px 14px", borderRadius: 999, cursor: "pointer" }}>سكر ✕</button>
          </div>

          {openBox === "stores" && stores.map(s => (
          <Row key={s["Store ID"]}><span>🏪 {s["Store Name"]}</span><span style={{ color: "#aaa", fontSize: 12 }}>{categoriesMap[s["Category"]]?.["Category Name"] || s["Category"] || ""} - {areasMap[s["Area"]]?.["Area Name"] || s["Area"]} - {s["Mobile"]} - {s["Adress"]}</span></Row>
          ))}
          {openBox === "drivers" && drivers.map(d => (
            <Row key={d["Driver ID"]}><span>🛵 {d["Driver Name"]}</span><span style={{ color: "#aaa", fontSize: 12 }}>{d["Status"]} - {d["VehicleTyp"]} - {d["Area"]} - {d["Mobile"]}</span></Row>
          ))}
          {openBox === "taxiDrivers" && taxiDrivers.map(d => (
            <Row key={d["Taxi_ID"]}><span>🚕 {d.full_name}</span><span style={{ color: "#aaa", fontSize: 12 }}>{d.status} - {d.vehicle_type} - {d.plate_number} - {d.phone}</span></Row>
          ))}
          {openBox === "customers" && Object.values(customersMap).map(c => (
            <Row key={c["Customer ID"]}><span>👤 {c["Name"]}</span><span style={{ color: "#aaa", fontSize: 12 }}>{c["Area"]} - {c["Mobile"]} - {c["Adress"]}</span></Row>
          ))}
          {openBox === "customers" && Object.keys(customersMap).length === 0 && <div style={{ color: "#aaa" }}>بعد ما في عملاء طلبو من هيدا البرج - بس يفوت اول اوردر - رح يبين هون</div>}

          {openBox === "towerCustomers" && towerCustomers.map(c => (
         <Row key={c["Customer ID"]}><span>👤 {c["Name"]}</span><span style={{ color: "#aaa", fontSize: 12 }}>{areasMap[c["Area"]]?.["Area Name"] || c["Area"]} - {c["Mobile"]} - {c["Adress"]}</span></Row>
         ))}
         {openBox === "towerCustomers" && towerCustomers.length === 0 && <div style={{ color: "#aaa" }}>ما في عملاء عندن احداثيات بمنطقة البرج</div>}

          {(openBox === "pendingOrders" || openBox === "activeOrders" || openBox === "completed") && (openBox === "pendingOrders" ? pendingOrders : openBox === "activeOrders" ? activeOrders : completedToday).map(o => {
            const cust = customersMap[o["customer ID"]];
            const drv = driversMap[o["Assigned Driver"]];
            return (
              <div key={o["Request ID"]} style={{ borderBottom: "1px solid #222", padding: "12px 0" }}>
                <Row><span><b>{cust?.["Name"] || "زبون"}</b> - {o["Request ID"]?.slice(0, 8)}</span><span style={{ color: "#FFD700" }}>{o["Total Amount"] || 0} ل.ل - {o["Approval Status"]}</span></Row>
                <div style={{ color: "#aaa", fontSize: 12 }}>{o["Area"]} - {o["Delivery Adress"]} - السائق: {drv?.["Driver Name"] || o["Assigned Driver"] || "-"}</div>
                <div style={{ background: "#FFF3B0", color: "#000", borderRadius: 12, padding: 10, marginTop: 8, fontSize: 13 }}><b>ملاحظة: </b>{o["Note"] || "لا يوجد ملاحظات"}</div>
                <Link href={`/admin/active-orders/${o["Request ID"]}`} style={{ color: "#FFD700", fontSize: 13 }}>فتح تفاصيل الاوردر →</Link>
              </div>
            );
          })}

            {openBox === "pendingTaxi" && pendingTaxi.map(t => (
            <div key={t.id} style={{ borderBottom: "1px solid #222", padding: "12px 0" }}>
              <Row><span><b>{t.customer_name}</b> - {t.phone || t.customer_phone}</span><span style={{ color: "#00BFFF" }}>{t.total_amount || 0} ل.ل</span></Row>
              <div style={{ color: "#aaa", fontSize: 12 }}>{t.origin_name} ← {t.dest_name}</div>
              <div style={{ background: "#FFF3B0", color: "#000", borderRadius: 12, padding: 10, marginTop: 8, fontSize: 13 }}><b>ملاحظة: </b>{t.customer_notes || "لا يوجد ملاحظات"}</div>
            </div>
          ))}
          {openBox === "activeTaxi" && activeTaxi.map(t => (
            <Row key={t.id}><span>🚕 {t.customer_name} - {t.origin_name} ← {t.dest_name}</span><span style={{ color: "#aaa", fontSize: 12 }}>{t.status} - {t.taxi_name || "-"}</span></Row>
          ))}
          {openBox === "pendingSpecial" && pendingSpecial.map(s => (
            <div key={s["Request ID"]} style={{ borderBottom: "1px solid #222", padding: "12px 0" }}>
              <Row><span><b>{s["Customer Name"]}</b></span><span style={{ color: "#aaa", fontSize: 12 }}>{s["Store Hint"] || ""} - كمية: {s["Quantity"]}</span></Row>
              <div style={{ marginTop: 4 }}>{s["الطلب"]}</div>
              <div style={{ background: "#FFF3B0", color: "#000", borderRadius: 12, padding: 10, marginTop: 8, fontSize: 13 }}><b>ملاحظة: </b>{s["ملاحظات عامة"] || "لا يوجد ملاحظات"}</div>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ fontSize: 18, margin: "18px 0 10px" }}>اوردرات بندينغ - {pendingOrders.length}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 12 }}>
        {pendingOrders.map(o => {
  const cust = customersMap[o["customer ID"]];

  // === الخطوة 2: رتب درايفر البرج من الاقرب للاوردر للابعد ===
  // احداثيات الاوردر من order_requuest - مش من customers
  let oLat = Number(o["Customer Latitude"] || 0);
  let oLng = Number(o["Customer Longitude"] || 0);
  // احتياط: اذا فاضي - من Current Location "lat,lng"
  if ((!oLat || !oLng) && o["Current Location"]) {
    const parts = String(o["Current Location"]).split(",");
    if (parts.length === 2) {
      oLat = Number(parts[0] || 0);
      oLng = Number(parts[1] || 0);
    }
  }

  const driversSorted = [...drivers].map(d => {
    const dLat = Number(d["Current Latitude"] || 0);
    const dLng = Number(d["Current Longitude"] || 0);
    let dist = 999999;
    if (oLat && oLng && dLat && dLng) {
      const R = 6371;
      const dLatR = (oLat - dLat) * Math.PI / 180;
      const dLngR = (oLng - dLng) * Math.PI / 180;
      const a = Math.sin(dLatR/2) * Math.sin(dLatR/2) + Math.cos(dLat * Math.PI / 180) * Math.cos(oLat * Math.PI / 180) * Math.sin(dLngR/2) * Math.sin(dLngR/2);
      dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }
    return { ...d, _dist: dist };
  }).sort((a,b) => a._dist - b._dist);

  return (
            <div key={o["Request ID"]} style={{ background: "#1A1A1A", borderRadius: 20, padding: 14, border: "1px solid #333", overflow: "hidden", minWidth: 0, boxSizing: "border-box" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <b>{cust?.["Name"] || o["customer ID"] || "زبون"}</b>
                <span style={{ color: "#FFD700" }}>{o["Total Amount"] || 0} ل.ل</span>
              </div>
              <div style={{ color: "#aaa", fontSize: 12 }}>{o["Area"]} - {o["Delivery Adress"]}</div>
              <div style={{ background: "#FFF3B0", color: "#000", borderRadius: 12, padding: 10, marginTop: 10, fontSize: 13 }}>
                <b>ملاحظة: </b>{o["Note"] || "لا يوجد ملاحظات"}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button onClick={() => acceptOrder(o["Request ID"], selectedDriver[o["Request ID"]])} disabled={!selectedDriver[o["Request ID"]]} style={{ flex: 1, background: selectedDriver[o["Request ID"]] ? "#FFD700" : "#444", color: selectedDriver[o["Request ID"]] ? "#000" : "#aaa", border: 0, padding: 10, borderRadius: 12, fontWeight: 800, cursor: selectedDriver[o["Request ID"]] ? "pointer" : "not-allowed" }}>قبول - مع السائق</button>
                <Link href={`/admin/active-orders/${o["Request ID"]}`} style={{ flex: 1, textAlign: "center", background: "#222", color: "#fff", padding: 10, borderRadius: 12, textDecoration: "none" }}>تفاصيل</Link>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", width: "100%", boxSizing: "border-box" }}>
  <select value={selectedDriver[o["Request ID"]] || ""} onChange={e => setSelectedDriver(p => ({ ...p, [o["Request ID"]]: e.target.value }))}
    style={{ flex: "1 1 100%", minWidth: 0, width: "100%", boxSizing: "border-box", background: "#222", color: "#fff", border: "1px solid #444", borderRadius: 12, padding: 9 }}>
  <option value="">اختر سائق - من هيدا البرج - الاقرب اول واحد</option>
  {driversSorted.map(d => (
    <option key={d["Driver ID"]} value={d["Driver ID"]}>
      {d["Driver Name"]} - {d._dist >= 999999 ? "بلا موقع" : d._dist.toFixed(1) + " كم من الاوردر"}
    </option>
  ))}
</select>
                
              </div>
            </div>
          );
        })}
        {pendingOrders.length === 0 && <div style={{ color: "#aaa" }}>ما في اوردرات بندينغ هلق</div>}
      </div>

      <h2 style={{ fontSize: 18, margin: "22px 0 10px" }}>تاكسي بندينغ - {pendingTaxi.length}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 12 }}>
        {pendingTaxi.map(t => (
          <div key={t.id} style={{ background: "#1A1A1A", borderRadius: 20, padding: 14, border: "1px solid #00BFFF33" }}>
            <b>{t.customer_name}</b>
            <div style={{ color: "#aaa", fontSize: 12 }}>{t.origin_name} ← {t.dest_name}</div>
            <div style={{ background: "#FFF3B0", color: "#000", borderRadius: 12, padding: 10, marginTop: 10, fontSize: 13 }}>
              <b>ملاحظة: </b>{t.customer_notes || "لا يوجد ملاحظات"}
            </div>
            <div style={{ color: "#00BFFF", marginTop: 8 }}>{t.total_amount || 0} ل.ل</div>
          </div>
        ))}
        {pendingTaxi.length === 0 && <div style={{ color: "#aaa" }}>ما في تاكسي بندينغ</div>}
      </div>

      <h2 style={{ fontSize: 18, margin: "22px 0 10px" }}>طلبات خاصة بندينغ - {pendingSpecial.length}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 12 }}>
        {pendingSpecial.map(s => (
  <div key={s["Request ID"]} style={{ background: "#1A1A1A", borderRadius: 20, padding: 14, border: "1px solid #FF8C0033" }}>
    <b>{s["Customer Name"]}</b>
    <div style={{ color: "#aaa", fontSize: 12 }}>{s["Store Hint"] || ""} - {s["Mobile"] || ""}</div>
    <div style={{ color: "#aaa", fontSize: 12 }}>{s["Delivery Adress"] || ""}</div>
    <div style={{ marginTop: 8 }}>{s["الطلب"]}</div>
    <div style={{ background: "#FFF3B0", color: "#000", borderRadius: 12, padding: 10, marginTop: 10, fontSize: 13 }}>
      <b>ملاحظة: </b>{s["ملاحظات عامة"] || "لا يوجد ملاحظات"}
    </div>
    <div style={{ color: "#aaa", fontSize: 12, marginTop: 8 }}>كمية: {s["Quantity"]}</div>
    <input value={specialPrice[s["Request ID"]] || ""} onChange={e => setSpecialPrice(p => ({ ...p, [s["Request ID"]]: e.target.value }))} placeholder="سعر القطعة" type="number" style={{ width: "100%", background: "#222", color: "#fff", border: "1px solid #444", borderRadius: 12, padding: 9, marginTop: 10 }} />
    <input value={specialFee[s["Request ID"]] || ""} onChange={e => setSpecialFee(p => ({ ...p, [s["Request ID"]]: e.target.value }))} placeholder="اجرة التوصيل" type="number" style={{ width: "100%", background: "#222", color: "#fff", border: "1px solid #444", borderRadius: 12, padding: 9, marginTop: 8 }} />
    <input value={specialNote[s["Request ID"]] || ""} onChange={e => setSpecialNote(p => ({ ...p, [s["Request ID"]]: e.target.value }))} placeholder="ملاحظة الادمن" style={{ width: "100%", background: "#222", color: "#fff", border: "1px solid #444", borderRadius: 12, padding: 9, marginTop: 8 }} />
    <button onClick={() => approveSpecial(s)} style={{ width: "100%", background: "#FFD700", border: 0, padding: 10, borderRadius: 12, fontWeight: 800, cursor: "pointer", marginTop: 10 }}>سعر و حول لاوردر</button>
  </div>
))}
        {pendingSpecial.length === 0 && <div style={{ color: "#aaa" }}>ما في طلبات خاصة</div>}
      </div>

      <h2 style={{ fontSize: 18, margin: "22px 0 10px" }}>اوردرات نشطة - {activeOrders.length}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 12 }}>
        {activeOrders.map(o => {
  const cust = customersMap[o["customer ID"]];
  const drv = driversMap[o["Assigned Driver"]];

  // موقع السائق من نفس الاوردر - متل الزبون بالزبط
  let driverLat = null, driverLng = null;
  if (o["Current Location"] && String(o["Current Location"]).includes(",")) {
    const parts = String(o["Current Location"]).split(",");
    driverLat = parts[0]?.trim() || null;
    driverLng = parts[1]?.trim() || null;
  }

  return (
    <div key={o["Request ID"]} style={{ background: "#1A1A1A", borderRadius: 20, padding: 14 }}>
      <b>{cust?.["Name"] || "زبون"}</b> - <span style={{ color: "#7CFC00" }}>{o["Approval Status"]}</span>

      {/* خريطة الاوردر - زبون + سائق */}
      {o["Customer Latitude"] && o["Customer Longitude"] && (
        <div style={{ height: 180, borderRadius: 12, overflow: "hidden", marginTop: 10, border: "1px solid #333" }}>
          <Map
            customerLat={o["Customer Latitude"]}
            customerLng={o["Customer Longitude"]}
            driverLat={driverLat}
            driverLng={driverLng}
          />
        </div>
      )}
      <div style={{ color: "#aaa", fontSize: 12, marginTop: 8 }}>
        {driverLat && driverLng ? "السائق في الطريق 🛵" : "بانتظار السائق"}
      </div>
              <div style={{ background: "#FFF3B0", color: "#000", borderRadius: 12, padding: 10, marginTop: 8, fontSize: 13 }}>
                <b>ملاحظة: </b>{o["Note"] || "لا يوجد ملاحظات"}
              </div>
              <div style={{ color: "#aaa", fontSize: 12, marginTop: 8 }}>السائق: {drv?.["Driver Name"] || o["Assigned Driver"] || "-"}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
