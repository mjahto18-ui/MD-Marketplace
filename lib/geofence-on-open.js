// جديد - على last-update - بيشتغل لما الزبون يفتح الموقع
export async function checkTowerOnOpen(userId, lastTowerId) {
  if (!navigator.geolocation) return null;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
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
        if (j.towerId) localStorage.setItem("lastTowerId", j.towerId);
        resolve(j);
      } catch (e) { resolve(null); }
    }, () => resolve(null), { timeout: 5000 });
  });
}
