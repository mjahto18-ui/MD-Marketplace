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
          <p className="text-lg text-[#6A11CB] font-semibold">عندما تفهم التجارة الإنسان — نادي خاص مغلق وليس شارع عشوائي</p>
        </div>

        <div className="max-w-4xl mx-auto">

          {/* المقدمة - محمية */}
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8 text-right">
            <h3 className="text-2xl font-bold text-[#6A11CB] mb-4">لماذا بُنيت هذه المنظومة؟ - نادي خاص مغلق</h3>
            <p className="text-[#0D0D21] leading-relaxed">
              العالم مليء بالتطبيقات والمتاجر الإلكترونية الكبرى، لكن الحقيقة المؤلمة أن معظمها صُمم لإرضاء النظام البرمجي وليس الإنسان. يضيع العميل بين مئات الأزرار والقوائم المعقدة لمجرد طلب سلع بسيطة. 
              في <strong>MD-Marketplace</strong>، لم نبنِ تطبيقاً تقليدياً آخر، بل أسسنا كياناً حياً ومستقلاً — <strong>نادي رقمي خاص مغلق Private Digital Club</strong> — بنيّة تحتية رقمية تزيح كل التعقيد خلف الكواليس لتلبي طلبك بلغتك وبأبسط طريقة ممكنة: <strong>"شو بدك، وكيف بدك ياه"</strong> - فقط بين أعضاء موثقين بـ User ID نشط، وليس للعامة في الشارع.
            </p>
          </div>

          {/* القسم الأول: الأمان الميداني */}
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8 text-right border-2 border-purple-200">
            <h3 className="text-2xl font-bold text-[#0D0D21] mb-6">القسم الأول: الأمان الميداني وسد ثغرات الشارع - حوكمة مغلقة</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-[#6A11CB] mb-2">1. ضبط فوضى "الدليفري العشوائي" - نادي موثق فقط</h4>
                <p className="text-[#0D0D21]/80 text-sm leading-relaxed"><span className="text-red-500 font-bold">المشكلة في الواقع:</span> في مناطق عديدة، يعاني السوق من الفوضى؛ أي شخص يمتلك دراجة نارية يضع رقمه في مجموعة أو تطبيق عشوائي ليصبح "سائق توصيل"، دون رقابة أو مرجعية تضمن حق العميل وأمان بيته.</p>
                <p className="text-[#0D0D21] text-sm leading-relaxed mt-1"><span className="text-green-600 font-bold">الحل عندنا - نادي مغلق:</span> العضو الناقل ليس مجرد رقم عشوائي على الشارع. كل عضو ناقل مسجل ببياناته الحقيقية وهويته ورخصة سوقه ودفتر سيارته وتأمينه الساري المرتبطة مباشرة بغرفة العمليات الحية بالمنصة وموثق بـ User ID. أنت لا تستقبل شخصاً مجهولاً، بل عضو كادر مسجل ضمن منظومة نادي خاص مغلق يمنع منعاً باتاً التقاط ركاب من الشارع - فقط عبر طلب موثق داخل التطبيق. المنصة وسيط تقني فقط والعضو الناقل مستقل يتحمل مسؤولية قانونية سيارته وحده.</p>
              </div>
              <div>
                <h4 className="font-bold text-[#6A11CB] mb-2">2. هندسة الأمان وحماية السلال والحسابات</h4>
                <p className="text-[#0D0D21]/80 text-sm"><span className="text-red-500 font-bold">المشكلة:</span> اختراق الحسابات والتلاعب بسلال المشتريات.</p>
                <p className="text-[#0D0D21] text-sm mt-1"><span className="text-green-600 font-bold">الحل:</span> لقد أغلقنا كل ثغرة يدوياً؛ حسابك يقفل تلقائياً بعد أي محاولة دخول مشبوهة، وسلتك معزولة تماماً بحيث يستحيل على أي شخص العبث بها غيرك. بصمة جهاز Canvas + QR متغير كل 5 دقائق لمكافحة الاحتيال.</p>
              </div>
            </div>
          </div>

          {/* القسم الثاني: رحلة الطلب والتجربة */}
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8 text-right">
            <h3 className="text-2xl font-bold text-[#0D0D21] mb-6">القسم الثاني: رحلة الطلب الذكية داخل النادي المغلق</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-[#6A11CB] mb-2">1. منتج بهوية ومكان وحالة تشغيلية حقيقية</h4>
                <p className="text-[#0D0D21]/80 text-sm leading-relaxed"><span className="text-red-500 font-bold">المشكلة التقليدية:</span> تطلب منتجاً من منصة عادية لتكتشف لاحقاً أن المتجر مغلق أو نفدت الكمية.</p>
                <p className="text-[#0D0D21] text-sm leading-relaxed mt-1"><span className="text-green-600 font-bold">الحل عندنا:</span> على موقعنا كل منتج مرتبط فوراً بالحالة التشغيلية الحقيقية للمتجر الموثق داخل النادي (فتح/إغلاق) والكمية المتاحة، لتعرف تماماً أن طلبك جاهز قبل أن تطلبه.</p>
              </div>
              <div>
                <h4 className="font-bold text-[#6A11CB] mb-2">2. السلة الذكية والتوصيل المنظم بين عضوين</h4>
                <p className="text-[#0D0D21]/80 text-sm"><span className="text-red-500 font-bold">المشكلة:</span> تضيف نفس السلعة مرتين فتتكرر كعنصرين منفصلين، وتفاجأ برسوم توصيل مبهمة.</p>
                <p className="text-[#0D0D21] text-sm mt-1"><span className="text-green-600 font-bold">الحل:</span> سلتك ذكية ومتزامنة داخل النادي المغلق؛ إذا أضفت نفس المنتج تزداد كميته تلقائياً بدل تكراره، ومحفوظة حتى لو انشغلت ورجعت، ورسوم التنسيق محسوبة بعدالة بناءً على الوزن الحقيقي والمسافة بين عضوين موثقين فقط.</p>
              </div>
              <div>
                <h4 className="font-bold text-[#6A11CB] mb-2">3. عنوانك نقطة دقيقة على الخريطة - مشاركة آمنة تنتهي</h4>
                <p className="text-[#0D0D21]/80 text-sm"><span className="text-red-500 font-bold">المشكلة:</span> بقاء العضو الناقل ضائعاً يسألك على الهاتف "يمين أو شمال؟".</p>
                <p className="text-[#0D0D21] text-sm mt-1"><span className="text-green-600 font-bold">الحل:</span> عنوانك نقطة جغرافية دقيقة على الخريطة يحفظها النظام بكبسة زر واحدة لكي يراها العضو الناقل الموثق فوراً دون أي ضياع. رابط مشاركة الرحلة الآمن ينتهي تلقائياً عند Complete - لا تتبع بعد الرحلة.</p>
              </div>
              <div>
                <h4 className="font-bold text-[#6A11CB] mb-2">4. نضمن حقك داخل النادي</h4>
                <p className="text-[#0D0D21]/80 text-sm"><span className="text-red-500 font-bold">المشكلة:</span> ضياع حقوق العميل عند حدوث أي خطأ دون مرجعية تتابعه.</p>
                <p className="text-[#0D0D21] text-sm mt-1"><span className="text-green-600 font-bold">الحل:</span> نوفر واجهة مخصصة لأعضاء النادي تمنحك رقماً مرجعياً (Case ID) لمتابعة أي مشكلة وحلها جذرياً حتى النهاية - خدمة حماية المستخدم خلال 12 ساعة.</p>
              </div>
            </div>
          </div>

          {/* القسم الثالث: الذكاء الاصطناعي وواتساب */}
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8 text-right">
            <h3 className="text-2xl font-bold text-[#0D0D21] mb-6">القسم الثالث: الذكاء الذي يفهمك - وسيط فقط</h3>
            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-[#6A11CB] mb-2">1. تحدث بلغتك، أرسل صوتاً أو باركود - داخل النادي</h4>
                <p className="text-[#0D0D21] text-sm">بدل 10 ضغطات لطلب منتج، كعضو موثق بـ User ID قل ببساطة على واتساب "بدي كذا وكذا"، أرسل رسالة صوتية، أو باركود المنتج، والمساعد يضيفه لسلتك فوراً - فقط للأعضاء داخل النادي المغلق.</p>
              </div>
              <div>
                <h4 className="font-bold text-[#6A11CB] mb-2">2. قاعدة عدم التأليف والسيطرة المالية - وسيط تقني</h4>
                <p className="text-[#0D0D21] text-sm">أهم قاعدة: المساعد ممنوع منعاً باتاً من اختراع منتج أو سعر، وكل البيانات تصله حصرياً من متاجرنا الحقيقية الموثقة داخل النادي. كما أن كلمات مثل "تمام" لا تعني شراءً؛ يجب قول "تأكيد الطلب" صراحة، فالذكاء يتكلم والكود وحده يملك السلطة المالية. المنصة وسيط عرض فقط.</p>
              </div>
              <div>
                <h4 className="font-bold text-[#6A11CB] mb-2">3. ذاكرة شخصية ولهجة طبيعية</h4>
                <p className="text-[#0D0D21] text-sm">البوت يتذكر آخر طلباتك كعضو في النادي ويتحدث بلهجة محلية طبيعية ودافئة، ويسألك بلطف "نفس طلب المرة الماضية؟" بدل الترحيب الآلي الممل.</p>
              </div>
            </div>
          </div>

          {/* الخاتمة والتوسع المستقبلي - محمية قانونيا */}
          <div className="bg-gradient-to-l from-[#6A11CB] to-[#FF4E9A] rounded-3xl shadow-lg p-8 text-center text-white">
            <h3 className="text-2xl font-bold mb-3">رؤية أبعد من التسوق: نادي خاص يخدمك</h3>
            <p className="leading-relaxed">
              MD-Marketplace ليست مجرد منصة لبيع السلع، وليست كبسة زر عادية، بل هي بنية تحتية لنادي رقمي خاص مغلق Private Digital Club قابلة للتوسع اللامتناهي — امتدت لتشمل المتاجر الموثقة، وقريباً تتوسع نحو تنسيق توصيلات ورحلات خاصة بين أعضاء موثقين بـ User ID داخل النادي المغلق فقط (وليست خدمة نقل عامة عشوائية في الشارع) لتكون معك في كل تفصيلة من يومك بكل ثقة وأمان كوسيط تقني فقط.
              <br /><br />
              <strong>افتح الموقع كعضو موثق، ابدأ المحادثة على واتساب، واترك الباقي للمنظومة المغلقة... لأن الحياة أصبحت أسهل بكثير داخل عائلتنا الرقمية.</strong>
            </p>
          </div>

        </div>

        <div className="border-t border-purple-200 pt-8 mt-12">
          <div className="flex items-center justify-center gap-6 text-sm">
            <Link href="/about" className="text-[#6A11CB] hover:text-[#FF4E9A] font-medium">من نحن - نادي خاص مغلق</Link>
            <span className="text-[#6A11CB]/30">|</span>
            <Link href="/privacy" className="text-[#6A11CB] hover:text-[#FF4E9A] font-medium">الخصوصية</Link>
            <span className="text-[#6A11CB]/30">|</span>
            <Link href="/terms" className="text-[#6A11CB] hover:text-[#FF4E9A] font-medium">الشروط - حوكمة مغلقة</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
