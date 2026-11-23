// lib/geofence-tower-to-tower.js
// جديد - على last-update بس - ما بيعدل على شي قديم
// بيحسب اذا الزبون انتقل من برج لبرج - وهو مسكر

// حساب المسافة بين نقطتين - بالكيلومتر - Haversine
export function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// لاقي أي برج الزبون بقلبو - من جدول geofence_centers القديم - قراية بس
export function findTowerForLocation(lat, lng, centers) {
  if (!lat || !lng || !centers?.length) return null;
  for (const c of centers) {
    const cLat = Number(c.lat ?? c.latitude ?? c.Lat ?? 0);
    const cLng = Number(c.lng ?? c.longitude ?? c.Lng ?? 0);
    const radiusKm = Number(c.radius ?? c.radius_km ?? c.Radius ?? 0) || 0;
    // اذا radius بالـ متر - اكبر من 100 - حوله لكيلومتر
    const radiusInKm = radiusKm > 100 ? radiusKm / 1000 : radiusKm;
    if (!cLat || !cLng) continue;
    const d = distanceKm(lat, lng, cLat, cLng);
    if (d <= radiusInKm) return c;
  }
  return null;
}

// هل انتقل من برج لبرج؟ - اذا البرج الجديد غير القديم - ايه
export function isTowerChange(oldTowerId, newTowerId) {
  if (!newTowerId) return false;
  if (!oldTowerId) return true;
  return String(oldTowerId) !== String(newTowerId);
}
