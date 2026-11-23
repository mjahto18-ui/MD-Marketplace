"use client";
import { useState } from "react";

export default function GeofenceTestPage() {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const testTower = async () => {
    setLoading(true);
    setResult("عم جرب...");
    try {
      const res = await fetch("/api/geofence-tower-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "TEST-123",
          lat: 34.4366,
          lng: 35.8433,
          oldTowerId: "",
        }),
      });
      const j = await res.json();
      setResult(JSON.stringify(j, null, 2));
    } catch (e) {
      setResult("خطأ: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>تجربة Geofence - برج لبرج</h1>
      <p>هيدي صفحة تجربة - على last-update بس - مش على main</p>
      <button
        onClick={testTower}
        style={{ padding: "12px 20px", fontSize: 16, background: "#000", color: "#fff", borderRadius: 10 }}
      >
        {loading ? "عم جرب..." : "جرب برج طرابلس"}
      </button>
      <pre style={{ marginTop: 20, background: "#f5f5f5", padding: 15, borderRadius: 10 }}>{result}</pre>
    </div>
  );
}
