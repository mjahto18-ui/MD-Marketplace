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

          {/* تواصل معنا - تم التعديل 3 ايميلات جنب بعض */}
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8 text-right">
            <h3 className="text-2xl font-bold text-[#6A11CB] mb-2">تواصل معنا</h3>
            <p className="text-[#0D0D21]/70 mb-6">
              نرحّب بجميع الاستفسارات والملاحظات، ونتعهّد بالرد خلال 24 ساعة عبر قنوات التواصل التالية:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <a href="mailto:info@md-marketplace.store" className="group bg-gradient-to-br from-purple-50 to-pink-50 border border-[#6A11CB]/10 rounded-2xl p-5 text-center hover:shadow-md hover:border-[#6A11CB]/20 transition-all">
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br from-[#6A11CB] to-[#FF4E9A] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <p className="text-sm font-semibold text-[#0D0D21] mb-1">الاستفسارات العامة</p>
                <p className="text-xs text-[#6A11CB] font-medium group-hover:text-[#FF4E9A] transition break-all">info@md-marketplace.store</p>
              </a>

              <a href="mailto:support@md-marketplace.store" className="group bg-gradient-to-br from-purple-50 to-pink-50 border border-[#6A11CB]/10 rounded-2xl p-5 text-center hover:shadow-md hover:border-[#6A11CB]/20 transition-all">
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br from-[#6A11CB] to-[#FF4E9A] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                </div>
                <p className="text-sm font-semibold text-[#0D0D21] mb-1">الدعم والشكاوي</p>
                <p className="text-xs text-[#6A11CB] font-medium group-hover:text-[#FF4E9A] transition break-all">support@md-marketplace.store</p>
              </a>

              <a href="mailto:sales@md-marketplace.store" className="group bg-gradient-to-br from-purple-50 to-pink-50 border border-[#6A11CB]/10 rounded-2xl p-5 text-center hover:shadow-md hover:border-[#6A11CB]/20 transition-all">
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br from-[#6A11CB] to-[#FF4E9A] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                </div>
                <p className="text-sm font-semibold text-[#0D0D21] mb-1">المبيعات والتوظيف</p>
                <p className="text-xs text-[#6A11CB] font-medium group-hover:text-[#FF4E9A] transition break-all">sales@md-marketplace.store</p>
              </a>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 text-sm text-[#0D0D21]/80 border-t border-gray-100 pt-4">
              <p>واتساب: [9613000000]</p>
              <span className="hidden sm:block text-[#6A11CB]/30">|</span>
              <p>اتصال: [03000000]</p>
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
