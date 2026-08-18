import Link from 'next/link'
import BackButton from './BackButton'
import Image from 'next/image'

export const metadata = {
  title: "الشروط والأحكام - حقوقك وضماناتك | MD-Marketplace",
  description: "اقرأ شروط وأحكام MD-Marketplace: دفع عند الاستلام، 5 توصيلات مجانية، خدمة حماية المستخدم، سياسة الإرجاع خلال 12 ساعة، ومسؤوليات العميل والتاجر. آخر تحديث تموز 2025.",
  keywords: ["شروط واحكام MD Marketplace", "ضمان حق العميل", "سياسة الارجاع لبنان"],
  openGraph: {
    title: "الشروط والأحكام - MD-Marketplace",
    description: "دفع عند الاستلام - حماية المستخدم - إرجاع خلال 12 ساعة",
    url: "https://www.md-marketplace.store/terms",
    siteName: "MD-Marketplace",
    locale: "ar_LB",
    type: "website",
  },
  alternates: {
    canonical: "https://www.md-marketplace.store/terms",
  },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-[#0D0D21] text-white">

      <div className="max-w-4xl mx-auto px-4 pt-6">
        <BackButton />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* اللوغو بالنص - بلا طراف بيض */}
        <div className="flex justify-center mb-8">
          <div className="w-[140px] h-[140px] rounded-[28px] overflow-hidden shadow-[0_0_40px_rgba(255,78,154,0.4)]">
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
          الشروط والاحكام
        </h1>

        <div className="space-y-8 text-white/80 leading-relaxed">

          <p className="text-sm text-purple-300 text-center">آخر تحديث: 7 تموز 2025</p>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. عن MD-Marketplace</h2>
            <p>
              MD-Marketplace هي منصّة رقمية تربط بين العملاء، التجار، والسائقين داخل لبنان.
              نحن <strong>وسيط تقني فقط</strong> ولا نبيع المنتجات مباشرة.
              كل تاجر مسؤول عن جودة منتجاته، أسعارها، وتوفيرها.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. إنشاء الحساب</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>يجب أن يكون عمرك 18 سنة أو أكثر، أو بموافقة ولي الأمر</li>
              <li>يجب إدخال معلومات صحيحة (الاسم، رقم الهاتف، المنطقة، العنوان)</li>
              <li>أنت مسؤول عن حماية حسابك وكلمة السر</li>
              <li>يمنع إنشاء أكثر من حساب واحد لكل مستخدم</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. الطلب والدفع</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>الدفع عند الاستلام فقط</strong> — لا يوجد دفع إلكتروني حالياً</li>
              <li>الأسعار يحددها التاجر بالليرة اللبنانية أو الدولار</li>
              <li>MD-Marketplace تأخذ عمولة من التاجر وليس من العميل</li>
              <li>يُعتبر الطلب مؤكداً عند اتصال فريق العمل أو السائق بك</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. التوصيل</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>التوصيل ضمن طرابلس حالياً، مع التوسع قريباً</li>
              <li>مدة التوصيل تختلف حسب المنطقة ونوع الطلب</li>
              <li><strong>خمسة توصيلات مجانية</strong> لأول خمسة طلبات حتى وزن 10 كغ</li>
              <li>إذا لم تكن موجوداً عند التوصيل، سيحاول السائق التواصل مرتين</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. خدمة حماية المستخدم — ضمان الحق</h2>
            <div className="bg-gradient-to-r from-[#6A11CB]/20 to-[#FF4E9A]/20 border border-[#FF4E9A]/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <img src="/icons/protection-shield.png" alt="Protection Icon" className="w-12 h-12" />
                <p className="font-bold text-white text-lg">خدمة حماية المستخدم تضمن حقك في حال حدوث أي مشكلة بالطلب:</p>
              </div>
              <ul className="list-disc list-inside space-y-2 text-white/90">
                <li>في حال عدم وصول الطلب خلال الوقت المحدد، يتم فتح بلاغ ومتابعته فوراً.</li>
                <li>في حال استلام منتج تالف أو مختلف عن الوصف، يحق لك استرجاعه أو استرداد قيمته.</li>
                <li>يتم معالجة البلاغات خلال مدة أقصاها <strong>12 ساعة</strong>.</li>
                <li>الخدمة مجانية بالكامل ولا تتطلّب أي رسوم إضافية.</li>
              </ul>
              <div className="mt-6">
                <Link href="/protection-cases" className="block w-full text-center px-4 py-3 rounded-lg bg-gradient-to-r from-[#6A11CB] to-[#FF4E9A] text-white font-semibold hover:opacity-90 transition">إرسال بلاغ</Link>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. الإرجاع والاستبدال</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>يمكنك استرجاع المنتج خلال 12 ساعة إذا كان فيه عيب أو مختلف عن الوصف</li>
              <li>يجب أن يكون المنتج بحالته الأصلية مع الغلاف</li>
              <li>تكاليف الاسترجاع على الشركة إذا كان الخطأ من التاجر</li>
              <li>المنتجات الغذائية والشخصية لا تُسترجع إلا إذا كانت تالفة</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. مسؤوليات المستخدم</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>يمنع استخدام المنصّة لأي نشاط غير قانوني</li>
              <li>يمنع السبّ أو التشهير أو التهديد للتجار أو السائقين</li>
              <li>يمنع طلب منتجات ممنوعة قانوناً داخل لبنان</li>
              <li>عند تكرار ثلاث طلبات وهمية، يتم حظر الحساب نهائياً</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. حدود المسؤولية</h2>
            <p>MD-Marketplace غير مسؤولة عن:</p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li>جودة المنتجات — مسؤولية التاجر</li>
              <li>التأخير الناتج عن ظروف قاهرة مثل الطقس، الحرب، أو قطع الطرقات</li>
              <li>الأضرار الناتجة عن سوء استخدام المنتج</li>
              <li>الخلافات المباشرة بينك وبين التاجر، مع إمكانية المساعدة عبر نظام حماية المستخدم</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. تعديل الشروط</h2>
            <p>يحق لـ MD-Marketplace تعديل الشروط في أي وقت. تصبح التعديلات سارية بعد <strong>سبعة أيام</strong> من نشرها. استمرارك باستخدام التطبيق يعني موافقتك على الشروط الجديدة.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. القانون الحاكم</h2>
            <p>تخضع هذه الشروط للقانون اللبناني. أي نزاع يتم حله عبر المحاكم اللبنانية المختصة في <strong>بيروت</strong>.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">11. التواصل</h2>
            <p>لأي استفسار قانوني أو حقوقي: واتساب 9613177653</p>
          </section>

        </div>
      </div>
    </div>
  )
}
