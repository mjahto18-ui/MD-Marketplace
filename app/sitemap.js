export default async function sitemap() {
  const base = "https://www.md-marketplace.store";
  const now = new Date();

  const staticRoutes = [
    { url: `${base}`, priority: 1, changeFrequency: "daily" },
    { url: `${base}/about`, priority: 0.9, changeFrequency: "weekly" },
    { url: `${base}/ai-guide`, priority: 0.9, changeFrequency: "weekly" }, // هاي ضفناها
    { url: `${base}/privacy`, priority: 0.7, changeFrequency: "monthly" },
    { url: `${base}/terms`, priority: 0.7, changeFrequency: "monthly" },
    { url: `${base}/shop`, priority: 0.9, changeFrequency: "daily" },
    { url: `${base}/stores`, priority: 0.8, changeFrequency: "daily" },
    { url: `${base}/category/1`, priority: 0.8, changeFrequency: "weekly" },
    { url: `${base}/category/2`, priority: 0.8, changeFrequency: "weekly" },
    { url: `${base}/category/3`, priority: 0.8, changeFrequency: "weekly" },
    { url: `${base}/category/4`, priority: 0.8, changeFrequency: "weekly" },
    { url: `${base}/category/5`, priority: 0.8, changeFrequency: "weekly" },
    { url: `${base}/category/6`, priority: 0.8, changeFrequency: "weekly" },
  ].map(r => ({ ...r, lastModified: now }));

  // جيب المتاجر لحالهن
  try {
    const res = await fetch(`${base}/api/stores`, { cache: "no-store" });
    const data = await res.json();
    const stores = (data.stores || data || []).slice(0, 200).map(s => {
      const id = s.storeID || s.store_id || s.id;
      return {
        url: `${base}/store/${id}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
      };
    });
    return [...staticRoutes, ...stores];
  } catch (e) {
    return staticRoutes;
  }
}
