export const metadata = {
  title: "خدمة حماية المستخدم - تقديم بلاغ | MD-Marketplace",
  description: "خدمة حماية المستخدم من MD-Marketplace. قدم بلاغ عن طلب لم يصل، منتج تالف، تأخير توصيل أو خطأ في الشحن. نضمن حقك ونرد خلال 24 ساعة مع متابعة عبر واتساب.",
  keywords: ["حماية المستخدم", "بلاغ MD Marketplace", "شكوى طلب", "ضمان حق العميل"],
  openGraph: {
    title: "حماية المستخدم - MD-Marketplace",
    description: "نضمن حقك - قدم بلاغك الآن ونتابعه حتى الحل",
    url: "https://www.md-marketplace.store/protection-cases",
    siteName: "MD-Marketplace",
    locale: "ar_LB",
    type: "website",
  },
  alternates: {
    canonical: "https://www.md-marketplace.store/protection-cases",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ProtectionLayout({ children }) {
  return children;
}
