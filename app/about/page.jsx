'use client'
import Link from 'next/link'
import Image from 'next/image'

export default function AboutPage() {
return (

  <div className="min-h-screen bg-gray-50">

    {/* زر العودة لتسجيل الدخول */}
    <div className="absolute top-4 left-4 z-50">
      <Link
        href="/login"
        className="bg-gradient-to-l from-[#6A11CB] to-[#FF4E9A] text-white px-6 py-2 rounded-full font-semibold shadow-lg hover:opacity-90 transition"
      >
        العودة لتسجيل الدخول →
      </Link>
    </div>

    <div className="container mx-auto px-4 py-16">

      {/* اللوغو الرسمي الجديد - نفس الهوم */}
      <div className="flex flex-col items-center mb-12">
        <div className="bg-white p-4 rounded- shadow-xl mb-5">
          <Image
            src="/icon.png"
            alt="MD-Marketplace"
            width={125}
            height={125}
          />
        </div>
      </div>

      {/* النص الرسمي الجديد */}
      <div className="max-w-4xl mx-auto text-center">

        <h2 className="text-3xl md:text-4xl font-bold text-[#0D0D21] mb-4">
          منصتك الرقمية الذكية
        </h2>

        <p className="text-lg text-[#0D0D21] mb-8 leading-relaxed">
          منصّة متكاملة تجمع العملاء، المتاجر، والسائقين ضمن تطبيق واحد، لتقدّم تجربة تسوّق وتوصيل حديثة، سريعة، وآمنة، مصمّمة لتلبية احتياجات السوق اللبناني. نعمل على توفير بيئة موثوقة تجمع بين سهولة الاستخدام، وضمان الجودة، ووضوح الإجراءات، بهدف تقديم خدمة رقمية عالية المستوى.
        </p>

        {/* MD-Marketplace */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-8 text-right">

          <h3 className="text-2xl font-bold text-[#6A11CB] mb-6">
            MD-Marketplace
          </h3>

          <p className="text-[#0D0D21] mb-4">
            MD-Marketplace هو نظام رقمي موحّد يسهّل عملية الشراء والتوصيل بين العميل والتاجر والسائق، ويقدّم خدمات مرنة تلائم احتياجات المستخدم اليومية.
          </p>

          <ul className="space-y-4 text-[#0D0D21]">
            <li>✓ خيارات دفع مناسبة: الدفع نقداً عند الاستلام أو عبر نظام Wish لضمان الحق</li>
            <li>✓ خمس توصيلات مجانية لأول خمسة طلبات حتى وزن 10 نقاط</li>
            <li>✓ تتبّع مباشر لحالة الطلب لحظة بلحظة عبر نظام الخرائط</li>
          </ul>

        </div>

        {/* الأمان والشفافية */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-8 text-right">

          <h3 className="text-2xl font-bold text-[#6A11CB] mb-6">
            الأمان والشفافية
          </h3>

          <p className="text-[#0D0D21] mb-4">
            نلتزم بتطبيق أعلى معايير الخصوصية وحماية البيانات لضمان تجربة آمنة وواضحة لجميع المستخدمين.
          </p>

          <ul className="space-y-4 text-[#0D0D21]">
            <li>✓ إخفاء معلوماتك الشخصية عن السائق قبل قبول الطلب</li>
            <li>✓ جميع السائقين معتمدون بمستندات رسمية لضمان الثقة والموثوقية</li>
          </ul>

        </div>

        {/* خدماتنا */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-8 text-right">

          <h3 className="text-2xl font-bold text-[#6A11CB] mb-6">
            خدماتنا
          </h3>

          <p className="text-[#0D0D21]">
            <strong>خدمة "طلب خاص"</strong> — يمكنك طلب أي منتج من أي مكان، وسيقوم عامل التوصيل بشرائه وتسليمه مباشرة إلى باب منزلك، مع متابعة دقيقة لحالة الطلب حتى وصوله.
          </p>

        </div>

        {/* تواصل معنا */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-8 text-right">

          <h3 className="text-2xl font-bold text-[#6A11CB] mb-2">
            تواصل معنا
          </h3>

          <p className="text-[#0D0D21]/70 mb-6">
            نرحّب بجميع الاستفسارات والملاحظات، ونتعهّد بالرد خلال 24 ساعة عبر قنوات التواصل التالية:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

            <a
              href="mailto:info@md-marketplace.store"
              className="group bg-gradient-to-br from-purple-50 to-pink-50 border border-[#6A11CB]/10 rounded-2xl p-5 text-center hover:shadow-md hover:border-[#6A11CB]/20 transition-all"
            >
              <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br from-[#6A11CB] to-[#FF4E9A] flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
              </div>

              <p className="text-sm font-semibold text-[#0D0D21] mb-1">
                الاستفسارات العامة
              </p>

              <p className="text-xs text-[#6A11CB] font-medium group-hover:text-[#FF4E9A] transition break-all">
                info@md-marketplace.store
              </p>
            </a>

            <a
              href="mailto:support@md-marketplace.store"
              className="group bg-gradient-to-br from-purple-50 to-pink-50 border border-[#6A11CB]/10 rounded-2xl p-5 text-center hover:shadow-md hover:border-[#6A11CB]/20 transition-all"
            >
              <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br from-[#6A11CB] to-[#FF4E9A] flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414L3 3m8.293 8.293l1.414 1.414"></path>
                </svg>
              </div>

              <p className="text-sm font-semibold text-[#0D0D21] mb-1">
                الدعم والشكاوي
              </p>

              <p className="text-xs text-[#6A11CB] font-medium group-hover:text-[#FF4E9A] transition break-all">
                support@md-marketplace.store
              </p>
            </a>

            <a
              href="mailto:sales@md-marketplace.store"
              className="group bg-gradient-to-br from-purple-50 to-pink-50 border border-[#6A11CB]/10 rounded-2xl p-5 text-center hover:shadow-md hover:border-[#6A11CB]/20 transition-all"
            >
              <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br from-[#6A11CB] to-[#FF4E9A] flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                </svg>
              </div>

              <p className="text-sm font-semibold text-[#0D0D21] mb-1">
                المبيعات والتوظيف
              </p>

              <p className="text-xs text-[#6A11CB] font-medium group-hover:text-[#FF4E9A] transition break-all">
                sales@md-marketplace.store
              </p>
            </a>

          </div>

          {/* الواتساب والاتصال */}
          <div className="flex flex-col sm:flex-row gap-4 text-sm border-t border-gray-100 pt-4 mb-6">

            <a
              href="https://wa.me/9613177653"
              target="_blank"
              className="flex items-center gap-2 text-[#0D0D21] hover:text-[#25D366] transition font-medium"
            >
              <span className="w-6 h-6 rounded-full bg-[#25D366] flex items-center justify-center text-white">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.05 4.94A9.91 9.91 0 0012.04 2C6.58 2 2.15 6.43 2.15 10.9c0 1.57.41 3.1 1.19 4.46L2 22l6.82-1.78a9.93 9.93 0 004.22 1.08h.01c5.46 0 9.9-4.43 9.9-9.89a9.86 9.86 0 00-2.9-7.47zm-7.01 12.6a8.17 8.17 0 01-4.17-1.14l-.3-.18-4.05 1.06 1.08-3.95-.2-.4a8.18 8.18 0 01-1.26-4.44c0-4.54 3.7-8.23 8.24-8.23a8.2 8.2 0 015.82 2.4 8.18 8.18 0 012.4 5.82c0 4.53-3.7 8.23-8.23 8.23zm4.52-6.16c-.25-.12-1.47-.73-1.7-.81-.23-.09-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.22-1.45-1.36-1.7-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.16-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.55.12.17 1.73 2.65 4.2 3.71.59.25 1.05.4 1.41.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.14-1.18-.06-.11-.23-.17-.48-.29z"/>
                </svg>
              </span>
              واتساب: فريق الدعم
            </a>

            <span className="hidden sm:block text-[#6A11CB]/30">|</span>

            <a
              href="tel:+9613177653"
              className="flex items-center gap-2 text-[#0D0D21] hover:text-[#6A11CB] transition font-medium"
            >
              <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#6A11CB] to-[#FF4E9A] flex items-center justify-center text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                </svg>
              </span>
              اتصال: فريق الدعم
            </a>

          </div>

          {/* ===== قسم السوشيال الجديد ===== */}
          <div className="border-t border-gray-100 pt-6">

            <h4 className="text-lg font-bold text-[#0D0D21] mb-4">
              تابعنا على
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Facebook - شغال */}
              <a
                href="https://facebook.com/mdmarketplaceofficial"
                target="_blank"
                className="group bg-gradient-to-br from-blue-50 to-indigo-50 border border-[#1877F2]/10 rounded-2xl p-5 text-center hover:shadow-md hover:border-[#1877F2]/30 transition-all"
              >
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-[#1877F2] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>

                <p className="text-sm font-semibold text-[#0D0D21] mb-1">
                  Facebook
                </p>

                <p className="text-xs text-[#1877F2] font-medium group-hover:text-[#0a59c1] transition">
                  mdmarketplaceofficial
                </p>
              </a>

              {/* TikTok */}
              <a
                href="https://tiktok.com/@mdmarketplace.store"
                target="_blank"
                className="group bg-gradient-to-br from-gray-50 to-slate-50 border border-black/10 rounded-2xl p-5 text-center hover:shadow-md hover:border-black/20 transition-all opacity-80"
              >
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-black flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </div>

                <p className="text-sm font-semibold text-[#0D0D21] mb-1">
                  TikTok
                </p>

                <p className="text-xs text-black font-medium">
                  mdmarketplace.store
                </p>
              </a>

              {/* YouTube - جديد */}
              <a
                href="https://youtube.com/@md-marketplace"
                target="_blank"
                className="group bg-gradient-to-br from-red-50 to-pink-50 border border-[#FF0000]/10 rounded-2xl p-5 text-center hover:shadow-md hover:border-[#FF0000]/30 transition-all"
              >
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-[#FF0000] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505.505 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>

                <p className="text-sm font-semibold text-[#0D0D21] mb-1">
                  YouTube
                </p>

                <p className="text-xs text-[#FF0000] font-medium group-hover:text-red-700 transition">
                  @md-marketplace
                </p>
              </a>

              {/* X - جديد */}
              <a
                href="https://x.com/md_marketplace"
                target="_blank"
                className="group bg-gradient-to-br from-gray-50 to-slate-50 border border-black/10 rounded-2xl p-5 text-center hover:shadow-md hover:border-black/30 transition-all"
              >
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-black flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817-5.967 6.817H1.681l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
                  </svg>
                </div>

                <p className="text-sm font-semibold text-[#0D0D21] mb-1">
                  X
                </p>

                <p className="text-xs text-black font-medium group-hover:text-gray-600 transition">
                  @md_marketplace
                </p>
              </a>

            </div>
          </div>

        </div>

      </div>

      {/* الاحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-12 mb-12">

        <div className="text-center">
          <p className="text-3xl font-bold text-[#6A11CB]">+30</p>
          <p className="text-sm text-[#0D0D21]">متجر متعاقد</p>
        </div>

        <div className="text-center">
          <p className="text-3xl font-bold text-[#6A11CB]">+1350</p>
          <p className="text-sm text-[#0D0D21]">عميل مسجل</p>
        </div>

        <div className="text-center">
          <p className="text-3xl font-bold text-[#6A11CB]">+25</p>
          <p className="text-sm text-[#0D0D21]">سائق نشط</p>
        </div>

        <div className="text-center">
          <p className="text-3xl font-bold text-[#6A11CB]">+1200</p>
          <p className="text-sm text-[#0D0D21]">طلب مكتمل</p>
        </div>

        <div className="text-center">
          <p className="text-3xl font-bold text-[#6A11CB]">4.8</p>
          <p className="text-sm text-[#0D0D21]">متوسط التقييم</p>
        </div>

      </div>

      {/* الفوتر */}
      <div className="border-t border-[#6A11CB]/20 pt-8 pb-4">

        <div className="flex items-center justify-center gap-6 text-sm">

          <Link
            href="/privacy"
            className="text-[#6A11CB] hover:text-[#FF4E9A] transition font-medium"
          >
            سياسة الخصوصية
          </Link>

          <span className="text-[#6A11CB]/30">|</span>

          <Link
            href="/terms"
            className="text-[#6A11CB] hover:text-[#FF4E9A] transition font-medium"
          >
            الشروط والاحكام
          </Link>
          <span className="text-[#6A11CB]/30">|</span>
          <Link href="/our-story" className="text-[#6A11CB] hover:text-[#FF4E9A] transition font-medium">قصة تأسيس MD-Marketplace</Link>

        </div>

        <p className="text-xs text-[#0D0D21]/60 mt-4 text-center">
          ©️ 2020-2026 MD Marketplace . جميع الحقوق محفوظة
        </p>

      </div>

    </div>

  </div>

)
}
