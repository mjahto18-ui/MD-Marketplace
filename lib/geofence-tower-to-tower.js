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
  let best = null;
  let bestDist = Infinity;
  for (const c of centers) {
    // طافي - تخطاه
    if (c.is_active === false || c.is_active === 0 || c.active === false) continue;
    if (c.cart_enabled === false || c.cart_enabled === 0) continue;
    const cLat = Number(c.center_lat ?? c.lat ?? 0);
    const cLng = Number(c.center_lng ?? c.lng ?? 0);
    if (!cLat || !cLng) continue;
    // انت بالكيلو - 5 = 5 كلم - 1 = 1 كلم - ما منقسم على 1000
    const radiusInKm = Number(c.radius_cart ?? c.radius ?? 0);
    if (!radiusInKm) continue;
    const d = distanceKm(lat, lng, cLat, cLng);
    if (d <= radiusInKm && d < bestDist) {
      best = c;
      bestDist = d;
    }
  }
  return best;
}

// هل انتقل من برج لبرج؟ - اذا البرج الجديد غير القديم - ايه
export function isTowerChange(oldTowerId, newTowerId) {
  // طلع من برج وراح لمحل ما فيه برج - هيدا تغيير كمان - مشان نصفر lastTowerId
  if (!newTowerId && oldTowerId) return true;
  if (!newTowerId) return false;
  if (!oldTowerId) return true;
  return String(oldTowerId) !== String(newTowerId);
}
