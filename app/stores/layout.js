export const metadata = {
  title: "جميع المتاجر - +30 متجر في لبنان | MD-Marketplace",
  description: "تصفح أكثر من 30 متجر متعاقد مع MD-Marketplace في طرابلس وكل لبنان: سوبرماركت، ملحمة، خضرة وفواكه، ألبسة، إلكترونيات. توصيل سريع، منتجات طازجة، تقييمات حقيقية.",
  keywords: ["متاجر طرابلس", "سوبرماركت لبنان", "MD Marketplace متاجر", "تسوق اونلاين لبنان"],
  openGraph: {
    title: "جميع المتاجر - MD-Marketplace",
    description: "+30 متجر - توصيل سريع لكل لبنان",
    url: "https://www.md-marketplace.store/stores",
    siteName: "MD-Marketplace",
    images: [{ url: "/icon.png", width: 512, height: 512, alt: "MD-Marketplace Stores" }],
    locale: "ar_LB",
    type: "website",
  },
  alternates: {
    canonical: "https://www.md-marketplace.store/stores",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function StoresLayout({ children }) {
  return children;
}
