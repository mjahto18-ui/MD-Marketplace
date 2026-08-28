export const metadata = {
  title: "قصة تأسيس MD-Marketplace - عندما تفهم التجارة الإنسان",
  description: "لماذا بنينا MD-Marketplace؟ قصة منظومة تجارة محلية ذكية تربط العملاء والمتاجر والسائقين، وتجعل الطلب بكلمة على الموقع أو واتساب مع حماية حق وتوصيل آمن.",
  openGraph: {
    title: "قصة تأسيس MD-Marketplace",
    description: "كيف بنينا منظومة تجارة تفهم الإنسان بدل ما تجبره يتعلم النظام",
    url: "https://www.md-marketplace.store/our-story",
    siteName: "MD-Marketplace",
    images: [{ url: "/icon.png", width: 512, height: 512 }],
    locale: "ar_LB",
    type: "article",
  },
  alternates: { canonical: "https://www.md-marketplace.store/our-story" },
  robots: { index: true, follow: true },
};

export default function OurStoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
