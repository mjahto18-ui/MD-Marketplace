"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, ChevronRight, Search } from "lucide-react";

export default function OffersPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [addingId, setAddingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch("/api/me", { credentials: "include", cache: "no-store" })
      .then(async (res) => { if (res.ok) { const d = await res.json(); if (d.user) setUser(d.user); } })
      .catch(() => {});
  }, []);

  const loadOffers = (lat, lng) => {
    let url = `/api/products?onlyOffers=1&limit=100&page=1`;
    if (lat && lng) url += `&lat=${lat}&lng=${lng}`;
    fetch(url, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setProducts(data.products || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    const cachedLat = localStorage.getItem("user_lat");
    const cachedLng = localStorage.getItem("user_lng");
    if (cachedLat && cachedLng) { loadOffers(cachedLat, cachedLng); return; }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          localStorage.setItem("user_lat", pos.coords.latitude);
          localStorage.setItem("user_lng", pos.coords.longitude);
          loadOffers(pos.coords.latitude, pos.coords.longitude);
        },
        () => loadOffers(null, null),
        { timeout: 8000 }
      );
    } else loadOffers(null, null);
  }, []);

  const addToCart = async (product) => {
    if (!user) { router.push("/login"); return; }
    setAddingId(product.productID);
    const doAdd = async (lat, lng) => {
      try {
        const res = await fetch("/api/cart/add", {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productID: product.productID, qty: 1, lat, lng }),
        });
        const data = await res.json();
        if (!data.success) setToast(data.message || "فشل الاضافة");
        else setToast(`${product.name} - تمت الإضافة`);
      } catch { setToast("خطأ بالاتصال"); }
      setTimeout(() => { setToast(null); setAddingId(null); }, 2000);
    };
    const cachedLat = localStorage.getItem("user_lat");
    const cachedLng = localStorage.getItem("user_lng");
    if (cachedLat && cachedLng) { doAdd(cachedLat, cachedLng); return; }
    if (!navigator.geolocation) { setToast("متصفحك ما بيدعم تحديد الموقع"); setAddingId(null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { localStorage.setItem("user_lat", pos.coords.latitude); localStorage.setItem("user_lng", pos.coords.longitude); doAdd(pos.coords.latitude, pos.coords.longitude); },
      () => { setToast("لازم تسمح بالموقع لتضيف عالسلة"); setAddingId(null); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const filtered = products.filter((p) =>
    (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.storeName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (d) => {
    if (!d) return "";
    try { return new Date(d).toLocaleDateString("ar-LB", { day: "numeric", month: "short" }); } catch { return d; }
  };

  if (loading) return <div style={{ minHeight: "100vh", background: "#0F0F0F", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>عم يحمل العروض...</div>;

  return (
    <div dir="rtl" style={{ background: "radial-gradient(1200px at 20% -10%, #1a0b2e 0%, #0a0a14 45%, #080811 100%)", minHeight: "100vh", color: "#fff", padding: 16, fontFamily: "Andika" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <button onClick={() => router.push("/shop")} style={{ background: "rgba(255,255,255,0.1)", border: 0, color: "#fff", padding: "8px 12px", borderRadius: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><ChevronRight size={18} /> رجوع</button>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>🔥 العروض</h1>
          <span style={{ background: "#FFD700", color: "#000", padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 800 }}>{filtered.length} عرض</span>
        </div>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 16 }}>كل المنتجات اللتي عليها عروض حاليا - من كل المتاجر - </p>

        <div style={{ display: "flex", gap: 8, background: "rgba(255,255,255,0.08)", borderRadius: 14, padding: "10px 12px", marginBottom: 16, alignItems: "center" }}>
          <Search size={18} color="#aaa" />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ابحث عن عرض او متجر..." style={{ flex: 1, background: "transparent", border: 0, outline: "none", color: "#fff", fontSize: 14 }} />
        </div>

        {filtered.length === 0 && <div style={{ textAlign: "center", color: "#aaa", padding: 40 }}>لايوجد عروض حاليا - جرب لاحقا</div>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
                    {filtered.map((p) => (
            <div key={p.productID} onClick={() => router.push(`/product/${p.productID}`)} style={{ background: "#1A1A1A", border: "1px solid rgba(255,215,0,0.25)", borderRadius: 20, overflow: "hidden", cursor: "pointer" }}>
              <div style={{ position: "relative", background: "#fff", height: 170 }}>
                {p.images?.[0] || p.image ? (
                  <Image src={p.images?.[0] || p.image} alt={p.name} fill style={{ objectFit: "cover" }} unoptimized />
                ) : (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>لا صورة</div>
                )}
                {/* === بادج العرض === */}
                <span style={{ position: "absolute", top: 10, right: 10, background: "#ef4444", color: "#fff", fontSize: 12, fontWeight: 800, padding: "5px 10px", borderRadius: 999, zIndex: 2 }}>
                  عرض 🔥 {p.discountPercent > 0 ? `-${p.discountPercent}%` : ""}
                </span>
                {p.offerEnd && (
                  <span style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(0,0,0,0.75)", color: "#FFD700", fontSize: 11, fontWeight: 700, padding: "4px 9px", borderRadius: 999, zIndex: 2 }}>
                    ينتهي بـ {formatDate(p.offerEnd)}
                  </span>
                )}
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 12, color: "#FFD700", marginBottom: 4 }}>🏪 {p.storeName}</div>
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "#aaa", marginBottom: 8 }}>{p.size ? `مقاس: ${p.size}` : ""} {p.unit ? ` - ${p.unit}` : ""}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  {p.oldPrice > 0 && <span style={{ color: "#999", textDecoration: "line-through", fontSize: 13 }}>{Number(p.oldPrice).toLocaleString()} ل.ل</span>}
                  <span style={{ color: "#7CFC00", fontWeight: 800, fontSize: 18 }}>{Number(p.price).toLocaleString()} ل.ل</span>
                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={(e) => { e.stopPropagation(); addToCart(p); }} disabled={addingId === p.productID} style={{ flex: 1, background: "linear-gradient(to right,#a855f7,#ec4899)", border: 0, color: "#fff", padding: 10, borderRadius: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <ShoppingCart size={16} /> {addingId === p.productID ? "..." : "اضف للسلة"}
                  </button>
                                    <Link onClick={(e) => e.stopPropagation()} href={`/store/${p.storeID}`} style={{ background: "#222", color: "#fff", padding: "10px 12px", borderRadius: 12, textDecoration: "none", fontSize: 13, display: "flex", alignItems: "center" }}>المتجر</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {toast && <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#fff", color: "#000", padding: "10px 18px", borderRadius: 999, fontWeight: 700, zIndex: 999, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>{toast}</div>}
    </div>
  );
}
