"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function AIGuidePage() {
  const [openStep, setOpenStep] = useState(null);

  const steps = [
    {
      icon: "👋",
      title: "ابدأ المحادثة",
      text: "تواصل مع MD-Marketplace AI عبر WhatsApp وابدأ بطلبك أو سؤالك مباشرة.",
    },
    {
      icon: "🔎",
      title: "ابحث عن المنتج",
      text: "اكتب اسم المنتج الذي تريده بطريقة طبيعية، والمساعد يبحث لك عن المنتجات المتوفرة فعلياً.",
    },
    {
      icon: "🥤",
      title: "اختر الحجم أو الوحدة",
      text: "إذا كان المنتج موجوداً بأكثر من حجم، سيطلب منك المساعد اختيار الحجم المناسب قبل إضافته إلى السلة.",
    },
    {
      icon: "🛒",
      title: "أضف إلى السلة",
      text: "بعد اختيار المنتج والحجم والكمية، يتم إضافته إلى سلة مشترياتك.",
    },
    {
      icon: "📋",
      title: "راجع السلة",
      text: "يمكنك طلب عرض السلة، تعديل الكمية أو حذف أي منتج قبل إتمام الطلب.",
    },
    {
      icon: "📍",
      title: "حدد التوصيل",
      text: "عند تجهيز الطلب، يتم تحديد منطقة وعنوان التوصيل وموقعك المسجل.",
    },
    {
      icon: "✅",
      title: "أكد الطلب",
      text: "بعد مراجعة كل التفاصيل، اكتب «تأكيد الطلب» حتى يتم إرسال الطلب فعلياً.",
    },
    {
      icon: "📦",
      title: "تابع طلبك",
      text: "بعد إنشاء الطلب، يمكنك متابعة حالته والاستفسار عنه من خلال المساعد.",
    },
  ];

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-white text-[#11183f]"
    >
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="MD-Marketplace"
              width={190}
              height={70}
              className="h-auto w-[150px] sm:w-[180px]"
              priority
            />
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold transition hover:border-purple-400 hover:text-purple-700 sm:block"
            >
              الرئيسية
            </Link>

            <a
              href="https://wa.me/"
              className="rounded-full bg-gradient-to-r from-[#641ee8] to-[#ed1687] px-5 py-2 text-sm font-bold text-white shadow-md transition hover:scale-105"
            >
              💬 تحدث مع AI
            </a>
          </div>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden">
        <div className="absolute -right-32 top-20 h-72 w-72 rounded-full bg-purple-100/60 blur-3xl" />
        <div className="absolute -left-32 top-40 h-72 w-72 rounded-full bg-pink-100/60 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:py-24">
          
          {/* AI CHARACTER */}
          <div className="order-2 flex justify-center lg:order-1">
            <div className="relative">
              
              {/* Floating circles */}
              <div className="absolute -left-5 top-12 animate-bounce text-3xl">
                ✨
              </div>

              <div className="absolute -right-5 top-5 animate-pulse text-3xl">
                💬
              </div>

              {/* Robot */}
              <div className="relative flex h-[280px] w-[280px] items-center justify-center rounded-full bg-gradient-to-br from-purple-50 to-pink-50 shadow-[0_20px_70px_rgba(110,40,220,0.15)] sm:h-[350px] sm:w-[350px]">
                
                <div className="animate-[float_4s_ease-in-out_infinite]">
                  <div className="relative">
                    
                    {/* Antenna */}
                    <div className="mx-auto mb-2 h-10 w-1.5 rounded-full bg-gradient-to-b from-purple-700 to-pink-500">
                      <div className="absolute -mt-3 ml-[-5px] h-4 w-4 rounded-full bg-purple-600 shadow-lg" />
                    </div>

                    {/* Head */}
                    <div className="relative h-28 w-40 rounded-[35px] border-4 border-purple-600 bg-white shadow-xl sm:h-32 sm:w-48">
                      
                      {/* Face */}
                      <div className="absolute inset-3 flex items-center justify-center rounded-[25px] bg-[#11183f]">
                        <div className="flex items-center gap-5 text-white">
                          <span className="text-2xl">◡</span>
                          <span className="text-2xl">◡</span>
                        </div>

                        <div className="absolute bottom-4 h-2 w-8 rounded-full bg-white" />
                      </div>

                      {/* Ear */}
                      <div className="absolute -right-5 top-8 h-14 w-6 rounded-r-full bg-purple-600" />
                      <div className="absolute -left-5 top-8 h-14 w-6 rounded-l-full bg-purple-600" />
                    </div>

                    {/* Body */}
                    <div className="mx-auto mt-2 flex h-28 w-36 items-center justify-center rounded-[30px] bg-gradient-to-br from-purple-700 to-pink-500 shadow-xl sm:h-32 sm:w-40">
                      <div className="rounded-2xl bg-white/95 px-4 py-2 text-xl font-black text-purple-700">
                        MD
                      </div>
                    </div>

                    {/* Hands */}
                    <div className="absolute -left-10 top-40 text-4xl">
                      👋
                    </div>

                    <div className="absolute -right-10 top-40 text-4xl">
                      👋
                    </div>

                  </div>
                </div>

                {/* AI Badge */}
                <div className="absolute -bottom-4 rounded-full bg-gradient-to-r from-purple-700 to-pink-500 px-7 py-2 text-lg font-black text-white shadow-lg">
                  AI
                </div>
              </div>

              {/* Speech bubble */}
              <div className="absolute -right-10 -top-7 hidden max-w-[230px] rounded-3xl bg-white p-4 text-center text-sm font-bold shadow-xl sm:block">
                👋 مرحباً!
                <br />
                أنا مساعدك الذكي
                <br />
                جاهز لمساعدتك بأي وقت
                <div className="absolute bottom-[-8px] right-10 h-4 w-4 rotate-45 bg-white" />
              </div>
            </div>
          </div>

          {/* TEXT */}
          <div className="order-1 text-center lg:order-2 lg:text-right">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-purple-50 px-4 py-2 text-sm font-bold text-purple-700">
              🤖 MD-Marketplace AI
            </div>

            <h1 className="text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              دليل استخدام
              <br />
              <span className="bg-gradient-to-r from-purple-700 to-pink-500 bg-clip-text text-transparent">
                MD-Marketplace AI
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-9 text-gray-600 lg:mx-0">
              مساعدك الذكي للبحث، الشراء، متابعة الطلبات والاستفسار عن المنتجات
              بطريقة سهلة وسريعة عبر WhatsApp.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <a
                href="https://wa.me/"
                className="rounded-full bg-gradient-to-r from-purple-700 to-pink-500 px-7 py-4 font-bold text-white shadow-lg transition hover:scale-105"
              >
                💬 ابدأ المحادثة
              </a>

              <a
                href="#how"
                className="rounded-full border border-gray-200 px-7 py-4 font-bold transition hover:border-purple-400 hover:text-purple-700"
              >
                📖 كيف يعمل؟
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ================= INTRO ================= */}
      <section className="mx-auto max-w-5xl px-5 pb-16">
        <div className="rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50/70 to-pink-50/50 p-7 shadow-sm sm:p-10">
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-right">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow">
              🛍️
            </div>

            <div>
              <h2 className="text-xl font-black">
                مساعدك الذكي من MD-Marketplace
              </h2>

              <p className="mt-2 leading-8 text-gray-600">
                مساعدك الذكي مخصّص حصرياً لمعالجة طلباتك والإجابة عن
                استفساراتك بشكل مباشر. اكتب طلبك أو سؤالك بوضوح لتحصل على
                تجربة ذكية وسلسة مع متاجر طرابلس والشمال.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section id="how" className="bg-gray-50/70 py-16">
        <div className="mx-auto max-w-7xl px-5">
          
          <div className="mb-10 text-center">
            <span className="text-2xl">✨</span>
            <h2 className="mt-2 text-3xl font-black sm:text-4xl">
              ماذا يمكنك أن تفعل مع AI؟
            </h2>
            <p className="mt-3 text-gray-500">
              كل شيء بطريقة بسيطة وطبيعية.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <button
                key={index}
                onClick={() =>
                  setOpenStep(openStep === index ? null : index)
                }
                className="group rounded-3xl border border-gray-100 bg-white p-6 text-right shadow-sm transition hover:-translate-y-1 hover:border-purple-200 hover:shadow-xl"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 text-3xl">
                    {step.icon}
                  </div>

                  <span className="text-sm font-bold text-purple-500">
                    {index + 1}
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-black">
                  {step.title}
                </h3>

                <p
                  className={`mt-2 text-sm leading-7 text-gray-500 ${
                    openStep === index ? "" : "line-clamp-2"
                  }`}
                >
                  {step.text}
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ================= EXAMPLE ================= */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid gap-8 lg:grid-cols-2">
          
          {/* Conversation */}
          <div className="rounded-3xl border border-gray-100 bg-white p-7 shadow-lg">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-2xl">
                💬
              </div>

              <div>
                <h2 className="font-black">مثال على المحادثة</h2>
                <p className="text-sm text-gray-500">
                  مثال بسيط على طلب منتج
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="mr-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-gray-100 p-4 text-sm">
                بدي بيبسي
              </div>

              <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-gradient-to-r from-purple-700 to-pink-500 p-4 text-sm text-white">
                أكيد 😊 لقيتلك بيبسي بأكثر من حجم.
                <br />
                أي حجم بدك؟
                
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/15 px-4 py-2 font-bold">
                    250 مل
                  </span>

                  <span className="rounded-full bg-white/15 px-4 py-2 font-bold">
                    1.5 لتر
                  </span>

                  <span className="rounded-full bg-white/15 px-4 py-2 font-bold">
                    2 لتر
                  </span>
                </div>
              </div>

              <div className="mr-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-gray-100 p-4 text-sm">
                بدي 2 لتر، عدد 2
              </div>

              <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-gradient-to-r from-purple-700 to-pink-500 p-4 text-sm text-white">
                ✅ تمام، ضفتلك 2 × بيبسي 2 لتر بالسلة.
                <br />
                لما تخلص، اكتبلي <b>تأكيد الطلب</b>.
              </div>
            </div>
          </div>

          {/* Rules */}
          <div className="rounded-3xl bg-[#11183f] p-8 text-white shadow-xl">
            <div className="text-3xl">💡</div>

            <h2 className="mt-4 text-2xl font-black">
              كيف تحكي مع المساعد؟
            </h2>

            <div className="mt-6 space-y-4 text-sm leading-8 text-white/80">
              <div>
                <b className="text-white">✔ اكتب بطريقة طبيعية</b>
                <br />
                ما في داعي تحفظ أوامر معقدة.
              </div>

              <div>
                <b className="text-white">✔ إذا المنتج له أكثر من حجم</b>
                <br />
                المساعد سيسألك عن الحجم قبل الإضافة.
              </div>

              <div>
                <b className="text-white">✔ راجع طلبك قبل التأكيد</b>
                <br />
                لن يتم اعتماد الطلب إلا بعد تأكيدك بشكل واضح.
              </div>

              <div>
                <b className="text-white">✔ لا يوجد تأكيد بالخطأ</b>
                <br />
                كلمات مثل «تمام» أو «خلص» لا تعتبر تأكيداً نهائياً للطلب.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="px-5 pb-20">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[35px] bg-gradient-to-r from-purple-700 to-pink-500 p-8 text-center text-white shadow-2xl sm:p-12">
          <div className="text-4xl">🤖</div>

          <h2 className="mt-4 text-3xl font-black">
            جاهز تجرب مساعدك الذكي؟
          </h2>

          <p className="mx-auto mt-3 max-w-xl leading-8 text-white/90">
            ابحث عن منتج، أضفه إلى سلتك، جهّز طلبك وتابعه بسهولة.
          </p>

          <a
            href="https://wa.me/"
            className="mt-7 inline-flex rounded-full bg-white px-8 py-4 font-black text-purple-700 shadow-lg transition hover:scale-105"
          >
            💬 تواصل مع MD-Marketplace AI
          </a>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-gray-100 bg-white py-8 text-center">
        <Image
          src="/logo.png"
          alt="MD-Marketplace"
          width={150}
          height={60}
          className="mx-auto mb-3 w-[130px]"
        />

        <p className="text-sm text-gray-500">
          هذه الخدمة حصرية لشركة MD-Marketplace لضمان تجربة موثوقة ومنظمة.
        </p>

        <p className="mt-2 text-xs text-gray-400">
          © {new Date().getFullYear()} MD-Marketplace
        </p>
      </footer>

      {/* Floating AI */}
      <a
        href="https://wa.me/"
        className="fixed bottom-6 left-6 z-50 flex h-16 w-16 animate-bounce items-center justify-center rounded-full bg-gradient-to-br from-purple-700 to-pink-500 text-3xl shadow-2xl transition hover:scale-110"
        aria-label="MD-Marketplace AI"
      >
        🤖
      </a>

      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-12px);
          }
        }
      `}</style>
    </main>
  );
}
