export const metadata = {
  title: "جميع المنتجات | MD-Marketplace",
  description: "تصفح كل المنتجات من كل المتاجر",
  robots: {
    index: false, // مهم جداً! ما منخلي غوغل يأرشفها لأنها بتحتاج تسجيل دخول
    follow: true,
  },
  alternates: {
    canonical: "https://www.md-marketplace.store/products",
  },
};

export default function ProductsLayout({ children }) {
  return children;
}
