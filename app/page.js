"use client";
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

const SITE = {
  phone: "+966551653968",
  emails: {
    support: "support@md-marketplace.store",
    info: "info@md-marketplace.store",
  },
  address: "طرابلس، لبنان - القبة",
  social: {
    facebook: "https://facebook.com/mdmarketplaceofficial",
    tiktok: "https://tiktok.com/@mdmarketplace.store",
    youtube: "https://youtube.com/@md-marketplace",
  },
  links: {
    privacy: "/privacy",
    terms: "/terms",
  },
  gallery: [
    { title: "متاجرنا المحلية", desc: "أكثر من 43 متجر" },
    { title: "منتجات متنوعة", desc: "من الأكل للتياب" },
    { title: "توصيل سريع", desc: "خلال 25 دقيقة" },
    { title: "عروض يومية", desc: "خصومات حصرية" },
    { title: "دفع آمن", desc: "عند الاستلام" },
    { title: "دعم متواصل", desc: "24/7 جاهزين" },
  ]
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0f0e24]">
      {/* NAVBAR - ارتفاع ثابت ما بفوت ببعضو */}
      <div className="h-[68px] md:h-[80px] flex justify-between items-center px-5 md:px-8 bg-[#13113a] shrink-0 z-20">
        <div className="flex flex-col">
          <h1 className="text-white font-black tracking-wider text-[13px] md:text-[14px]">MD-MARKETPLACE</h1>
          <p className="text-white/40 text-[10px] md:text-[11px] mt-0.5">One App For Everything</p>
        </div>
        <div className="flex gap-2 md:gap-3">
          <Link href="/shop" className="bg-white text-black px-5 md:px-6 py-2 md:py-2.5 rounded-full text-[13px] md:text-sm font-black hover:bg-white/90 transition">Shop</Link>
          <Link href="/login" className="border border-white/15 text-white/70 px-5 md:px-6 py-2 md:py-2.5 rounded-full text-[13px] md:text-sm font-bold hover:bg-white/10 transition">Login</Link>
        </div>
      </div>

      {/* HERO - مصلح للموبايل 100% */}
      <div className="relative flex-1 bg-gradient-to-br from-[#1e1b4b] via-[#221a5e] to-[#2d1b69] flex flex-col items-center justify-center px-5 py-10 md:py-20 text-center overflow-hidden">
        {/* Glow background */}
        <div className="absolute w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        
        <div className="relative mb-6 md:mb-8 bg-white p-3 md:p-4 rounded-[24px] md:rounded-[32px] shadow-[0_0_50px_rgba(168,85,247,0.5)]">
          <Image src="/icon.png" alt="MD Logo" width={120} height={120} className="w-[72px] h-[72px] md:w-[120px] md:h-[120px] object-contain" />
        </div>

        <h1 className="relative text-[26px] leading-[1.1] md:text-7xl font-black text-white max-w-4xl">
          Everything You Need<br/>
          <span className="bg-gradient-to-r from-purple-300 to-pink-400 bg-clip-text text-transparent">
            In One Place
          </span>
        </h1>

        <p className="relative text-white/50 mt-4 md:mt-5 text-[12.5px] md:text-[16px] max-w-[320px] md:max-w-md leading-relaxed">
          Discover products from multiple stores. Shop from your favorite local stores in one checkout.
        </p>

        <Link
          href="/shop"
          className="relative mt-6 md:mt-8 bg-gradient-to-br from-purple-500 to-pink-500 text-white px-7 md:px-8 py-3 md:py-3.5 rounded-full font-bold flex items-center gap-2 text-[13px] md:text-[14px] shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:scale-105 active:scale-95 transition"
        >
          Start Shopping <ArrowRight size={18}/>
        </Link>
      </div>

      {/* قسم الصور - هون بتنزل صورك */}
      <div className="bg-white w-full" dir="rtl">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-12 md:py-20">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-[22px] md:text-4xl font-black text-[#13113a]">كل شي بدك ياه بمكان واحد</h2>
            <p className="text-gray-500 text-[13px] md:text-sm mt-3">اختار من متاجرنا المحلية - انت بس بتحط صورك هون</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
            {SITE.gallery.map((item, i) => (
              <div key={i} className="group bg-[#f8f7fb] border border-gray-100 rounded-[20px] md:rounded-[28px] p-5 md:p-8 h-[150px] md:h-[200px] flex flex-col justify-between hover:bg-white hover:shadow-[0_10px_40px_rgba(0,0,0,0.06)] hover:border-purple-100 transition-all cursor-pointer">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition">
                  <span className="text-[18px]">🛍️</span>
                </div>
                <div>
                  <h3 className="font-black text-[13px] md:text-[15px] text-[#13113a]">{item.title}</h3>
                  <p className="text-[11px] md:text-xs text-gray-500 mt-1">{item.desc}</p>
                </div>
                {/* لما تجهز صورك: احذف اللي فوق وحط:
                <Image src={`/images/${i+1}.jpg`} fill className="object-cover rounded-[20px]" />
                */}
              </div>
            ))}
          </div>

          {/* مخفي - كيف بتحط الصور: روح على public/images/ ونزل صورك باسماء 1.jpg الى 6.jpg */}
          </div>

        {/* الفوتر - نفس الروابط */}
        <div className="border-t border-gray-100">
          <div className="max-w-6xl mx-auto px-5 md:px-8 py-12 md:py-16 grid md:grid-cols-3 gap-10 text-sm">
            <div>
              <h3 className="font-black mb-4 text-[#13113a]">تواصل معنا</h3>
              <p className="text-gray-600 mb-1">{SITE.phone}</p>
              <p className="text-gray-600 text-[13px]">{SITE.emails.support}</p>
              <p className="text-gray-600 text-[13px]">{SITE.emails.info}</p>
            </div>
            <div>
              <h3 className="font-black mb-4 text-[#13113a]">عنواننا</h3>
              <p className="text-gray-600 leading-relaxed text-[13px]">{SITE.address}<br/>نخدم كل لبنان من عكار للجنوب</p>
              <div className="flex gap-4 mt-4 text-[12px]">
                <Link href={SITE.links.privacy} className="text-purple-600 font-bold hover:underline">سياسة الخصوصية</Link>
                <Link href={SITE.links.terms} className="text-purple-600 font-bold hover:underline">الشروط والأحكام</Link>
              </div>
            </div>
            <div>
              <h3 className="font-black mb-4 text-[#13113a]">تابعنا على</h3>
              <div className="flex flex-col gap-2.5">
                <a href={SITE.social.facebook} target="_blank" className="text-gray-600 hover:text-blue-600 text-[13px]">📘 فيسبوك - Facebook</a>
                <a href={SITE.social.tiktok} target="_blank" className="text-gray-600 hover:text-black text-[13px]">🎵 تيك توك - TikTok</a>
                <a href={SITE.social.youtube} target="_blank" className="text-gray-600 hover:text-red-600 text-[13px]">▶️ يوتيوب - YouTube</a>
              </div>
              <p className="text-gray-400 text-[11px] mt-4">www.md-marketplace.store</p>
            </div>
          </div>
          <div className="text-center py-6 border-t border-gray-50 text-gray-400 text-[11px]">© 2020-2026 MD Marketplace - جميع الحقوق محفوظة</div>
        </div>
      </div>
    </div>
  );
}
