import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export const metadata = {
  title: 'سياسة الخصوصية - MD Marketplace',
  description: 'كيف نحمي بياناتك في MD Marketplace'
}

export default function PrivacyPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-[#0D0D21] text-white">

      {/* زر الرجوع */}
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

          <p className="text-sm text-purple-300">آخر تحديث: 7 تموز 2025</p>

          {/* 1 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. البيانات التي نجمعها</h2>
            <p>نجمع البيانات التالية بهدف تقديم خدمة دقيقة وآمنة:</p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li><strong>معلومات الحساب:</strong> الاسم، رقم الهاتف، المنطقة، العنوان، البريد الإلكتروني (اختياري)</li>
              <li><strong>الموقع الجغرافي:</strong> أثناء التسجيل فقط لتأكيد عنوانك وتحديد أقرب المتاجر والسائقين</li>
              <li><strong>معلومات الجهاز:</strong> نوع الجهاز، نظام التشغيل، المتصفح، عنوان الـ IP لحماية الحساب وتحسين الأداء</li>
              <li><strong>سجل الطلبات:</strong> المنتجات التي اشتريتها، حالة الطلب، وتاريخ الطلبات</li>
            </ul>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. كيف نستخدم بياناتك</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>توصيل الطلبات إلى عنوانك الصحيح</li>
              <li>التواصل معك عبر الهاتف أو واتساب بخصوص طلبك</li>
              <li>تحسين تجربة الاستخدام وعرض منتجات تناسبك</li>
              <li>حماية حسابك من الاحتيال أو الاستخدام غير المشروع</li>
              <li>تطبيق ميزة Wish لضمان حقوقك في حال عدم استلام الطلب</li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. مشاركة البيانات</h2>
            <p><strong>لا نبيع بياناتك ولا نشاركها مع أي طرف ثالث غير مخوّل.</strong></p>
            <p className="mt-3">يتم مشاركة بياناتك فقط مع:</p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li><strong>التجار:</strong> اسمك ورقم هاتفك وعنوانك بهدف تجهيز الطلب</li>
              <li><strong>السائقين:</strong> عنوانك ورقم هاتفك بهدف التوصيل والتواصل عند الحاجة</li>
              <li><strong>الجهات القانونية:</strong> فقط في حال وجود طلب رسمي وفق القانون اللبناني</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. أمان البيانات</h2>
            <p>
              نستخدم تقنيات حماية متقدمة لضمان سرية بياناتك، بما في ذلك:
              <br/>• تشفير SSL لجميع الاتصالات
              <br/>• تخزين كلمات السر بشكل مشفّر لا يمكن الاطلاع عليه
              <br/>• سيرفرات محمية بجدران نارية وأنظمة مراقبة
              <br/>• وصول محدود للموظفين المصرّح لهم فقط
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. حقوقك</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>طلب نسخة من بياناتك في أي وقت</li>
              <li>تعديل بياناتك من صفحة الإعدادات</li>
              <li>حذف حسابك نهائياً</li>
              <li>طلب حذف جميع بياناتك من النظام</li>
              <li>رفض مشاركة موقعك الجغرافي (لن تتمكن من التسجيل أو استخدام خدمات التوصيل)</li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. الكوكيز</h2>
            <p>
              نستخدم كوكيز أساسية فقط لضمان عمل الموقع بشكل صحيح، مثل:
              <br/>• تذكّر تسجيل الدخول
              <br/>• تحسين الأداء
              <br/>لا نستخدم كوكيز إعلانية أو تتبع.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. التواصل معنا</h2>
            <p>لأي استفسار متعلق بالخصوصية: واتساب 9613000000</p>
          </section>

        </div>
      </div>
    </div>
  )
}
