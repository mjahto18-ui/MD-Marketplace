export default function sitemap() {
  return [
    {
      url: 'https://www.md-marketplace.store',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://www.md-marketplace.store/products',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ]
}
