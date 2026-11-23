"use client";
import { useEffect, useState } from "react";

export default function GeofenceTestPage() {
  const [centers, setCenters] = useState([]);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  // جيب الليستة من الجدول القديم - قراية بس
  useEffect(() => {
    fetch("/api/debug-centers")
      .then((r) => r.json())
      .then((j) => {
        const list = j.centers || j.data || j || [];
        setCenters(Array.isArray(list) ? list : []);
      })
      .catch(() => setCenters([]));
  }, []);

  const testTower = async (c) => {
    setLoading(true);
    setResult("عم جرب برج " + (c.name || c.id) + "...");
    try {
      const lat = Number(c.center_lat ?? c.latitude ?? c.Lat ?? 0);
      const lng = Number(c.center_lng ?? c.longitude ?? c.Lng ?? 0);
      const res = await fetch("/api/geofence-tower-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "b530c8aa", lat, lng, oldTowerId: "" }),
      });
      const j = await res.json();
      setResult(JSON.stringify({ tower: c.name, lat, lng, ...j }, null, 2));
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
          جرب {c.name || c.id} - lat: {c.lat} - lng: {c.lng}
        </button>
      ))}
      <pre style={{ marginTop: 20, background: "#f5f5f5", padding: 15, borderRadius: 10 }}>{result}</pre>
      {loading && <p>عم جرب...</p>}
    </div>
  );
}
