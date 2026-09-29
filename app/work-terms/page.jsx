import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: "شروط العمل - للطاقم فقط | MD-Marketplace",
  description: "شروط العمل الخاصة بالتجار والسائقين والإدارة في MD-Marketplace: نادي رقمي خاص مغلق، التزامات التاجر، مسؤوليات السائق المستقل، سرية بيانات العملاء.",
  keywords: ["شروط العمل MD Marketplace", "شروط التاجر", "شروط السائق", "نادي خاص"],
  openGraph: {
    title: "شروط العمل - MD-Marketplace",
    description: "شروط خاصة بالطاقم: تاجر، سائق، أدمن - نادي خاص مغلق",
    url: "https://www.md-marketplace.store/work-terms",
    siteName: "MD-Marketplace",
    locale: "ar_LB",
    type: "website",
  },
  alternates: {
    canonical: "https://www.md-marketplace.store/work-terms",
  },
  robots: { index: true, follow: true },
};

function BackToApproval() {
  return (
    <Link href="/admin/terms-approval" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition text-sm">
      <span className="text-lg">←</span> العودة للموافقة
    </Link>
  )
}

export default function WorkTermsPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-[#0D0D21] text-white">

      <div className="max-w-4xl mx-auto px-4 pt-6">
        <BackToApproval />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">

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

        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[#6A11CB] to-[#FF4E9A] bg-clip-text text-transparent text-center">
          شروط العمل
        </h1>
        <p className="text-center text-purple-300 text-sm mb-2">خاصة بفريق العمل فقط -صاحب متجر، سائق، مسؤول، محاسب</p>
        <p className="text-sm text-purple-300 text-center mb-8">آخر تحديث: 27 أيار 2026</p>

        <div className="space-y-8 text-white/80 leading-relaxed">

          <section className="bg-[#1A1A33] border border-purple-500/20 rounded-xl p-6">
            <p className="text-white/80">
              هذه الصفحة تكمل صفحة الشروط والأحكام وسياسة الخصوصية، وهي مخصصة حصراً لأعضاء فريق العمل داخل النادي الرقمي الخاص المغلق. .
            </p>
          </section>

          {/* 1 - التاجر */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. شروط خاصة باصحاب المتاجر</h2>
            <ul className="list-disc list-inside space-y-3">
              <li>يحذر تخزين البضاعة باسم المنصة - البضاعة تبقى ملكك وفي حيازتك حتى تسليمها للعميل النهائي.</li>
              <li>يلتزم بأن كل دفعة من المنصة يجب أن ترفق بإيصال باسم المتجر يوضح تفاصيل المبلغ.</li>
              <li>يحذر بيع منتجات منتهية الصلاحية أو مخالفة لشروط وزارة الصحة والسلامة الغذائية.</li>
              <li>يلتزم بتوفير المنتج بنفس السعر والصورة والوصف المعروض على المنصة، وتحديث المخزون بشكل يومي.</li>
             
            </ul>
          </section>

          {/* 2 - السائق */}
          <section className="bg-yellow-950/20 border border-yellow-500/30 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">2. شروط خاصة بالسائق - عضو ناقل مستقل</h2>
            <ul className="list-disc list-inside space-y-3 text-white/90">
              <li>يقر بأنك <strong>عضو ناقل مستقل Independent Contractor ولست موظفاً</strong> لدى MD-Marketplace ولا تخضع لقانون العمل.</li>
              <li><strong>أي طلب خارج صلاحيات النادي المغلق تقع المسؤولية الكاملة عليك</strong> أمام القانون والجهات المختصة، والمنصة غير مسؤولة عنه.</li>
              <li>يلتزم بأن كل رحلة أو توصيلة هي اتفاق مباشر بين عضوين مستقلين داخل النادي - المنصة وسيط تقني فقط وليست طرفاً في العقد.</li>
              <li>يحذر فتح أو استعمال أو تصوير محتوى الطلبات - الطلب أمانة من الاستلام حتى التسليم.</li>
          
              <li>يلتزم بالموافقة على تتبع الموقع الحي GPS كل 4 ثواني <strong>أثناء الرحلة النشطة فقط</strong> وخدمة SOS للسلامة، ويتوقف التتبع تلقائياً عند انتهاء الرحلة.</li>
              <li>يحذر العمل برخصة سوق أو دفتر سيارة أو تأمين إلزامي منتهي الصلاحية.</li>
              <li>لا يتم تفعيل الحساب إلا بعد رفع: هوية، رخصة سوق، دفتر سيارة، تأمين ساري، صورة السيارة ولوحتها، وسيلفي مع الهوية.</li>
            </ul>
          </section>

          {/* 3 - الموظفون */}
          <section className="bg-red-950/30 border border-red-500/40 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">3. شروط خاصة بالإدارة والمحاسبة</h2>
            <ul className="list-disc list-inside space-y-3 text-white/90">
              <li>يحذر منعاً باتاً نسخ أو تصدير Export أو تحميل أو تصوير أو إرسال بيانات العملاء (أسماء، أرقام، عناوين، مواقع) عبر أي وسيلة بما فيها واتساب أو إيميل.</li>
              <li>يحذر الاحتفاظ ببيانات العملاء بعد انتهاء الدوام أو على جهاز شخصي أو سحابي خاص.</li>
              <li>يلتزم بالسرية التامة وعدم استخدام بيانات المنصة أو أفكارها لتأسيس مشروع مشابه.</li>
              <li>يحذر التواصل مع عملاء أو موردين أو سائقين تعرف عليهم عبر المنصة للتعامل معهم بمعزل عن المنصة (التفاف).</li>
              <li>يحذر استقطاب أو توظيف أي موظف أو سائق يعمل في المنصة.</li>
              <li>يلتزم عند انتهاء العلاقة لأي سبب بإعادة وحذف جميع الملفات والنسخ خلال 24 ساعة كحد أقصى وتقديم إقرار خطي بالحذف.</li>
              <li>سجل التدقيق المالي غير قابل للحذف - Immutable Ledger لأسباب محاسبية وقانونية.</li>
            </ul>
          </section>

          <section className="bg-[#1A1A33] border border-purple-500/20 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-3">4. أحكام عامة للطاقم</h2>
            <ul className="list-disc list-inside space-y-2 text-white/80">
              <li>المنصة نادي رقمي خاص مغلق Private Digital Club - الخدمات بين أعضاء موثقين بـ User ID نشط فقط.</li>
              <li>المنصة لا تملك أسطول نقل ولا نمر حمراء ولا تشغل سيارات أجرة عمومية.</li>
              <li>يخضع هذا الاتفاق للقانون اللبناني - المحاكم المختصة في طرابلس.</li>
              <li className="font-bold text-white pt-2">أي مخالفة ملموسة لهذه الشروط، للمنصة الصلاحية التامة بتجميد رصيدك وإيقاف خدماتك لحين البت بالأمر.</li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  )
}
