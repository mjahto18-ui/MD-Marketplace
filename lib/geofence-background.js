// جديد - على last-update - للباكروند - حتى وهو مسكر
import { Geolocation } from "@capacitor/geolocation";
import { BackgroundGeolocation } from "@capacitor-community/background-geolocation";

export async function startBackgroundGeofence(userId) {
  // 1. طلب إذن Always
  const perm = await Geolocation.requestPermissions();
  // 2. شغل المتابعة بالباكروند
  await BackgroundGeolocation.start({
    // كل ما يتحرك 100 متر - أو يدخل برج جديد - بعت
    distanceFilter: 100,
  });

  // 3. كل ما تغير الموقع - بعت للـ API - نفس الـ API
  BackgroundGeolocation.addListener("location", async (pos) => {
    const lastTowerId = localStorage.getItem("lastTowerId") || "";
    await fetch("/api/geofence-tower-event", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      cache: "no-store",
      body: JSON.stringify({
        userId,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        oldTowerId: lastTowerId,
      }),
    });
  });
}
