// جديد - على last-update - للباكروند - حتى وهو مسكر - من دون import - مشان Vercel ما يفشل
export async function startBackgroundGeofence(userId) {
  try {
    if (!window.Capacitor) return;
    const Plugins = window.Capacitor.Plugins;
    if (!Plugins) return;

    const Geolocation = Plugins.Geolocation;
    const BackgroundGeolocation = Plugins.BackgroundGeolocation;
    if (!Geolocation || !BackgroundGeolocation) return;

    try {
      await Geolocation.requestPermissions();
    } catch (e) {}

    try {
      await BackgroundGeolocation.start({
        distanceFilter: 100,
      });
    } catch (e) {}

    BackgroundGeolocation.addListener("location", async (pos) => {
      try {
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
      } catch (e) {}
    });
  } catch (e) {}
}
