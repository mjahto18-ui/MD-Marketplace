import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export const metadata = {
  title: 'الشروط والاحكام - MD Marketplace',
  description: 'شروط استخدام منصة MD Marketplace'
}

export default function TermsPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-[#0D0D21] text-white">
      {/* زر الرجوع - هون بتزيده */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <Link 
          href="/about"
          className="inline-flex items-center gap-2 text-purple-300 hover:text-white text-sm transition"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          العودة
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
            <p>MD Marketplace وسيط فقط بين الزبائن والتجار. ما منبيع المنتجات مباشرة.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. الدفع عند الاستلام</h2>
            <p><strong>الدفع عند الاستلام فقط</strong> - ما في دفع اونلاين حالياً.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. ميزة Wish</h2>
            <div className="bg-gradient-to-r from-[#6A11CB]/20 to-[#FF4E9A]/20 border border-[#FF4E9A]/30 rounded-xl p-6">
              <p className="font-bold text-white mb-3">Wish بتحميك:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>اذا دفعت وما استلمت → منرجعلك فلوسك</li>
                <li>اذا المنتج مختلف او مضروب → بترجعه</li>
                <li>كل الشكاوي بتتعالج خلال 48 ساعة</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. التوصيل</h2>
            <p><strong>الك 5 توصيلات مجانية</strong> اول ما تسجل للطلبات حتى 10 كغ.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. الارجاع</h2>
            <p>بتقدر ترجع المنتج خلال 24 ساعة اذا فيه عيب او مختلف عن الوصف.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. التواصل</h2>
            <p>واتساب: 9613177653</p>
          </section>
        </div>
      </div>
    </div>
  )
}
