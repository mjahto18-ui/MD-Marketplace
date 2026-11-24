export async function checkTowerOnOpen(userId, lastTowerId) {
  if (!navigator.geolocation) return null;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch("/api/geofence-tower-event", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
            cache: "no-store",
            body: JSON.stringify({
              userId,
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              oldTowerId: lastTowerId || "",
            }),
          });
          const j = await res.json();
          console.log("TOWER_CHECK_RESULT:", j); // رح تشوف النتيجة بالكونسول
          if (j.towerId) localStorage.setItem("lastTowerId", j.towerId);
          resolve(j);
        } catch (e) {
          console.error("TOWER_FETCH_ERROR:", e);
          resolve(null);
        }
      },
      (err) => {
        console.error("GPS_ERROR:", err.message); // رح يخبرك اذا رفض الموقع أو خلص الوقت
        resolve(null);
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
    );
  });
}
