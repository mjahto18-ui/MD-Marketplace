'use client'
import Link from 'next/link'
import Image from 'next/image'

export default function OurStoryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="absolute top-4 left-4 z-50">
        <Link href="/about" className="bg-gradient-to-l from-[#6A11CB] to-[#FF4E9A] text-white px-6 py-2 rounded-full font-semibold shadow-lg hover:opacity-90 transition">
          ← العودة لمن نحن
        </Link>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center mb-12">
          <div className="bg-white p-4 rounded-3xl shadow-xl mb-5">
            <Image src="/icon.png" alt="MD-Marketplace" width={125} height={125} />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-[#0D0D21] mb-3 text-center">قصة تأسيس MD-Marketplace</h1>
          <p className="text-lg text-[#6A11CB] font-semibold">عندما تفهم التجارة الإنسان</p>
        </div>

        <div className="max-w-4xl mx-auto">

          {/* المقدمة */}
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8 text-right">
            <h3 className="text-2xl font-bold text-[#6A11CB] mb-4">لماذا بُنيت هذه المنظومة؟</h3>
            <p className="text-[#0D0D21] leading-relaxed">
              العالم مليء بالتطبيقات، لكن معظمها صُمم ليرضي النظام البرمجي وليس الإنسان. أزرار كثيرة وقوائم معقدة. من هنا ولدت الفكرة: بناء بنية تحتية تجبر كل التعقيد أن يعمل خلف الكواليس، ويكفي أن تقول بلغتك البسيطة "شو بدك".
            </p>
          </div>

          {/* القسم الأول */}
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8 text-right">
            <h3 className="text-2xl font-bold text-[#0D0D21] mb-6">القسم الأول: رحلة الطلب</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-[#6A11CB] mb-2">1. منتج بهوية ومكان وحالة</h4>
                <p className="text-[#0D0D21]/80 text-sm leading-relaxed"><span className="text-red-500 font-bold">المشكلة:</span> تطلب منتجاً لتتفاجأ أن المتجر مغلق أو غير متوفر.</p>
                <p className="text-[#0D0D21] text-sm leading-relaxed mt-1"><span className="text-green-600 font-bold">الحل عندنا:</span> على موقعنا كل منتج مرتبط بمتجره الحقيقي، منطقته، كميته، وحالته (فاتح/مسكر الآن). بتشوفو بعينك على الموقع، وبتسأل عنو على واتساب بنفس الدقة.</p>
              </div>
              <div>
                <h4 className="font-bold text-[#6A11CB] mb-2">2. السلة الذكية التي لا تتكرر</h4>
                <p className="text-[#0D0D21]/80 text-sm"><span className="text-red-500 font-bold">المشكلة:</span> تضيف نفس السلعة مرتين فتتكرر كعنصرين وتتفاجأ بالفاتورة.</p>
                <p className="text-[#0D0D21] text-sm mt-1"><span className="text-green-600 font-bold">الحل:</span> سلتك مربوطة بحسابك على الموقع وواتساب بنفس الوقت. إذا أضفت نفس المنتج تزيد الكمية تلقائياً، ومحفوظة 30 دقيقة حتى لو انشغلت ورجعت.</p>
              </div>
              <div>
                <h4 className="font-bold text-[#6A11CB] mb-2">3. التوصيل بالعدل والمجاني المنظم</h4>
                <p className="text-[#0D0D21]/80 text-sm"><span className="text-red-500 font-bold">المشكلة:</span> "توصيل مجاني" بشروط خفية.</p>
                <p className="text-[#0D0D21] text-sm mt-1"><span className="text-green-600 font-bold">الحل:</span> رسم التوصيل محسوب بوزن سلتك الحقيقي، وإلك 5 توصيلات مجانية منظمة بقواعد عادلة تمنع الفوضى.</p>
              </div>
              <div>
                <h4 className="font-bold text-[#6A11CB] mb-2">4. عنوانك نقطة على الخريطة</h4>
                <p className="text-[#0D0D21]/80 text-sm"><span className="text-red-500 font-bold">المشكلة:</span> السائق يضيع ويسألك "يمين أو شمال؟"</p>
                <p className="text-[#0D0D21] text-sm mt-1"><span className="text-green-600 font-bold">الحل:</span> عنوانك محفوظ بكبسة، أو نقطة دقيقة على الخريطة يراها السائق فوراً. بتحطها مرة وحدة وخلص.</p>
              </div>
            </div>
          </div>

          {/* القسم الثاني */}
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8 text-right">
            <h3 className="text-2xl font-bold text-[#0D0D21] mb-6">القسم الثاني: الثقة والأمان</h3>
            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-[#6A11CB] mb-2">1. حسابك وسلتك محمية</h4>
                <p className="text-[#0D0D21] text-sm">حسابك ينقفل تلقائياً بعد 3 محاولات خاطئة، وسلتك معزولة تماماً - مستحيل أي شخص يعدلها غيرك.</p>
              </div>
              <div>
                <h4 className="font-bold text-[#6A11CB] mb-2">2. رصيدك بدفتر واضح</h4>
                <p className="text-[#0D0D21] text-sm">رصيدك ونقاطك مش رقم مبهم. هو سجل كامل لكل حركة إضافة وخصم واسترجاع، بتشوفو بشفافية بصفحة حسابك.</p>
              </div>
              <div>
                <h4 className="font-bold text-[#6A11CB] mb-2">3. نضمن حقك</h4>
                <p className="text-[#0D0D21] text-sm">عندك صفحة "نضمن حقك". تختار المشكلة، ترفع 3 صور كدليل، وتأخذ رقم متابعة نتابعو حتى الحل. موجودة على الموقع وبتقدر تبلشها من واتساب.</p>
              </div>
            </div>
          </div>

          {/* القسم الثالث */}
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8 text-right">
            <h3 className="text-2xl font-bold text-[#0D0D21] mb-6">القسم الثالث: الذكاء الذي يفهمك</h3>
            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-[#6A11CB] mb-2">1. بتحكي بدل ما تكبس</h4>
                <p className="text-[#0D0D21] text-sm">بدل 10 ضغطات لطلب بيبسي، تكتب على واتساب "بدي بيبسي 2 لتر عدد 2" والمساعد يضيفها لنفس سلة الموقع فوراً. وحتى فيك تبعت فويس أو تصور باركود.</p>
              </div>
              <div>
                <h4 className="font-bold text-[#6A11CB] mb-2">2. ممنوع يألف من عندو</h4>
                <p className="text-[#0D0D21] text-sm">أهم قاعدة: المساعد ممنوع يخترع منتج أو سعر. كل شي بيقولو من مخزون متاجرنا الحقيقي على الموقع. إذا مش موجود، بيقلك مش موجود.</p>
              </div>
              <div>
                <h4 className="font-bold text-[#6A11CB] mb-2">3. بيتذكرك وبيحكي لهجتك</h4>
                <p className="text-[#0D0D21] text-sm">عندو ذاكرة لآخر طلباتك وبيحكي لهجة لبنانية طبيعية، بيسألك "نفس طلب المرة الماضية؟" بدل الترحيب الممل.</p>
              </div>
              <div>
                <h4 className="font-bold text-[#6A11CB] mb-2">4. تأكيد الطلب بأمان مطلق</h4>
                <p className="text-[#0D0D21] text-sm">كلمات مثل "تمام" ما بتنحسب تأكيد. لازم تقول "تأكيد الطلب" صراحة، وما بينبعت طلبك إلا بعد تنفيذ فعلي بالنظام. الذكاء بيحكي، بس النظام هو صاحب السلطة المالية.</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-l from-[#6A11CB] to-[#FF4E9A] rounded-3xl shadow-lg p-8 text-center text-white">
            <h3 className="text-2xl font-bold mb-3">الخلاصة</h3>
            <p className="leading-relaxed">MD-Marketplace مش مجرد موقع. هي منظومة تزيح عنك تعقيد التجارة. افتح الموقع لترى كل شيء بعينك، أو ابدأ محادثة على واتساب وقل ما تريد بلغتك... والباقي تتولاه المنظومة بسرعة وثقة.</p>
          </div>

        </div>

        <div className="border-t border-[#6A11CB]/20 pt-8 mt-12">
          <div className="flex items-center justify-center gap-6 text-sm">
            <Link href="/about" className="text-[#6A11CB] hover:text-[#FF4E9A] font-medium">من نحن</Link>
            <span className="text-[#6A11CB]/30">|</span>
            <Link href="/privacy" className="text-[#6A11CB] hover:text-[#FF4E9A] font-medium">الخصوصية</Link>
            <span className="text-[#6A11CB]/30">|</span>
            <Link href="/terms" className="text-[#6A11CB] hover:text-[#FF4E9A] font-medium">الشروط</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
