// /lib/loyalty.js - بس حساب، ما بيجيب داتا

export function calculateTierData(points, total_spent, tiers) {
  if (!tiers ||!tiers.length) return null;

  // حدد المرتبة الحالية حسب النقاط
  let current_tier = tiers[0];
  for (let t of tiers) {
    if (points >= t.min_points) {
      current_tier = t;
    }
  }

  // المرتبة الجاي
  let next_tier = tiers.find(t => t.tier_level === current_tier.tier_level + 1) || null;

  // التعباية
  let fill_rate = 1;
  if (current_tier.min_spent && current_tier.min_spent > 0) {
    fill_rate = total_spent / current_tier.min_spent;
    if (fill_rate > 1) fill_rate = 1;
    if (fill_rate < 0) fill_rate = 0;
  }

  // الخصم الفعلي
  let actual_discount = Number(current_tier.base_discount) * fill_rate;

  return {
    current_tier: {
      name: current_tier.tier_name,
      slug: current_tier.tier_slug,
      level: current_tier.tier_level,
      min_points: current_tier.min_points,
      min_spent: current_tier.min_spent,
      base_discount: Number(current_tier.base_discount),
      color: current_tier.color,
      fill_rate: fill_rate,
      fill_rate_percent: Math.round(fill_rate * 100),
      actual_discount: Number(actual_discount.toFixed(2))
    },
    next_tier: next_tier? {
      name: next_tier.tier_name,
      slug: next_tier.tier_slug,
      level: next_tier.tier_level,
      points_needed: Math.max(0, next_tier.min_points - points),
      spent_needed: Math.max(0, next_tier.min_spent - total_spent),
      min_points: next_tier.min_points,
      min_spent: next_tier.min_spent
    } : null
  };
}
