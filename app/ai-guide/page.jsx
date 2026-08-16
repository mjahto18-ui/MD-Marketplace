"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function AIGuidePage() {
  const [openStep, setOpenStep] = useState(null);

  const steps = [
    {
      icon: "👋",
      title: "اكتب طلبك بطريقة طبيعية",
      text: "اكتب اسم المنتج أو السؤال بطريقة بسيطة وطبيعية، بدون الحاجة لحفظ أوامر معقدة.",
    },
    {
      icon: "🔎",
      title: "ابحث عن المنتج",
      text: "المساعد يبحث لك عن المنتجات المتوفرة فعلياً ضمن متاجر MD-Marketplace.",
    },
    {
      icon: "🥤",
      title: "اختر الحجم أو الوحدة",
      text: "إذا كان المنتج موجوداً بأكثر من حجم أو وحدة، سيطلب منك المساعد اختيار الخيار المناسب قبل إضافته إلى السلة.",
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
      title: "جهّز معلومات التوصيل",
      text: "عند تجهيز الطلب، يتم استخدام منطقة وعنوان وموقع التوصيل المرتبط بحسابك.",
    },
    {
      icon: "✅",
      title: "أكد الطلب",
      text: "بعد مراجعة كل التفاصيل، اكتب «تأكيد الطلب» حتى يتم إرسال الطلب فعلياً.",
    },
    {
      icon: "📦",
      title: "تابع طلبك",
      text: "بعد إنشاء الطلب، يمكنك الاستفسار عن حالته ومتابعته من خلال خدمة MD-Marketplace AI.",
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
              className="rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold transition hover:border-purple-400 hover:text-purple-700"
            >
              الرئيسية
            </Link>

          </div>
        </div>
      </header>


      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden">

        <div className="absolute -right-32 top-20 h-72 w-72 rounded-full bg-purple-100/60 blur-3xl" />
        <div className="absolute -left-32 top-40 h-72 w-72 rounded-full bg-pink-100/60 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:py-24">

          {/* ================= AI IMAGE ================= */}
          <div className="order-2 flex justify-center lg:order-1">

            <div className="relative w-full max-w-[560px]">

              <div className="relative overflow-hidden rounded-[32px] bg-white shadow-[0_20px_70px_rgba(110,40,220,0.15)]">

                <Image
                  src="/ai-guide.webp"
                  alt="MD-Marketplace AI"
                  width={800}
                  height={450}
                  priority
                  className="h-auto w-full object-cover"
                />

              </div>

              {/* AI BADGE */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-700 to-pink-500 px-7 py-2 text-lg font-black text-white shadow-lg">
                AI
              </div>

              {/* SPEECH BUBBLE */}
              <div className="absolute -right-3 -top-7 hidden max-w-[230px] rounded-3xl bg-white p-4 text-center text-sm font-bold shadow-xl sm:block">

                👋 مرحباً!
                <br />
                أنا مساعدك الذكي
                <br />
                لمساعدتك في طلباتك واستفساراتك

                <div className="absolute bottom-[-8px] right-10 h-4 w-4 rotate-45 bg-white" />

              </div>

            </div>
          </div>


          {/* ================= TEXT ================= */}
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
              مساعدك الذكي المخصّص لخدمة طلباتك والإجابة عن استفساراتك
              بطريقة سهلة وسريعة، مع متاجر MD-Marketplace في طرابلس والشمال.
            </p>

            <a
              href="#how"
              className="mt-8 inline-flex rounded-full border border-gray-200 px-7 py-4 font-bold transition hover:border-purple-400 hover:text-purple-700"
            >
              📖 تعرّف على طريقة الاستخدام
            </a>

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

              <p className="mt-3 leading-8 text-gray-600">
                تم تصميم الخدمة لتسهيل الوصول إلى حالة طلباتك، تقديم طلب
                مباشر، أو الاستفسار عن أي منتج بطريقة بسيطة وطبيعية.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* ================= REGISTERED / NON REGISTERED ================= */}
      <section className="mx-auto max-w-7xl px-5 pb-20">

        <div className="mb-10 text-center">

          <span className="text-2xl">
            🔐
          </span>

          <h2 className="mt-2 text-3xl font-black sm:text-4xl">
            الخدمة للمسجّل وغير المسجّل
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-gray-500 leading-7">
            يمكنك التعرّف على MD-Marketplace AI والاستفسار عن الخدمة،
            أما الميزات الكاملة فتكون مرتبطة بحسابك.
          </p>

        </div>


        <div className="grid gap-6 lg:grid-cols-2">

          {/* NON REGISTERED */}
          <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition hover:shadow-lg">

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-3xl">
                👤
              </div>

              <div>
                <h3 className="text-xl font-black">
                  للمستخدم غير المسجّل
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  تعرّف على الخدمة واطرح استفساراتك
                </p>
              </div>

            </div>

            <div className="mt-6 space-y-3 text-sm leading-7 text-gray-600">

              <p>
                ✔ يمكنك التعرّف على MD-Marketplace AI وطريقة استخدامه.
              </p>

              <p>
                ✔ يمكنك الاستفسار والتعرّف على المنتجات والخدمات المتوفرة.
              </p>

              <p>
                ✔ للاستفادة من خدمات الطلب والمتابعة والميزات المرتبطة
                بحسابك، يجب إنشاء حساب أو تسجيل الدخول.
              </p>

            </div>

            <div className="mt-6 rounded-2xl bg-gray-50 p-5">

              <p className="font-bold text-[#11183f]">
                🔐 سجّل دخولك لتحصل على التجربة الكاملة والاستجابة الشخصية
                لطلباتك.
              </p>

            </div>

          </div>


          {/* REGISTERED */}
          <div className="rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50/70 to-pink-50/50 p-8 shadow-sm transition hover:shadow-lg">

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
                ⭐
              </div>

              <div>
                <h3 className="text-xl font-black">
                  للمستخدم المسجّل
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  التجربة الكاملة لخدمات MD-Marketplace AI
                </p>
              </div>

            </div>

            <div className="mt-6 space-y-3 text-sm leading-7 text-gray-600">

              <p>
                ✔ البحث عن المنتجات المتوفرة فعلياً.
              </p>

              <p>
                ✔ إضافة المنتجات إلى السلة وتعديلها.
              </p>

              <p>
                ✔ تجهيز الطلب وتأكيده.
              </p>

              <p>
                ✔ استخدام معلومات التوصيل المرتبطة بالحساب لتسهيل الطلب.
              </p>

              <p>
                ✔ متابعة حالة الطلب والاستفسار عنه.
              </p>

              <p>
                ✔ الاستفادة من المزايا المرتبطة بحسابك في MD-Marketplace.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* ================= FEATURES ================= */}
      <section
        id="how"
        className="bg-gray-50/70 py-16"
      >

        <div className="mx-auto max-w-7xl px-5">

          <div className="mb-10 text-center">

            <span className="text-2xl">
              ✨
            </span>

            <h2 className="mt-2 text-3xl font-black sm:text-4xl">
              كيف تستخدم MD-Marketplace AI؟
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
                  setOpenStep(
                    openStep === index ? null : index
                  )
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
                    openStep === index
                      ? ""
                      : "line-clamp-2"
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


          {/* ================= CONVERSATION ================= */}
          <div className="rounded-3xl border border-gray-100 bg-white p-7 shadow-lg">

            <div className="mb-6 flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-2xl">
                💬
              </div>

              <div>

                <h2 className="font-black">
                  مثال على المحادثة
                </h2>

                <p className="text-sm text-gray-500">
                  عندما يكون للمنتج أكثر من حجم
                </p>

              </div>

            </div>


            <div className="space-y-4">

              {/* Customer */}
              <div className="mr-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-gray-100 p-4 text-sm">
                بدي بيبسي
              </div>


              {/* AI */}
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


              {/* Customer */}
              <div className="mr-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-gray-100 p-4 text-sm">
                بدي 2 لتر، عدد 2
              </div>


              {/* AI */}
              <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-gradient-to-r from-purple-700 to-pink-500 p-4 text-sm text-white">

                ✅ تمام، ضفتلك 2 × بيبسي 2 لتر بالسلة.
                <br />
                لما تخلص، اكتبلي <b>تأكيد الطلب</b>.

              </div>

            </div>

          </div>


          {/* ================= RULES ================= */}
          <div className="rounded-3xl bg-[#11183f] p-8 text-white shadow-xl">

            <div className="text-3xl">
              💡
            </div>

            <h2 className="mt-4 text-2xl font-black">
              نصائح لاستخدام المساعد
            </h2>

            <div className="mt-6 space-y-4 text-sm leading-8 text-white/80">

              <div>
                <b className="text-white">
                  ✔ اكتب بطريقة طبيعية
                </b>

                <br />

                ما في داعي تحفظ أوامر معقدة.
              </div>


              <div>
                <b className="text-white">
                  ✔ إذا المنتج له أكثر من حجم
                </b>

                <br />

                المساعد سيسألك عن الحجم قبل الإضافة.
              </div>


              <div>
                <b className="text-white">
                  ✔ حدد الكمية
                </b>

                <br />

                يمكنك كتابة الكمية مع اسم المنتج أو تحديدها بعد اختيار الحجم.
              </div>


              <div>
                <b className="text-white">
                  ✔ راجع طلبك قبل التأكيد
                </b>

                <br />

                لن يتم اعتماد الطلب إلا بعد تأكيدك بشكل واضح.
              </div>


              <div>
                <b className="text-white">
                  ✔ لا يوجد تأكيد بالخطأ
                </b>

                <br />

                كلمات مثل «تمام» أو «خلص» لا تعتبر تأكيداً نهائياً للطلب.
              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ================= IMPORTANT NOTICE ================= */}
      <section className="px-5 pb-20">

        <div className="mx-auto max-w-5xl rounded-[35px] border border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50 p-8 text-center sm:p-12">

          <div className="text-4xl">
            🔐
          </div>

          <h2 className="mt-4 text-2xl font-black sm:text-3xl">
            للحصول على التجربة الكاملة
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-8 text-gray-600">
            سجّل دخولك إلى MD-Marketplace للاستفادة من الخدمات المرتبطة
            بحسابك، مثل تقديم الطلبات، استخدام بيانات التوصيل، ومتابعة
            طلباتك بطريقة شخصية ومنظمة.
          </p>

        </div>

      </section>


      {/* ================= CONTACT ================= */}
      <section className="px-5 pb-20">

        <div className="mx-auto max-w-5xl overflow-hidden rounded-[35px] bg-[#11183f] p-8 text-center text-white shadow-2xl sm:p-12">

          <div className="text-4xl">
            💬
          </div>

          <h2 className="mt-4 text-3xl font-black">
            عندك استفسار أو بحاجة لمساعدة؟
          </h2>

          <p className="mx-auto mt-3 max-w-xl leading-8 text-white/80">
            فريق MD-Marketplace موجود لمساعدتك والإجابة عن أي استفسار
            متعلق بالخدمة أو المنصة.
          </p>


          <div className="mt-8 flex flex-wrap justify-center gap-4">

            {/* ضع رقم WhatsApp هنا */}
            <a
              href="https://wa.me/ضع_رقم_الواتساب_هنا"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 font-black text-[#11183f] shadow-lg transition hover:scale-105"
            >
              💬 WhatsApp
            </a>


            {/* ضع الإيميل هنا */}
            <a
              href="mailto:ضع_الايميل_هنا"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-7 py-4 font-black text-white transition hover:bg-white/20"
            >
              ✉️ البريد الإلكتروني
            </a>

          </div>

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

        <p className="mx-auto max-w-2xl px-5 text-sm leading-7 text-gray-500">
          مساعدك الذكي مخصّص حصرياً لمعالجة طلباتك والإجابة عن
          استفساراتك بشكل مباشر، لتقديم تجربة موثوقة ومنظمة مع
          MD-Marketplace.
        </p>

        <p className="mt-2 text-xs text-gray-400">
          © {new Date().getFullYear()} MD-Marketplace
        </p>

      </footer>

    </main>
  );
}
