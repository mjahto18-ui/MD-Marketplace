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
          <p className="text-lg text-[#6A11CB] font-semibold">عندما تفهم التجارة الإنسان — وتغلق ثغرات الشارع</p>
        </div>

        <div className="max-w-4xl mx-auto">

          {/* المقدمة */}
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8 text-right">
            <h3 className="text-2xl font-bold text-[#6A11CB] mb-4">لماذا بُنيت هذه المنظومة؟</h3>
            <p className="text-[#0D0D21] leading-relaxed">
              العالم مليء بالتطبيقات والمتاجر الإلكترونية الكبرى، لكن الحقيقة المؤلمة أن معظمها صُمم لإرضاء النظام البرمجي وليس الإنسان. يضيع العميل بين مئات الأزرار والقوائم المعقدة لمجرد طلب سلع بسيطة. 
              في <strong>MD-Marketplace</strong>، لم نبنِ تطبيقاً تقليدياً آخر، بل أسسنا كياناً حياً ومستقلاً — <strong>"الشخص الثاني" في حياتك</strong> — بنيّة تحتية رقمية تزيح كل التعقيد خلف الكواليس لتلبي طلبك بلغتك وبأبسط طريقة ممكنة: <strong>"شو بدك، وكيف بدك ياه"</strong>.
            </p>
          </div>

          {/* القسم الأول: الأمان الميداني */}
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8 text-right border-2 border-[#6A11CB]/20">
            <h3 className="text-2xl font-bold text-[#0D0D21] mb-6">القسم الأول: الأمان الميداني وسد ثغرات الشارع</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-[#6A11CB] mb-2">1. ضبط فوضى "الدليفري العشوائي"</h4>
                <p className="text-[#0D0D21]/80 text-sm leading-relaxed"><span className="text-red-500 font-bold">المشكلة في الواقع:</span> في مناطق عديدة، يعاني السوق من الفوضى؛ أي شخص يمتلك دراجة نارية يضع رقمه في مجموعة أو تطبيق عشوائي ليصبح "سائق توصيل"، دون رقابة أو مرجعية تضمن حق العميل وأمان بيته.</p>
                <p className="text-[#0D0D21] text-sm leading-relaxed mt-1"><span className="text-green-600 font-bold">الحل عندنا:</span> السائق ليس مجرد رقم عشوائي على الشارع. كل سائق مسجل ببياناته الحقيقية وهويته المرتبطة مباشرة بغرفة العمليات الحية بالمنصة. أنت لا تستقبل شخصاً مجهولاً، بل كادراً مسجلاً ضمن منظومة أمان تحمي طلبك، بيتك، ونقودك.</p>
              </div>
              <div>
                <h4 className="font-bold text-[#6A11CB] mb-2">2. هندسة الأمان وحماية السلال والحسابات</h4>
                <p className="text-[#0D0D21]/80 text-sm"><span className="text-red-500 font-bold">المشكلة:</span> اختراق الحسابات والتلاعب بسلال المشتريات.</p>
                <p className="text-[#0D0D21] text-sm mt-1"><span className="text-green-600 font-bold">الحل:</span> لقد أغلقنا كل ثغرة يدوياً؛ حسابك يقفل تلقائياً بعد أي محاولة دخول مشبوهة، وسلتك معزولة تماماً بحيث يستحيل على أي شخص العبث بها غيرك.</p>
              </div>
            </div>
          </div>

          {/* القسم الثاني: رحلة الطلب والتجربة */}
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8 text-right">
            <h3 className="text-2xl font-bold text-[#0D0D21] mb-6">القسم الثاني: رحلة الطلب الذكية</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-[#6A11CB] mb-2">1. منتج بهوية ومكان وحالة تشغيلية حقيقية</h4>
                <p className="text-[#0D0D21]/80 text-sm leading-relaxed"><span className="text-red-500 font-bold">المشكلة التقليدية:</span> تطلب منتجاً من منصة عادية لتكتشف لاحقاً أن المتجر مغلق أو نفدت الكمية.</p>
                <p className="text-[#0D0D21] text-sm leading-relaxed mt-1"><span className="text-green-600 font-bold">الحل عندنا:</span> على موقعنا كل منتج مرتبط فوراً بالحالة التشغيلية الحقيقية للمتجر (فتح/إغلاق) والكمية المتاحة، لتعرف تماماً أن طلبك جاهز قبل أن تطلبه.</p>
              </div>
              <div>
                <h4 className="font-bold text-[#6A11CB] mb-2">2. السلة الذكية والتوصيل المنظم</h4>
                <p className="text-[#0D0D21]/80 text-sm"><span className="text-red-500 font-bold">المشكلة:</span> تضيف نفس السلعة مرتين فتتكرر كعنصرين منفصلين، وتفاجأ برسوم توصيل مبهمة.</p>
                <p className="text-[#0D0D21] text-sm mt-1"><span className="text-green-600 font-bold">الحل:</span> سلتك ذكية ومتزامنة؛ إذا أضفت نفس المنتج تزداد كميته تلقائياً بدل تكراره، ومحفوظة حتى لو انشغلت ورجعت، ورسوم التوصيل محسوبة بعدالة بناءً على الوزن الحقيقي.</p>
              </div>
              <div>
                <h4 className="font-bold text-[#6A11CB] mb-2">3. عنوانك نقطة دقيقة على الخريطة</h4>
                <p className="text-[#0D0D21]/80 text-sm"><span className="text-red-500 font-bold">المشكلة:</span> بقاء السائق ضائعاً يسألك على الهاتف "يمين أو شمال؟".</p>
                <p className="text-[#0D0D21] text-sm mt-1"><span className="text-green-600 font-bold">الحل:</span> عنوانك نقطة جغرافية دقيقة على الخريطة يحفظها النظام بكبسة زر واحدة لكي يراها السائق فوراً دون أي ضياع.</p>
              </div>
              <div>
                <h4 className="font-bold text-[#6A11CB] mb-2">4. نضمن حقك</h4>
                <p className="text-[#0D0D21]/80 text-sm"><span className="text-red-500 font-bold">المشكلة:</span> ضياع حقوق العميل عند حدوث أي خطأ دون مرجعية تتابعه.</p>
                <p className="text-[#0D0D21] text-sm mt-1"><span className="text-green-600 font-bold">الحل:</span> نوفر واجهة مخصصة تمنحك رقماً مرجعياً (`Case ID`) لمتابعة أي مشكلة وحلها جذرياً حتى النهاية.</p>
              </div>
            </div>
          </div>

          {/* القسم الثالث: الذكاء الاصطناعي وواتساب */}
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8 text-right">
            <h3 className="text-2xl font-bold text-[#0D0D21] mb-6">القسم الثالث: الذكاء الذي يفهمك</h3>
            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-[#6A11CB] mb-2">1. تحدث بلغتك، أرسل صوتاً أو  باركود</h4>
                <p className="text-[#0D0D21] text-sm">بدل 10 ضغطات لطلب منتج، قل ببساطة على واتساب "بدي كذا وكذا"، أرسل رسالة صوتية، أو  باركود المنتج، والمساعد يضيفه لسلتك فوراً.</p>
              </div>
              <div>
                <h4 className="font-bold text-[#6A11CB] mb-2">2. قاعدة عدم التأليف والسيطرة المالية</h4>
                <p className="text-[#0D0D21] text-sm">أهم قاعدة: المساعد ممنوع منعاً باتاً من اختراع منتج أو سعر، وكل البيانات تصله حصرياً من متاجرنا الحقيقية. كما أن كلمات مثل "تمام" لا تعني شراءً؛ يجب قول "تأكيد الطلب" صراحة، فالذكاء يتكلم والكود وحده يملك السلطة المالية.</p>
              </div>
              <div>
                <h4 className="font-bold text-[#6A11CB] mb-2">3. ذاكرة شخصية ولهجة طبيعية</h4>
                <p className="text-[#0D0D21] text-sm">البوت يتذكر آخر طلباتك ويتحدث بلهجة محلية طبيعية ودافئة، ويسألك بلطف "نفس طلب المرة الماضية؟" بدل الترحيب الآلي الممل.</p>
              </div>
            </div>
          </div>

          {/* الخاتمة والتوسع المستقبلي */}
          <div className="bg-gradient-to-l from-[#6A11CB] to-[#FF4E9A] rounded-3xl shadow-lg p-8 text-center text-white">
            <h3 className="text-2xl font-bold mb-3">رؤية أبعد من التسوق: "الشخص الثاني" في حياتك</h3>
            <p className="leading-relaxed">
              MD-Marketplace ليست مجرد منصة لبيع السلع، وليست كبسة زر عادية، بل هي بنية تحتية متكاملة قابلة للتوسع اللامتناهي — امتدت لتشمل المتاجر، وقريباً تتوسع نحو قطاعات النقل واللوجستيات والتاكسي لتكون معك في كل تفصيلة من يومك بكل ثقة وأمان.
              <br /><br />
              <strong>افتح الموقع، ابدأ المحادثة على واتساب، واترك الباقي للمنظومة... لأن الحياة أصبحت أسهل بكثير.</strong>
            </p>
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
