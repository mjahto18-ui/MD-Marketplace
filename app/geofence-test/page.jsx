"use client";
import { useEffect, useState } from "react";

export default function GeofenceTestPage() {
  const [centers, setCenters] = useState([]);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/debug-centers")
      .then((r) => r.json())
      .then((j) => {
        const list = j.active || j.all || j.centers || j.data || [];
        setCenters(Array.isArray(list) ? list : []);
      })
      .catch(() => setCenters([]));
  }, []);

  const testTower = async (c) => {
    setLoading(true);
    setResult("عم جرب برج " + (c.name || c.id) + "...");
    try {
      const cLat = Number(c.center_lat ?? c.lat ?? 0);
      const cLng = Number(c.center_lng ?? c.lng ?? 0);
      const radiusKm = Number(c.radius_cart ?? c.radius ?? 0);
      
      const res = await fetch("/api/geofence-tower-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "b530c8aa", lat: cLat, lng: cLng, oldTowerId: "" }),
      });
      const j = await res.json();
      setResult(JSON.stringify({ tower: c.name, lat: cLat, lng: cLng, radiusKm, ...j }, null, 2));
    } catch (e) {
      setResult("خطأ: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>تجربة Geofence - برج لبرج</h1>
      <p>الليستة من جدول geofence_centers - القديم - مش تخمين</p>
      {centers.length === 0 && <p>عم جيب الليستة... أو ما لقيت أبراج - شوف /api/debug-centers</p>}
      {centers.map((c) => (
        <button
          key={c.id}
          onClick={() => testTower(c)}
          style={{ display: "block", margin: "8px 0", padding: "12px 16px", fontSize: 15, background: "#000", color: "#fff", borderRadius: 10 }}
        >
          جرب {c.name || c.id} - lat: {c.center_lat} - lng: {c.center_lng} - radius: {c.radius_cart}km
        </button>
      ))}
      <pre style={{ marginTop: 20, background: "#f5f5f5", padding: 15, borderRadius: 10 }}>{result}</pre>
      {loading && <p>عم جرب...</p>}
    </div>
  );
}
