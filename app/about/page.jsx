'use client'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      
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

        {/* اللوغو الرسمي */}
        <div className="flex flex-col items-center mb-12">
          <div className="relative w-24 h-24 mb-4">
            <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#6A11CB] to-[#FF4E9A] flex items-center justify-center shadow-xl">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-lg bg-gradient-to-br from-[#FF4E9A] to-[#6A11CB] opacity-90"></div>
          </div>

          <h1 className="text-4xl font-bold text-[#0D0D21] mb-1">MD</h1>
          <p className="text-lg text-[#0D0D21] mb-1 tracking-wider">MARKETPLACE</p>
          <p className="text-base">
            <span className="text-[#0D0D21]">One App For </span>
            <span className="text-[#FF4E9A] font-semibold">Everything</span>
          </p>
        </div>

        {/* النص الرسمي الجديد */}
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0D0D21] mb-4">
            منصتك الرقمية الذكية
          </h2>

          <p className="text-lg text-[#0D0D21] mb-8 leading-relaxed">
            منصّة متكاملة تجمع العملاء، المتاجر، والسائقين ضمن تطبيق واحد، لتقدّم تجربة تسوّق وتوصيل حديثة، سريعة، وآمنة، مصمّمة لتلبية احتياجات السوق اللبناني. نعمل على توفير بيئة موثوقة تجمع بين سهولة الاستخدام، وضمان الجودة، ووضوح الإجراءات، بهدف تقديم خدمة رقمية عالية المستوى.
          </p>

          {/* MD Marketplace؟ */}
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8 text-right">
            <h3 className="text-2xl font-bold text-[#6A11CB] mb-6">MD Marketplace؟</h3>
            <p className="text-[#0D0D21] mb-4">
              MD Marketplace هو نظام رقمي موحّد يسهّل عملية الشراء والتوصيل بين العميل والتاجر والسائق، ويقدّم خدمات مرنة تلائم احتياجات المستخدم اليومية.
            </p>
            <ul className="space-y-4 text-[#0D0D21]">
              <li>✓ خيارات دفع مناسبة: الدفع نقداً عند الاستلام أو عبر نظام Wish لضمان الحقوق</li>
              <li>✓ خمس توصيلات مجانية لأول خمسة طلبات حتى وزن 10 كغ</li>
              <li>✓ تتبّع مباشر لحالة الطلب لحظة بلحظة عبر نظام الخرائط</li>
            </ul>
          </div>

          {/* الأمان والشفافية */}
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8 text-right">
            <h3 className="text-2xl font-bold text-[#6A11CB] mb-6">الأمان والشفافية</h3>
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
            <h3 className="text-2xl font-bold text-[#6A11CB] mb-6">خدماتنا</h3>
            <p className="text-[#0D0D21]">
              <strong>خدمة "طلب خاص"</strong> — يمكنك طلب أي غرض من أي مكان، وسيقوم السائق بشرائه وتسليمه مباشرة إلى باب منزلك، مع متابعة دقيقة لحالة الطلب حتى وصوله.
            </p>
          </div>

          {/* تواصل معنا - تم التعديل نهائي */}
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8 text-right">
            <h3 className="text-2xl font-bold text-[#6A11CB] mb-2">تواصل معنا</h3>
            <p className="text-[#0D0D21]/70 mb-6">
              نرحّب بجميع الاستفسارات والملاحظات، ونتعهّد بالرد خلال 24 ساعة عبر قنوات التواصل التالية:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* info */}
              <a href="mailto:info@md-marketplace.store" className="group bg-gradient-to-br from-purple-50 to-pink-50 border border-[#6A11CB]/10 rounded-2xl p-5 text-center hover:shadow-md hover:border-[#6A11CB]/20 transition-all">
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br from-[#6A11CB] to-[#FF4E9A] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-[#0D0D21] mb-1">الاستفسارات العامة</p>
                <p className="text-xs text-[#6A11CB] font-medium group-hover:text-[#FF4E9A] transition break-all">info@md-marketplace.store</p>
              </a>

              {/* support */}
              <a href="mailto:support@md-marketplace.store" className="group bg-gradient-to-br from-purple-50 to-pink-50 border border-[#6A11CB]/10 rounded-2xl p-5 text-center hover:shadow-md hover:border-[#6A11CB]/20 transition-all">
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br from-[#6A11CB] to-[#FF4E9A] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414L3 3m8.293 8.293l1.414 1.414"></path>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-[#0D0D21] mb-1">الدعم والشكاوي</p>
                <p className="text-xs text-[#6A11CB] font-medium group-hover:text-[#FF4E9A] transition break-all">support@md-marketplace.store</p>
              </a>

              {/* sales - مع ايقونة بريد مفتوح */}
              <a href="mailto:sales@md-marketplace.store" className="group bg-gradient-to-br from-purple-50 to-pink-50 border border-[#6A11CB]/10 rounded-2xl p-5 text-center hover:shadow-md hover:border-[#6A11CB]/20 transition-all">
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br from-[#6A11CB] to-[#FF4E9A] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-[#0D0D21] mb-1">المبيعات والتوظيف</p>
                <p className="text-xs text-[#6A11CB] font-medium group-hover:text-[#FF4E9A] transition break-all">sales@md-marketplace.store</p>
              </a>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 text-sm border-t border-gray-100 pt-4">
              <a href="https://wa.me/9613177653" target="_blank" className="flex items-center gap-2 text-[#0D0D21] hover:text-[#25D366] transition font-medium">
                <span className="w-6 h-6 rounded-full bg-[#25D366] flex items-center justify-center text-white">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.05 4.94A9.91 9.91 0 0012.04 2C6.58 2 2.15 6.43 2.15 10.9c0 1.57.41 3.1 1.19 4.46L2 22l6.82-1.78a9.93 9.93 0 004.22 1.08h.01c5.46 0 9.9-4.43 9.9-9.89a9.86 9.86 0 00-2.9-7.47zm-7.01 12.6a8.17 8.17 0 01-4.17-1.14l-.3-.18-4.05 1.06 1.08-3.95-.2-.4a8.18 8.18 0 01-1.26-4.44c0-4.54 3.7-8.23 8.24-8.23a8.2 8.2 0 015.82 2.4 8.18 8.18 0 012.4 5.82c0 4.53-3.7 8.23-8.23 8.23zm4.52-6.16c-.25-.12-1.47-.73-1.7-.81-.23-.09-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.22-1.45-1.36-1.7-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.16-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.55.12.17 1.73 2.65 4.2 3.71.59.25 1.05.4 1.41.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.14-1.18-.06-.11-.23-.17-.48-.29z"/></svg>
                </span>
                واتساب: 03 177 653
              </a>
              <span className="hidden sm:block text-[#6A11CB]/30">|</span>
              <a href="tel:+9613177653" className="flex items-center gap-2 text-[#0D0D21] hover:text-[#6A11CB] transition font-medium">
                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#6A11CB] to-[#FF4E9A] flex items-center justify-center text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                </span>
                اتصال: 03 177 653
              </a>
            </div>
          </div>

          {/* الاحصائيات */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-12 mb-12">
            <div className="text-center">
              <p className="text-3xl font-bold text-[#6A11CB]">+500</p>
              <p className="text-sm text-[#0D0D21]">متجر متعاقد</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[#6A11CB]">+25K</p>
              <p className="text-sm text-[#0D0D21]">عميل مسجل</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[#6A11CB]">+150</p>
              <p className="text-sm text-[#0D0D21]">سائق نشط</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[#6A11CB]">+100K</p>
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
              <Link href="/privacy" className="text-[#6A11CB] hover:text-[#FF4E9A] transition font-medium">سياسة الخصوصية</Link>
              <span className="text-[#6A11CB]/30">|</span>
              <Link href="/terms" className="text-[#6A11CB] hover:text-[#FF4E9A] transition font-medium">الشروط والاحكام</Link>
            </div>
            <p className="text-xs text-[#0D0D21]/60 mt-4">© 2020 MD-Marketplace. جميع الحقوق محفوظة</p>
          </div>

        </div>
      </div>
    </div>
  )
}
