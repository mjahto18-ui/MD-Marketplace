import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export const metadata = {
  title: 'الشروط والاحكام - MD Marketplace',
  description: 'شروط استخدام منصة MD Marketplace'
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
          <p className="text-sm text-purple-300">آخر تحديث: 7 تموز 2026</p>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. عن MD Marketplace</h2>
            <p>MD Marketplace منصة رقمية تربط بين الزبائن والتجار والسائقين في لبنان. نحنا <strong>وسيط فقط</strong> وما منبيع المنتجات مباشرة. كل تاجر مسؤول عن منتجاته واسعاره وجودتها.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. انشاء الحساب</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>لازم يكون عمرك 18+ او معك موافقة ولي الامر</li>
              <li>المعلومات لازم تكون صحيحة - رقم الهاتف والعنوان اساسي</li>
              <li>انت مسؤول عن حماية حسابك وكلمة السر</li>
              <li>ممنوع انشاء اكتر من حساب واحد</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. الطلب والدفع</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>الدفع عند الاستلام فقط</strong> - ما في دفع اونلاين حالياً</li>
              <li>الاسعار بالليرة اللبنانية او الدولار حسب التاجر</li>
              <li>MD Marketplace بياخد عمولة من التاجر، مش منك</li>
              <li>الطلب بيعتبر مؤكد بس يتصل فيك التاجر او السائق</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. التوصيل</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>التوصيل ضمن لبنان فقط حالياً</li>
              <li>مدة التوصيل حسب المنطقة - من 30 دقيقة لـ 48 ساعة</li>
              <li><strong>الك 5 توصيلات مجانية</strong> اول ما تسجل، بعدها حسب عرض التاجر</li>
              <li>اذا ما كنت موجود وقت التوصيل، السائق رح يحاول يتواصل معك مرتين</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. ميزة Wish - ضمان حقك</h2>
            <div className="bg-gradient-to-r from-[#6A11CB]/20 to-[#FF4E9A]/20 border border-[#FF4E9A]/30 rounded-xl p-6">
              <p className="font-bold text-white mb-3">Wish هي ميزتنا الحصرية لحمايتك:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>اذا دفعت وما استلمت طلبك خلال 7 ايام → <strong>منرجعلك فلوسك كاملة</strong></li>
                <li>اذا استلمت منتج مختلف او مضروب → <strong>بتقدر ترجعه ونرجعلك المبلغ</strong></li>
                <li>كل الشكاوي بتتعالج خلال 48 ساعة كحد اقصى</li>
                <li>Wish مجانية 100% وما بتدفع عليها شي</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. الارجاع والاستبدال</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>بتقدر ترجع المنتج خلال 24 ساعة اذا كان فيه عيب او مختلف عن الوصف</li>
              <li>المنتج لازم يكون بحالته الاصلية مع الغلاف</li>
              <li>مصاريف الارجاع علينا اذا كان الخطأ من التاجر</li>
              <li>المنتجات الغذائية والشخصية ما بترجع الا اذا كانت مضروبة</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. مسؤوليات المستخدم</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>ممنوع استخدام المنصة لأي شي غير قانوني</li>
              <li>ممنوع السب او التهديد للتجار او السائقين</li>
              <li>ممنوع طلب منتجات ممنوعة قانوناً بلبنان</li>
              <li>اذا عملت 3 طلبات وهمية وما استلمت، منسكر حسابك</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. حدود المسؤولية</h2>
            <p>MD Marketplace مش مسؤول عن:</p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li>جودة المنتجات - هاي مسؤولية التاجر</li>
              <li>تأخير التوصيل بسبب ظروف قاهرة: حرب، طقس، قطع طرقات</li>
              <li>الاضرار الناتجة عن سوء استخدام المنتج</li>
              <li>الخلافات بينك وبين التاجر - بس منساعد بالحل عبر Wish</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. تعديل الشروط</h2>
            <p>منقدر نعدل الشروط بأي وقت. التعديلات بتصير سارية بعد 7 ايام من نشرها. استمرارك باستخدام التطبيق يعني موافقتك عالشروط الجديدة.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. القانون الحاكم</h2>
            <p>هالشروط خاضعة للقانون اللبناني. أي نزاع بينحل بالمحاكم اللبنانية المختصة في بيروت.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">11. التواصل</h2>
            <p>لأي استفسار قانوني: واتساب 9613177653</p>
          </section>
        </div>
      </div>
    </div>
  )
}
