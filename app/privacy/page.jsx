import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export const metadata = {
  title: 'سياسة الخصوصية - MD Marketplace',
  description: 'كيف نحمي بياناتك في MD Marketplace'
}

export default function PrivacyPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-[#0D0D21] text-white">
      {/* زر الرجوع الصغير - هون ضفته */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <Link 
          href="/about"
          className="inline-flex items-center gap-1 text-purple-400/80 hover:text-white text-xs transition"
        >
          <ChevronRight className="w-3 h-3 rotate-180" />
          رجوع
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-[#6A11CB] to-[#FF4E9A] bg-clip-text text-transparent">
          سياسة الخصوصية
        </h1>
        
        <div className="space-y-8 text-white/80 leading-relaxed">
          <p className="text-sm text-purple-300">آخر تحديث: 7 تموز 2026</p>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. البيانات اللي منجمعها</h2>
            <p>منجمع البيانات التالية لنقدملك أفضل خدمة:</p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li><strong>معلومات الحساب:</strong> الاسم، رقم الهاتف، المنطقة، العنوان</li>
              <li><strong>الموقع الجغرافي:</strong> وقت التسجيل فقط لتأكيد عنوانك وتحديد أقرب المتاجر</li>
              <li><strong>معلومات الجهاز:</strong> نوع الجهاز والمتصفح لتحسين التجربة وحماية حسابك</li>
              <li><strong>سجل الطلبات:</strong> المنتجات اللي اشتريتها وتاريخ الطلبات</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. كيف منستخدم بياناتك</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>توصيل طلباتك للعنوان الصحيح</li>
              <li>التواصل معك بخصوص طلباتك عبر الهاتف او واتساب</li>
              <li>تحسين خدماتنا وعرض منتجات تناسبك</li>
              <li>حماية حسابك من الاحتيال والاستخدام غير المشروع</li>
              <li>تطبيق ميزة Wish لضمان حقوقك اذا ما استلمت الطلب</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. مشاركة البيانات</h2>
            <p><strong>ما منبيع بياناتك لطرف ثالث ابداً.</strong></p>
            <p className="mt-3">منشارك بياناتك فقط مع:</p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li><strong>التجار:</strong> اسمك ورقمك وعنوانك لتوصيل الطلب</li>
              <li><strong>السائقين:</strong> عنوانك ورقمك للتواصل عند التوصيل</li>
              <li><strong>الجهات القانونية:</strong> فقط اذا طلب القانون اللبناني ذلك</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. أمان البيانات</h2>
            <p>منستخدم تشفير SSL لكل البيانات. كلمات السر محفوظة بشكل مشفّر وما حدا بيقدر يشوفها حتى نحنا. السيرفرات محمية بجدران نارية متطورة.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. حقوقك</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>بتقدر تطلب نسخة من كل بياناتك بأي وقت</li>
              <li>بتقدر تعدل او تحذف حسابك من الاعدادات</li>
              <li>بتقدر ترفض استخدام الموقع الجغرافي - بس ما رح نقدر نسجلك</li>
              <li>بتقدر تطلب حذف كل بياناتك نهائياً</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. الكوكيز</h2>
            <p>منستخدم كوكيز اساسية فقط لتتذكر دخولك وتحسين الاداء. ما منستخدم كوكيز تتبع او اعلانات.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. التواصل معنا</h2>
            <p>لأي استفسار عن الخصوصية: واتساب 9613177653</p>
          </section>
        </div>
      </div>
    </div>
  )
}
