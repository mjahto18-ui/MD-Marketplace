import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export const metadata = {
  title: 'سياسة الخصوصية - MD Marketplace',
  description: 'كيف نحمي بياناتك في MD Marketplace'
}

export default function PrivacyPage() {
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
          سياسة الخصوصية
        </h1>
        
        <div className="space-y-8 text-white/80 leading-relaxed">
          <p className="text-sm text-purple-300">آخر تحديث: 7 تموز 2026</p>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. البيانات اللي منجمعها</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>الاسم، رقم الهاتف، المنطقة، العنوان</li>
              <li>الموقع الجغرافي وقت التسجيل فقط</li>
              <li>معلومات الجهاز والمتصفح</li>
              <li>سجل الطلبات</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. كيف منستخدم بياناتك</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>توصيل طلباتك</li>
              <li>التواصل معك بخصوص طلباتك</li>
              <li>تحسين خدماتنا</li>
              <li>تطبيق ميزة Wish لضمان حقك</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. مشاركة البيانات</h2>
            <p><strong>ما منبيع بياناتك ابداً.</strong> منشاركها بس مع التاجر والسائق لتوصيل الطلب.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. حقوقك</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>بتقدر تطلب نسخة من بياناتك</li>
              <li>بتقدر تحذف حسابك بأي وقت</li>
              <li>بتقدر ترفض الموقع الجغرافي</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. التواصل</h2>
            <p>واتساب: 9613177653</p>
          </section>
        </div>
      </div>
    </div>
  )
}
