// lib/geofence-background.js
export async function startBackgroundGeofence(userId) {
  try {
    if (typeof window === "undefined") return;
    if (!window.Capacitor) return;

       let BackgroundGeolocation = null;
    try {
      const pkgName = "@capacitor-community" + "/background-geolocation";
      const mod = await import(/* webpackIgnore: true */ pkgName);
      BackgroundGeolocation = mod.BackgroundGeolocation || mod.default?.BackgroundGeolocation || null;
    } catch (e) { return; }
    if (!BackgroundGeolocation) return;

    const { Geolocation } = await import("@capacitor/geolocation");
    try {
      await Geolocation.requestPermissions({ permissions: ["location", "coarseLocation"] });
    } catch (e) {}

    await BackgroundGeolocation.configure({
      distanceFilter: 100,
      stopOnTerminate: false,
      startOnBoot: true,
      foregroundService: true,
      notificationTitle: "MD-Marketplace",
      notificationText: "عم نحدد برجك مشان نخدمك أسرع",
    });

    await BackgroundGeolocation.addWatcher(
      {
        backgroundMessage: "عم نحدد برجك مشان نخدمك أسرع",
        backgroundTitle: "MD-Marketplace",
        requestPermissions: true,
        stale: false,
        distanceFilter: 100,
      },
      async (pos) => {
        try {
          if (!pos) return;
          const lat = pos.latitude ?? pos.coords?.latitude;
          const lng = pos.longitude ?? pos.coords?.longitude;
          if (!lat || !lng) return;

          const lastTowerId = localStorage.getItem("lastTowerId") || "";
          const res = await fetch("/api/geofence-tower-event", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
            cache: "no-store",
            body: JSON.stringify({ userId, lat, lng, oldTowerId: lastTowerId }),
          });
          const data = await res.json().catch(() => null);
          const newTowerId = data?.towerId || data?.newTowerId || data?.centerId || "";
          if (newTowerId) localStorage.setItem("lastTowerId", String(newTowerId));
          if (data?.towerId === null || data?.towerId === "") localStorage.setItem("lastTowerId", "");
        } catch (e) {}
      }
    );

    try {
      await BackgroundGeolocation.start();
    } catch (e) {}
  } catch (e) {}
}
