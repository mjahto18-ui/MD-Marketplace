export const metadata = {
  title: "المتجر - تسوق من كل الأقسام | MD-Marketplace",
  description: "تصفح جميع أقسام MD-Marketplace: سوبرماركت، خضرة، لحمة، ألبسة وأكثر. +30 متجر، توصيل سريع لكل لبنان.",
  robots: {
    index: false,  // ما منخلي غوغل يأرشف صفحة المتجر الداخلية - بس الصفحات العامة
    follow: true,
  },
  alternates: {
    canonical: "https://www.md-marketplace.store/shop",
  },
};

export default function ShopLayout({ children }) {
  return children;
}
