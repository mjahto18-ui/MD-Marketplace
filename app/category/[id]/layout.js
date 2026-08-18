const categoriesMap = {
  "1": "مطاعم وأكل",
  "2": "سوبرماركت",
  "3": "ألبسة وأزياء",
  "4": "حلويات",
  "5": "صيدليات",
};

export async function generateMetadata({ params }) {
  const id = params.id;
  const catName = categoriesMap[id] || `فئة ${id}`;

  return {
    title: `${catName} - متاجر ${catName} في لبنان | MD-Marketplace`,
    description: `تسوق من أفضل متاجر ${catName} في طرابلس ولبنان عبر MD-Marketplace. توصيل سريع، منتجات طازجة، دفع عند الاستلام.`,
    keywords: [`${catName} طرابلس`, `${catName} لبنان`, `متاجر ${catName}`],
    openGraph: {
      title: `${catName} | MD-Marketplace`,
      description: `أفضل متاجر ${catName} - توصيل سريع`,
      url: `https://www.md-marketplace.store/category/${id}`,
      siteName: "MD-Marketplace",
      locale: "ar_LB",
      type: "website",
    },
    alternates: {
      canonical: `https://www.md-marketplace.store/category/${id}`,
    },
    robots: { index: true, follow: true },
  };
}

export default function CategoryLayout({ children }) {
  return children;
}
