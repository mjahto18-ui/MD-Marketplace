import BackButton from './BackButton'
import Image from 'next/image'

export const metadata = {
  title: "سياسة الخصوصية - كيف نحمي بياناتك | MD-Marketplace",
  description: "سياسة خصوصية MD-Marketplace: نادي رقمي خاص مغلق، تشفير SSL، حماية بيانات السائقين، تتبع GPS اثناء الرحلة فقط، بصمة جهاز لمكافحة الاحتيال، عدم بيع البيانات.",
  keywords: ["سياسة الخصوصية", "حماية البيانات MD Marketplace", "خصوصية لبنان", "نادي خاص"],
  openGraph: {
    title: "سياسة الخصوصية - MD-Marketplace",
    description: "لا نبيع بياناتك. نادي خاص مغلق - حماية متقدمة - حقوق كاملة",
    url: "https://www.md-marketplace.store/privacy",
    siteName: "MD-Marketplace",
    locale: "ar_LB",
    type: "website",
  },
  alternates: {
    canonical: "https://www.md-marketplace.store/privacy",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-[#0D0D21] text-white">

      <div className="max-w-4xl mx-auto px-4 pt-6">
        <BackButton />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* اللوغو بالنص - بلا طراف بيض */}
        <div className="flex justify-center mb-8">
          <div className="w- h- rounded- overflow-hidden shadow-[0_0_40px_rgba(255,78,154,0.4)]">
            <Image
              src="/icon-dark.png"
              alt="MD Marketplace"
              width={140}
              height={140}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-[#6A11CB] to-[#FF4E9A] bg-clip-text text-transparent text-center">
          سياسة الخصوصية
        </h1>

        <div className="space-y-8 text-white/80 leading-relaxed">

          <p className="text-sm text-purple-300">آخر تحديث: 8 تموز 2026</p>

          {/* بند جديد - طبيعة النادي المغلق */}
          <section className="bg-red-950/20 border border-red-500/30 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">0. طبيعة المنصة - نادي رقمي خاص مغلق</h2>
            <p className="text-white/90">
              MD-Marketplace هي <strong>نادي رقمي خاص مغلق Private Digital Club</strong>. بياناتك لا تُعرض للعامة ولا تُشارك خارج عائلة المنصة الرقمية.
              مشاركة البيانات تتم فقط بين أعضاء موثقين بـ User ID نشط داخل النادي وبموافقتك الصريحة، وليس مع طرف ثالث عشوائي من الشارع.
            </p>
          </section>

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

          {/* بند جديد - بيانات السائق */}
          <section className="bg-yellow-950/20 border border-yellow-500/30 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">1.1 بيانات العضو الناقل (السائق) - إلزامية للتفعيل</h2>
            <p className="mb-3 text-white/90">لتفعيل حساب العضو الناقل داخل النادي المغلق، نجمع ونشفر:</p>
            <ul className="list-disc list-inside space-y-2 text-white/90">
              <li><strong>صورة رخصة السوق:</strong> للتحقق من أهلية القيادة - تخزن مشفرة ولا تشارك مع العملاء</li>
              <li><strong>صورة دفتر السيارة:</strong> للتحقق من ملكية وقانونية السيارة</li>
              <li><strong>صورة التأمين الإلزامي الساري:</strong> لحماية الركاب</li>
              <li><strong>صورة السيارة ولوحتها:</strong> للتعرف عليها من قبل العميل فقط أثناء الرحلة النشطة</li>
              <li>جميع هذه المستندات تخضع لموافقة الإدارة وتبقى سرية داخل إدارة النادي فقط.</li>
            </ul>
          </section>

          {/* بند جديد - الموقع الحي */}
          <section className="bg-blue-950/20 border border-blue-500/30 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">1.2 الموقع الجغرافي الحي أثناء الرحلة وخدمة SOS</h2>
            <ul className="list-disc list-inside space-y-2 text-white/90">
              <li>أثناء الرحلة النشطة فقط، نجمع <strong>الموقع الحي GPS كل 4 ثواني</strong> لعرضه للعميل وللإدارة ولخدمة الطوارئ SOS.</li>
              <li>تتبع الموقع يتوقف تلقائياً عند انتهاء الرحلة (Complete) - لا نتتبعك خارج الرحلة.</li>
              <li>في حال تفعيل زر SOS، يتم مشاركة موقعك الحي مع إدارة المنصة فقط لاتخاذ إجراءات السلامة.</li>
              <li>رابط مشاركة الرحلة الآمن ينتهي تلقائياً بانتهاء الرحلة ولا يمكن استخدامه لاحقاً.</li>
            </ul>
          </section>

          {/* بند جديد - بصمة الجهاز */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1.3 بصمة الجهاز ومكافحة الاحتيال</h2>
            <p className="mb-3">لمكافحة الحسابات الوهمية وتزوير الحضور:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>بصمة جهاز Canvas Fingerprint + Hardware Concurrency:</strong> نستخدمها للتحقق أن الحساب من جهاز حقيقي وليس محاكي</li>
              <li><strong>QR متغير كل 5 دقائق:</strong> لحضور الموظفين - يمنع مشاركة صورة QR</li>
              <li>هذه البيانات تقنية بحتة ولا تحدد هويتك الشخصية - تستخدم فقط للأمان</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. كيف نستخدم بياناتك</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>توصيل الطلبات إلى عنوانك الصحيح</li>
              <li>التواصل معك عبر الهاتف أو واتساب بخصوص طلبك</li>
              <li>تحسين تجربة الاستخدام وعرض منتجات تناسبك</li>
              <li>حماية حسابك من الاحتيال أو الاستخدام غير المشروع</li>
              <li>تطبيق ميزة خدمة حماية المستخدم لضمان حقوقك</li>
              <li>تنسيق الرحلات الخاصة بين أعضاء النادي المغلق فقط</li>
              <li>التحقق من قانونية وأهلية الأعضاء الناقلين قبل تفعيلهم</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. مشاركة البيانات</h2>
            <p><strong>لا نبيع بياناتك ولا نشاركها مع أي طرف ثالث غير مخوّل خارج النادي المغلق.</strong></p>
            <p className="mt-3">يتم مشاركة بياناتك فقط داخل النادي المغلق مع:</p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li><strong>التجار (أعضاء موثقين):</strong> اسمك ورقم هاتفك وعنوانك بهدف تجهيز الطلب</li>
              <li><strong>السائقين (أعضاء ناقلين موثقين):</strong> عنوانك ورقم هاتفك وموقعك الحي أثناء الرحلة النشطة فقط بهدف التوصيل</li>
              <li><strong>العملاء (أعضاء موثقين):</strong> اسم السائق وصورته وصورة سيارته ولوحتها وموقعه الحي أثناء الرحلة النشطة فقط</li>
              <li><strong>الجهات القانونية:</strong> فقط في حال وجود طلب رسمي وفق القانون اللبناني</li>
              <li><strong>مستندات السائق (رخصة، دفتر، تأمين):</strong> لا تشارك أبداً مع العملاء - تبقى لدى الإدارة فقط</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. أمان البيانات</h2>
            <p>
              نستخدم تقنيات حماية متقدمة لضمان سرية بياناتك، بما في ذلك:
              <br/>• تشفير SSL لجميع الاتصالات
              <br/>• تخزين كلمات السر والمستندات بشكل مشفّر لا يمكن الاطلاع عليه
              <br/>• سيرفرات محمية بجدران نارية وأنظمة مراقبة - Supabase RLS + 27 Triggers حماية
              <br/>• وصول محدود للموظفين المصرّح لهم فقط
              <br/>• سجل تدقيق Immutable Ledger لكل حركة مالية وكل وصول للبيانات الحساسة
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. حقوقك</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>طلب نسخة من بياناتك في أي وقت</li>
              <li>تعديل بياناتك من صفحة الإعدادات</li>
              <li>حذف حسابك نهائياً (مع الاحتفاظ بالسجل المالي المشفر لمدة قانونية)</li>
              <li>طلب حذف جميع بياناتك غير المالية من النظام</li>
              <li>رفض مشاركة موقعك الجغرافي الحي (لن تتمكن من استخدام خدمات التوصيل والرحلات)</li>
              <li>طلب حذف مستنداتك (رخصة، دفتر) بعد إيقاف حسابك كعضو ناقل</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. الكوكيز</h2>
            <p>
              نستخدم كوكيز أساسية فقط لضمان عمل الموقع بشكل صحيح، مثل:
              <br/>• تذكّر تسجيل الدخول
              <br/>• تحسين الأداء
              <br/>• حفظ User ID للنادي المغلق
              <br/>لا نستخدم كوكيز إعلانية أو تتبع خارجي.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. مدة الاحتفاظ بالبيانات</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>الموقع الحي:</strong> يحذف فوراً بعد انتهاء الرحلة - لا نحتفظ بمسارك</li>
              <li><strong>مستندات السائق:</strong> طوال فترة العضوية النشطة + 6 أشهر بعد الإيقاف</li>
              <li><strong>السجل المالي:</strong> غير قابل للحذف - Immutable Ledger لأسباب محاسبية وقانونية</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. التواصل معنا</h2>
            <p>لأي استفسار متعلق بالخصوصية وحذف البيانات: واتساب 9613177653</p>
            <p className="mt-2 text-sm text-white/60">المسؤول عن حماية البيانات: MD-Marketplace - طرابلس - لبنان - نادي رقمي خاص مغلق</p>
          </section>

        </div>
      </div>
    </div>
  )
}
