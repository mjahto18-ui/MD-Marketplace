import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "دليل استخدام MD-Marketplace AI | مساعدك الذكي",
  description: "تعلم كيف تستخدم مساعد MD-Marketplace الذكي لطلب المنتجات من متاجر طرابلس والشمال ومتابعة طلباتك بسهولة عبر الواتساب",
  keywords: "MD-Marketplace AI, مساعد ذكي, طلب منتجات طرابلس, دليل الاستخدام",
  openGraph: {
    title: "دليل استخدام MD-Marketplace AI",
    description: "مساعدك الذكي لطلب المنتجات ومتابعة الطلبات",
    url: "https://www.md-marketplace.store/ai-guide",
    images: ["/ai-guide.webp"],
  },
};

const steps = [
  { icon: "👋", title: "اكتب طلبك بطريقة طبيعية", text: "اكتب اسم المنتج أو السؤال بطريقة بسيطة وطبيعية، بدون الحاجة لحفظ أوامر معقدة." },
  { icon: "🔎", title: "ابحث عن المنتج", text: "المساعد يبحث لك عن المنتجات المتوفرة فعلياً ضمن متاجر MD-Marketplace." },
  { icon: "🥤", title: "اختر الحجم أو الوحدة", text: "إذا كان المنتج موجوداً بأكثر من حجم أو وحدة، سيطلب منك المساعد اختيار الخيار المناسب قبل إضافته إلى السلة." },
  { icon: "🛒", title: "أضف إلى السلة", text: "بعد اختيار المنتج والحجم والكمية، يتم إضافته إلى سلة مشترياتك." },
  { icon: "📋", title: "راجع السلة", text: "يمكنك طلب عرض السلة، تعديل الكمية أو حذف أي منتج قبل إتمام الطلب." },
  { icon: "📍", title: "جهّز معلومات التوصيل", text: "عند تجهيز الطلب، يتم استخدام منطقة وعنوان وموقع التوصيل المرتبط بحسابك." },
  { icon: "✅", title: "أكد الطلب", text: "بعد مراجعة كل التفاصيل، اكتب «تأكيد الطلب» حتى يتم إرسال الطلب فعلياً." },
  { icon: "📦", title: "تابع طلبك", text: "بعد إنشاء الطلب، يمكنك الاستفسار عن حالته ومتابعته من خلال خدمة MD-Marketplace AI." },
];

export default function AIGuidePage() {
  return (
    <main dir="rtl" className="min-h-screen bg-white text-[#11183f]">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/"><Image src="/logo.png" alt="MD-Marketplace" width={190} height={70} className="h-auto w- sm:w-" priority /></Link>
          <Link href="/" className="rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold transition hover:border-purple-400 hover:text-purple-700">الرئيسية</Link>
        </div>
      </header>

      {/* HERO - نفس كودك القديم... اختصرتو هون */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:py-24">
          <div className="order-2 flex justify-center lg:order-1">
            <div className="relative w-full max-w-">
              <div className="relative overflow-hidden rounded- bg-white shadow-[0_20px_70px_rgba(110,40,220,0.15)]">
                <Image src="/ai-guide.webp" alt="MD-Marketplace AI" width={800} height={450} priority className="h-auto w-full object-cover" />
              </div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-700 to-pink-500 px-7 py-2 text-lg font-black text-white shadow-lg">AI</div>
            </div>
          </div>
          <div className="order-1 text-center lg:order-2 lg:text-right">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-purple-50 px-4 py-2 text-sm font-bold text-purple-700">🤖 MD-Marketplace AI</div>
            <h1 className="text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">دليل استخدام<br/><span className="bg-gradient-to-r from-purple-700 to-pink-500 bg-clip-text text-transparent">MD-Marketplace AI</span></h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-9 text-gray-600 lg:mx-0">مساعدك الذكي المخصّص لخدمة طلباتك والإجابة عن استفساراتك بطريقة سهلة وسريعة، مع متاجر MD-Marketplace في طرابلس والشمال.</p>
            <a href="#how" className="mt-8 inline-flex rounded-full border border-gray-200 px-7 py-4 font-bold transition hover:border-purple-400 hover:text-purple-700">📖 تعرّف على طريقة الاستخدام</a>
          </div>
        </div>
      </section>

      {/* FEATURES - بدون useState */}
      <section id="how" className="bg-gray-50/70 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-10 text-center"><h2 className="mt-2 text-3xl font-black sm:text-4xl">كيف تستخدم MD-Marketplace AI؟</h2><p className="mt-3 text-gray-500">كل شيء بطريقة بسيطة وطبيعية.</p></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <details key={i} className="group rounded-3xl border border-gray-100 bg-white p-6 text-right shadow-sm open:border-purple-200 open:shadow-xl">
                <summary className="flex cursor-pointer list-none items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 text-3xl">{step.icon}</div>
                  <span className="text-sm font-bold text-purple-500">{i+1}</span>
                </summary>
                <h3 className="mt-5 text-lg font-black">{step.title}</h3>
                <p className="mt-2 text-sm leading-7 text-gray-500">{step.text}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* باقي صفحتك نفسا... */}
      <footer className="border-t border-gray-100 bg-white py-8 text-center">
        <p className="mt-2 text-xs text-gray-400">© {new Date().getFullYear()} MD-Marketplace</p>
      </footer>
    </main>
  );
}
