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
        {/* اللوغو الرسمي MD Marketplace */}
        <div className="flex flex-col items-center mb-12">
          <div className="relative w-24 h-24 mb-4">
            {/* المربع الاساسي */}
            <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#6A11CB] to-[#FF4E9A] flex items-center justify-center shadow-xl">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            {/* المربع الصغير فوق */}
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-lg bg-gradient-to-br from-[#FF4E9A] to-[#6A11CB] opacity-90"></div>
          </div>
          
          {/* النص تحت اللوغو - نفس شاشة الدخول */}
          <h1 className="text-4xl font-bold text-[#0D0D21] mb-1">MD</h1>
          <p className="text-lg text-[#0D0D21] mb-1 tracking-wider">MARKETPLACE</p>
          <p className="text-base">
            <span className="text-[#0D0D21]">One App For </span>
            <span className="text-[#FF4E9A] font-semibold">Everything</span>
          </p>
        </div>

        {/* باقي محتوى الصفحة */}
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0D0D21] mb-4">
            منصتك الرقمية الذكية
          </h2>
          <p className="text-lg text-[#0D0D21] mb-8 leading-relaxed">
            التي تجمع العملاء، المتاجر، والسائقين في تطبيق واحد. لنقدم لك تجربة تسوق وتوصيل عصرية، سريعة، وآمنة، صُممت خصيصاً للسوق اللبناني.
          </p>

          {/* MD Marketplace؟ */}
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8 text-right">
            <h3 className="text-2xl font-bold text-[#6A11CB] mb-6">MD Marketplace؟</h3>
            <ul className="space-y-4 text-[#0D0D21]">
              <li>✓ اختر طريقة الدفع التي تناسبك: نقداً عند الاستلام أو عبر نظام Wish</li>
              <li>✓ 5 توصيلات مجانية لأول 5 طلبات للعملاء الجدد، للطلبات حتى 10 كغ</li>
              <li>✓ تتبع طلبك لحظة بلحظة</li>
            </ul>
          </div>

          {/* الأمان والشفافية */}
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8 text-right">
            <h3 className="text-2xl font-bold text-[#6A11CB] mb-6">الأمان والشفافية</h3>
            <ul className="space-y-4 text-[#0D0D21]">
              <li>✓ نخفي بياناتك عن السائق حتى قبول الطلب، لضمان خصوصيتك التامة</li>
              <li>✓ جميع سائقينا موثقون بأوراق رسمية وصور هوية لضمان الأمان والثقة</li>
            </ul>
          </div>

          {/* خدماتنا */}
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8 text-right">
            <h3 className="text-2xl font-bold text-[#6A11CB] mb-6">خدماتنا</h3>
            <p className="text-[#0D0D21]">
              <strong>خدمة "اشترِ لي"</strong> - اطلب أي غرض من أي مكان، وسائقنا يشتريه ويوصله لبابك
            </p>
          </div>

          {/* تواصل معنا */}
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8 text-right">
            <h3 className="text-2xl font-bold text-[#6A11CB] mb-6">تواصل معنا</h3>
            <p className="text-[#0D0D21] mb-4">
              نسعد بتلقي شكواك واقتراحاتك عبر الواتساب أو البريد الإلكتروني، ونلتزم بالرد خلال 24 ساعة
            </p>
            <p className="text-[#0D0D21]">واتساب: [رقم واتساب]</p>
            <p className="text-[#0D0D21]">اتصال: [رقم اتصال]</p>
            <p className="text-[#0D0D21]">ايميل: [البريد الإلكتروني]</p>
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

          {/* الفوتر - الشغلتين الجداد */}
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
            </div>
            <p className="text-xs text-[#0D0D21]/60 mt-4">
              © 2026 MD Marketplace. جميع الحقوق محفوظة
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
