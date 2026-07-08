import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export const metadata = {
  title: 'الشروط والاحكام - MD-Marketplace',
  description: 'شروط استخدام منصة MD-Marketplace'
}

export default function TermsPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-[#0D0D21] text-white">
      {/* زر الرجوع الصغير */}
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
          الشروط والاحكام
        </h1>
        
        <div className="space-y-8 text-white/80 leading-relaxed">
          <p className="text-sm text-purple-300">آخر تحديث: 7 تموز 2025</p>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. عن MD Marketplace</h2>
            <p>MD Marketplace منصة رقمية تربط بين العملاء والتجار والسائقين في لبنان. نحنا <strong>وسيط فقط</strong> ولا نبيع المنتجات مباشرة. كل تاجر مسؤول عن منتجاته واسعاره وجودتها.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. انشاء الحساب</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>يجب ان يكون عمرك 18+ او بموافقة ولي الامر</li>
              <li>المعلومات يجب ان تكون صحيحة - رقم الهاتف والعنوان اساسي</li>
              <li>انت مسؤول عن حماية حسابك وكلمة السر</li>
              <li>يمنع إنشاء اكتر من حساب واحد</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. الطلب والدفع</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>الدفع عند الاستلام فقط</strong> - لا يوجد دفع اونلاين حالياً</li>
              <li>الاسعار بالليرة اللبنانية او الدولار حسب التاجر</li>
              <li>MD-Marketplace تأخذ عمولة من التاجر، وليس منك</li>
              <li>الطلب بيعتبر مؤكد حين يتصل بك فريق العمل  او السائق</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. التوصيل</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>التوصيل ضمن طرابلس فقط حالياً مع التوسع عن قريب</li>
              <li>مدة التوصيل حسب المنطقة - من 15 دقيقة لـ 30 ساعة</li>
              <li><strong>لديك 5 توصيلات مجانية تحت 10 كيلو</strong> عند اول تسجيل، بعدها حسب المسافة ووزن الطلب</li>
              <li>عندما لا تكون موجود وقت التوصيل، السائق سوف يحاول التواصل معك مرتين</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. ميزة Wish - ضمان حق</h2>
            <div className="bg-gradient-to-r from-[#6A11CB]/20 to-[#FF4E9A]/20 border border-[#FF4E9A]/30 rounded-xl p-6">
              <p className="font-bold text-white mb-3">Wish هي ميزتنا الحصرية لحمايتك:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>اذا دفعت وما استلمت طلبك خلال ساعتين → <strong>نسترجع المبلغ كامل دون خصارتك أي شيء</strong></li>
                <li>اذا استلمت منتج مختلف او مضروب → <strong>يحق لك استرجاعه واسترداد المبلغ</strong></li>
                <li>كل الشكاوي تتعالج خلال 12 ساعة كحد اقصى</li>
                <li>Wish مجانية 100% ولا تدفع عليها شيء</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. الارجاع والاستبدال</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>تستطيع استرجاع المنتج خلال 12 ساعة اذا كان فيه عيب او مختلف عن الوصف</li>
              <li>المنتج يجب ان يكون بحالته الاصلية مع الغلاف</li>
              <li>تكاليف الاسترجاع على الشركة اذا كان الخطأ من التاجر</li>
              <li>المنتجات الغذائية والشخصية لا تسترجع الا اذا كانت تالفة</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. مسؤوليات المستخدم</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>يمنع استخدام المنصة لأي شي غير قانوني</li>
              <li>يمنع السب و ااتشهير او التهديد للتجار او السائقين</li>
              <li>يمنع طلب منتجات ممنوعة قانوناً بلبنان</li>
              <li>عند تكرار 3 طلبات وهمية ولم تستلم، يحظر حسابك</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. حدود المسؤولية</h2>
            <p>MD Marketplace لسنا مسؤولين عن:</p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li>جودة المنتجات - هذه مسؤولية التاجر</li>
              <li>تأخير التوصيل بسبب ظروف قاهرة: حرب، طقس، قطع طرقات</li>
              <li>الاضرار الناتجة عن سوء استخدام المنتج</li>
              <li>الخلافات بينك وبين التاجر - من المحتمل ان نساعد بالحل عبر Wish</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. تعديل الشروط</h2>
            <p>نستطيع تعديل الشروط بأي وقت. التعديلات تصبح سارية المفعول بعد 7 ايام من نشرها. استمرارك باستخدام التطبيق يعني موافقتك على الشروط الجديدة.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. القانون الحاكم</h2>
            <p>هذه الشروط خاضعة للقانون اللبناني. وأي نزاع يجب ان يكون في المحاكم اللبنانية المختصة في بيروت.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">11. التواصل</h2>
            <p>لأي استفسار قانوني او حقوقي: واتساب 9613000000</p>
          </section>
        </div>
      </div>
    </div>
  )
}
