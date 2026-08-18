export const metadata = {
  title: "من نحن - MD-Marketplace | منصتك الرقمية الذكية في لبنان",
  description: "منصّة متكاملة تجمع العملاء والمتاجر والسائقين في تطبيق واحد. تسوق وتوصيل سريع وآمن في لبنان مع دفع نقدي أو عبر Wish، تتبع مباشر، و+30 متجر متعاقد.",
  openGraph: {
    title: "من نحن - MD-Marketplace",
    description: "منصتك الرقمية الذكية للتسوق والتوصيل في لبنان - تجربة آمنة وسريعة",
    url: "https://www.md-marketplace.store/about",
    siteName: "MD-Marketplace",
    images: [{ url: "/icon.png", width: 512, height: 512, alt: "MD-Marketplace" }],
    locale: "ar_LB",
    type: "website",
  },
  alternates: { canonical: "https://www.md-marketplace.store/about" },
  robots: { index: true, follow: true },
};

export default function AboutLayout({ children }) {
  return children;
}
