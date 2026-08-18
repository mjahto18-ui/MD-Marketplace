export async function generateMetadata({ params }) {
  const id = params.id;
  
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.md-marketplace.store'}/api/stores?id=${id}`, { 
      next: { revalidate: 3600 } 
    });
    const data = await res.json();
    const storeName = data?.store?.name || data?.name || `متجر ${id}`;

    return {
      title: `${storeName} - تسوق أونلاين | MD-Marketplace`,
      description: `تسوق من ${storeName} عبر MD-Marketplace. منتجات طازجة، أسعار منافسة، وتوصيل سريع لكل لبنان.`,
      openGraph: {
        title: `${storeName} | MD-Marketplace`,
        description: `منتجات ${storeName} - توصيل سريع وآمن`,
        url: `https://www.md-marketplace.store/store/${id}`,
        siteName: "MD-Marketplace",
        locale: "ar_LB",
        type: "website",
      },
      alternates: {
        canonical: `https://www.md-marketplace.store/store/${id}`,
      },
      robots: { index: true, follow: true },
    };
  } catch {
    return {
      title: `متجر - MD-Marketplace`,
      description: `تسوق من متاجر MD-Marketplace مع توصيل سريع`,
      robots: { index: true, follow: true },
    };
  }
}

export default function StoreLayout({ children }) {
  return children;
}
