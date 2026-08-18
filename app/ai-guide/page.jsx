import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "دليل استخدام MD-Marketplace AI | مساعدك الذكي",
  description: "تعلم كيف تستخدم مساعد MD-Marketplace الذكي لطلب المنتجات من متاجر طرابلس والشمال ومتابعة طلباتك بسهولة عبر الواتساب",
  alternates: {
    canonical: "https://www.md-marketplace.store/ai-guide"
  },
  openGraph: {
    title: "دليل استخدام MD-Marketplace AI",
    description: "مساعدك الذكي لطلب المنتجات ومتابعة الطلبات",
    url: "https://www.md-marketplace.store/ai-guide",
    type: "website",
    images: [{
      url: "https://www.md-marketplace.store/ai-guide.webp",
      width: 1200,
      height: 630,
      alt: "MD-Marketplace AI"
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "دليل استخدام MD-Marketplace AI",
    description: "مساعدك الذكي لطلب المنتجات ومتابعة الطلبات",
    images: ["https://www.md-marketplace.store/ai-guide.webp"]
  }
};

export default function AIGuidePage() {
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

  return (
    <main dir="rtl" className="min-h-screen bg-white text-[#11183f]">
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center"><Image src="/logo.png" alt="MD-Marketplace" width={190} height={70} className="h-auto w- sm:w-" priority /></Link>
          <div className="flex items-center gap-3"><Link href="/" className="rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold transition hover:border-purple-400 hover:text-purple-700">الرئيسية</Link></div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute -right-32 top-20 h-72 w-72 rounded-full bg-purple-100/60 blur-3xl" />
        <div className="absolute -left-32 top-40 h-72 w-72 rounded-full bg-pink-100/60 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:py-24">
          <div className="order-2 flex justify-center lg:order-1">
            <div className="relative w-full max-w-">
              <div className="relative overflow-hidden rounded- bg-white shadow-[0_20px_70px_rgba(110,40,220,0.15)]"><Image src="/ai-guide.webp" alt="MD-Marketplace AI" width={800} height={450} priority className="h-auto w-full object-cover" /></div>
              <div className="absolute -right-3 -top-7 hidden max-w- rounded-3xl bg-white p-4 text-center text-sm font-bold shadow-xl sm:block">👋 مرحباً!<br/>أنا مساعدك الذكي<br/>لمساعدتك في طلباتك واستفساراتك<div className="absolute bottom-[-8px] right-10 h-4 w-4 rotate-45 bg-white" /></div>
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

      <section className="mx-auto max-w-5xl px-5 pb-16">
        <div className="rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50/70 to-pink-50/50 p-7 shadow-sm sm:p-10">
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-right">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow">🛍</div>
            <div><h2 className="text-xl font-black">مساعدك الذكي من MD-Marketplace</h2><p className="mt-2 leading-8 text-gray-600">مساعدك الذكي مخصّص حصرياً لمعالجة طلباتك والإجابة عن استفساراتك بشكل مباشر. اكتب طلبك أو سؤالك بوضوح لتحصل على تجربة ذكية وسلسة مع متاجر طرابلس والشمال.</p><p className="mt-3 leading-8 text-gray-600">تم تصميم الخدمة لتسهيل الوصول إلى حالة طلباتك، تقديم طلب مباشر، أو الاستفسار عن أي منتج بطريقة بسيطة وطبيعية.</p></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20">
        <div className="mb-10 text-center"><span className="text-2xl">🔐</span><h2 className="mt-2 text-3xl font-black sm:text-4xl">الخدمة للمسجّل وغير المسجّل</h2><p className="mx-auto mt-3 max-w-2xl text-gray-500 leading-7">يمكنك التعرّف على MD-Marketplace AI والاستفسار عن الخدمة، أما الميزات الكاملة فتكون مرتبطة بحسابك.</p></div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition hover:shadow-lg"><div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-3xl">👤</div><div><h3 className="text-xl font-black">للمستخدم غير المسجّل</h3><p className="mt-1 text-sm text-gray-500">تعرّف على الخدمة واطرح استفساراتك</p></div></div><div className="mt-6 space-y-3 text-sm leading-7 text-gray-600"><p>✔ يمكنك التعرّف على MD-Marketplace AI وطريقة استخدامه.</p><p>✔ يمكنك الاستفسار والتعرّف على المنتجات والخدمات المتوفرة.</p><p>✔ للاستفادة من خدمات الطلب والمتابعة والميزات المرتبطة بحسابك، يجب إنشاء حساب أو تسجيل الدخول.</p></div><div className="mt-6 rounded-2xl bg-gray-50 p-5"><p className="font-bold text-[#11183f]">🔐 سجّل دخولك لتحصل على التجربة الكاملة والاستجابة الشخصية لطلباتك.</p></div></div>
          <div className="rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50/70 to-pink-50/50 p-8 shadow-sm transition hover:shadow-lg"><div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">⭐</div><div><h3 className="text-xl font-black">للمستخدم المسجّل</h3><p className="mt-1 text-sm text-gray-500">التجربة الكاملة لخدمات MD-Marketplace AI</p></div></div><div className="mt-6 space-y-3 text-sm leading-7 text-gray-600"><p>✔ البحث عن المنتجات المتوفرة فعلياً.</p><p>✔ إضافة المنتجات إلى السلة وتعديلها.</p><p>✔ تجهيز الطلب وتأكيده.</p><p>✔ استخدام معلومات التوصيل المرتبطة بالحساب لتسهيل الطلب.</p><p>✔ متابعة حالة الطلب والاستفسار عنه.</p><p>✔ الاستفادة من المزايا المرتبطة بحسابك في MD-Marketplace.</p></div></div>
        </div>
      </section>

      <section id="how" className="bg-gray-50/70 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-10 text-center"><span className="text-2xl">✨</span><h2 className="mt-2 text-3xl font-black sm:text-4xl">كيف تستخدم MD-Marketplace AI؟</h2><p className="mt-3 text-gray-500">كل شيء بطريقة بسيطة وطبيعية.</p></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <details key={index} className="group rounded-3xl border border-gray-100 bg-white p-6 text-right shadow-sm transition hover:-translate-y-1 hover:border-purple-200 hover:shadow-xl open:border-purple-200 open:shadow-xl">
                <summary className="flex list-none cursor-pointer items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 text-3xl">{step.icon}</div>
                  <h3 className="flex-1 text-base font-black leading-6">{step.title}</h3>
                  <span className="text-sm font-bold text-purple-500">{index + 1}</span>
                </summary>
                <p className="mt-4 mr- text-sm leading-7 text-gray-500">{step.text}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-gray-100 bg-white p-7 shadow-lg">
            <div className="mb-6 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-2xl">💬</div><div><h2 className="font-black">مثال على المحادثة</h2><p className="text-sm text-gray-500">عندما يكون للمنتج أكثر من حجم</p></div></div>
            <div className="space-y-4">
              <div className="mr-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-gray-100 p-4 text-sm">بدي بيبسي</div>
              <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-gradient-to-r from-purple-700 to-pink-500 p-4 text-sm text-white">أكيد 😊 لقيتلك بيبسي بأكثر من حجم.<br/>أي حجم بدك؟<div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-white/15 px-4 py-2 font-bold">250 مل</span><span className="rounded-full bg-white/15 px-4 py-2 font-bold">1.5 لتر</span><span className="rounded-full bg-white/15 px-4 py-2 font-bold">2 لتر</span></div></div>
              <div className="mr-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-gray-100 p-4 text-sm">بدي 2 لتر، عدد 2</div>
              <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-gradient-to-r from-purple-700 to-pink-500 p-4 text-sm text-white">✅ تمام، ضفتلك 2 × بيبسي 2 لتر بالسلة.<br/>لما تخلص، اكتبلي <b>تأكيد الطلب</b>.</div>
            </div>
          </div>
          <div className="rounded-3xl bg-[#11183f] p-8 text-white shadow-xl">
            <div className="text-3xl">💡</div><h2 className="mt-4 text-2xl font-black">نصائح لاستخدام المساعد</h2>
            <div className="mt-6 space-y-4 text-sm leading-8 text-white/80">
              <div><b className="text-white">✔ اكتب بطريقة طبيعية</b><br/>ما في داعي تحفظ أوامر معقدة.</div>
              <div><b className="text-white">✔ إذا المنتج له أكثر من حجم</b><br/>المساعد سيسألك عن الحجم قبل الإضافة.</div>
              <div><b className="text-white">✔ حدد الكمية</b><br/>يمكنك كتابة الكمية مع اسم المنتج أو تحديدها بعد اختيار الحجم.</div>
              <div><b className="text-white">✔ راجع طلبك قبل التأكيد</b><br/>لن يتم اعتماد الطلب إلا بعد تأكيدك بشكل واضح.</div>
              <div><b className="text-white">✔ لا يوجد تأكيد بالخطأ</b><br/>كلمات مثل «تمام» أو «خلص» لا تعتبر تأكيداً نهائياً للطلب.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== فقط البوكسين الجديدين متل الصورة ===== */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="mb-8 text-center">
          <div className="mx-auto inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-5 py-2 text-xs font-black tracking-widest text-amber-800">ميزات جديدة • NEW FEATURES</div>
          <h2 className="mt-5 text-3xl font-black sm:text-4xl">ميزات ذكية جديدة</h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* بوكس السلة المؤقتة - على اليمين متل الصورة */}
          <div className="relative overflow-hidden rounded-[32px] border border-amber-200/60 bg-gradient-to-b from-amber-50 to-white p-7 shadow-[0_20px_60px_rgba(251,191,36,0.12)] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-[18px] font-black leading-6 text-[#11183f]">السلة المؤقتة على واتساب</h3>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-200 px-3 py-1 text-[11px] font-black text-amber-900">30 دقيقة <span className="h-1.5 w-1.5 rounded-full bg-amber-700"></span> <span className="text-[10px]">⏰</span></span>
                </div>
                <p className="mt-4 text-[13.5px] leading-7 text-gray-700">
                  سلتك محفوظة لمدة <b className="text-[#11183f]">30 دقيقة</b> من آخر تفاعل. في حال عدم النشاط يتم حذف السلة تلقائياً مع إرسال إشعار لك.
                </p>
              </div>
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M3 5H21L19 18H5L3 5Z" stroke="white" strokeWidth="2" strokeLinejoin="round"/><path d="M8 5V3M16 5V3" stroke="white" strokeWidth="2" strokeLinecap="round"/><path d="M9 11L9.5 11.5L11 10" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-amber-200/60 bg-amber-50 p-5">
              <div className="flex items-center gap-2 font-black text-[13px] text-amber-950"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-[11px] text-white">!</span> ماذا يحدث بعد الحذف؟</div>
              <p className="mt-3 text-[13px] leading-7 text-amber-900/80">
                يصلك تنبيه <b className="text-amber-950">“تم حذف السلة”</b> وتستطيع بدء طلب جديد في أي وقت بكتابة <span className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-black text-amber-950">“بدي اطلب”</span>.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[11px] text-amber-800/60"><span className="h-px w-8 bg-amber-300"></span> يتم احتساب الوقت من آخر رسالة</div>
          </div>

          {/* بوكس استكشاف المنتجات العالمية - على الشمال متل الصورة */}
          <div className="relative overflow-hidden rounded-[32px] bg-[#12193d] p-7 text-white shadow-[0_20px_60px_rgba(17,24,63,0.25)] sm:p-8">
            <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: `radial-gradient(white 1px, transparent 1px)`, backgroundSize: '18px 18px'}} />
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[18px] font-black">استكشاف المنتجات العالمية</h3>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black tracking-widest text-cyan-200 border border-white/10">ENTERTAINMENT <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.8)]"></span></span>
                  </div>
                  <p className="mt-4 text-[13px] leading-7 text-white/70">
                    اكتب <b className="text-white">رقم الباركود</b> الموجود على أي منتج عالمي، واحصل على تفاصيله: الاسم، العلامة التجارية وبلد المنشأ، مع إمكانية الاستفسار عن السعرات الحرارية لكل 100غ.
                  </p>
                </div>
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-[#12193d] shadow-lg">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="9" cy="14" r="6" stroke="#12193d" strokeWidth="1.5"/><path d="M6.5 14C6.5 14 8 11.2 10 11.2C12 11.2 13.5 14 13.5 14C13.5 14 12 16.8 10 16.8C8 16.8 6.5 14 6.5 14Z" stroke="#12193d" strokeWidth="1.2"/><path d="M4 14H15.5" stroke="#12193d" strokeWidth="1" opacity="0.5"/><g><rect x="18" y="7" width="1.4" height="14" rx="0.5" fill="#12193d"/><rect x="20.6" y="7" width="1" height="14" rx="0.5" fill="#12193d" opacity="0.8"/><rect x="23" y="7" width="2.2" height="14" rx="0.5" fill="#12193d"/><rect x="26.2" y="7" width="1" height="14" rx="0.5" fill="#12193d" opacity="0.6"/></g></svg>
                </div>
              </div>

              <div className="mt-7 grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-center backdrop-blur"><div className="text-[18px]">🏷️</div><div className="mt-2 text-[11px] font-bold text-white/80">الماركة</div></div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-center backdrop-blur"><div className="text-[18px]">🌍</div><div className="mt-2 text-[11px] font-bold text-white/80">المنشأ</div></div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-center backdrop-blur"><div className="text-[18px]">🔥</div><div className="mt-2 text-[11px] font-bold text-white/80">السعرات</div></div>
              </div>

              <div className="mt-6 rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.08] p-4">
                <p className="text-[12px] leading-6 text-cyan-100/80">
                  <span className="text-amber-200">💡 تنويه:</span> هذه الميزة مخصصة للاستفسار والاطلاع فقط ولا ترتبط بعملية الطلب من متاجرنا. جميع المعلومات <span className="font-black text-white underline decoration-white/30 underline-offset-4">مأخوذة</span> من قاعدة بيانات MD-Marketplace.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>
      {/* ===== نهاية البوكسين فقط ===== */}

      <section className="px-5 pb-20">
        <div className="mx-auto max-w-5xl rounded- border border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50 p-8 text-center sm:p-12">
          <div className="text-4xl">🔐</div><h2 className="mt-4 text-2xl font-black sm:text-3xl">للحصول على التجربة الكاملة</h2><p className="mx-auto mt-4 max-w-2xl leading-8 text-gray-600">سجّل دخولك إلى MD-Marketplace للاستفادة من الخدمات المرتبطة بحسابك، مثل تقديم الطلبات، استخدام بيانات التوصيل، ومتابعة طلباتك بطريقة شخصية ومنظمة.</p>
        </div>
      </section>

      <section className="px-5 pb-20">
        <div className="mx-auto max-w-5xl overflow-hidden rounded- bg-[#11183f] p-8 text-center text-white shadow-2xl sm:p-12">
          <div className="text-4xl">💬</div><h2 className="mt-4 text-3xl font-black">عندك استفسار أو بحاجة لمساعدة؟</h2><p className="mx-auto mt-3 max-w-xl leading-8 text-white/80">فريق MD-Marketplace موجود لمساعدتك والإجابة عن أي استفسار متعلق بالخدمة أو المنصة.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a href="https://wa.me/9613177653" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 font-black text-[#11183f] shadow-lg transition hover:scale-105">💬 WhatsApp</a>
            <a href="mailto:info@md-marketplace.store" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-7 py-4 font-black text-white transition hover:bg-white/20">✉ البريد الإلكتروني</a>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 bg-white py-8 text-center">
        <Image src="/logo.png" alt="MD-Marketplace" width={150} height={60} className="mx-auto mb-3 w-" />
        <p className="mx-auto max-w-2xl px-5 text-sm leading-7 text-gray-500">مساعدك الذكي مخصّص حصرياً لمعالجة طلباتك والإجابة عن استفساراتك بشكل مباشر، لتقديم تجربة موثوقة ومنظمة مع MD-Marketplace.</p>
        <p className="mt-2 text-xs text-gray-400">© {new Date().getFullYear()} MD-Marketplace</p>
      </footer>
    </main>
  );
}
