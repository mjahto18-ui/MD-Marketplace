"use client";
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

// ===== عدل معلوماتك هون فقط =====
const SITE = {
  phone: "+966 55 1653 968", // حط رقمك
  emails: {
    support: "support@md-marketplace.store",
    info: "info@md-marketplace.store",
  },
  address: "طرابلس، لبنان ",
  social: {
    facebook: "https://facebook.com/mdmarketplaceofficial",
    tiktok: "https://tiktok.com/@mdmarketplace.store",
    youtube: "https://youtube.com/@md-marketplace",
  },
  links: {
    privacy: "/privacy", // غير الرابط اذا بدك
    terms: "/terms",
    about: "/about",
  }
};
// ================================

export default function HomePage() {
  return (
    <div className="min-h-screen gradient-bg flex flex-col overflow-hidden">
      {/* NAVBAR - نفس الروابط */}
      <div className="flex justify-between items-start p-4 md:p-6">
        <div className="flex flex-col">
          <h1 className="text-white font-black tracking-wider text-[13px] md:text-sm">MD-MARKETPLACE</h1>
          <p className="text-white/40 text-[10px] md:text-xs mt-0.5 tracking-wide">One App For Everything</p>
        </div>
        <div className="flex gap-2">
          <Link href="/shop" className="bg-white text-black px-5 py-2 rounded-full text-sm font-black hover:bg-white/90 transition">Shop</Link>
          <Link href="/login" className="glass border border-white/10 text-white/70 px-5 py-2 rounded-full text-sm font-bold hover:bg-white/10 transition">Login</Link>
        </div>
      </div>

      {/* HERO - مثل ما كان */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center -mt-10 md:-mt-20">
        <div className="mb-8 bg-white p-4 rounded-[32px] shadow-[0_0_40px_rgba(168,85,247,0.6)]">
          <Image src="/icon.png" alt="MD Logo" width={120} height={120} />
        </div>

        <h1 className="text-[32px] md:text-7xl font-black text-white leading-[1.05] max-w-4xl">
          Everything You Need<br/>
          <span className="bg-gradient-to-r from-purple-300 to-pink-400 bg-clip-text text-transparent">
            In One Place
          </span>
        </h1>

        <p className="text-white/50 mt-5 text-[12px] md:text-base max-w-md leading-relaxed">
          Discover products from multiple stores. Shop from your favorite local stores in one checkout.
        </p>

        <Link
          href="/shop"
          className="mt-8 bg-gradient-to-br from-purple-500 to-pink-500 text-white px-8 py-3.5 rounded-full font-bold flex items-center gap-2 text-[13px] md:text-[14px] shadow-[0_0_25px_rgba(168,85,247,0.5)] hover:scale-105 transition"
        >
          Start Shopping <ArrowRight size={18}/>
        </Link>
      </div>

      {/* INFO SECTION - عربي من تحت الشاشة الزرقاء */}
      <div className="bg-white w-full" dir="rtl">
        <div className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-10 text-sm">
          
          <div>
            <h3 className="font-black mb-4 text-[#13113a]">تواصل معنا</h3>
            <p className="text-gray-600 mb-1">{SITE.phone}</p>
            <p className="text-gray-600">{SITE.emails.support}</p>
            <p className="text-gray-600">{SITE.emails.info}</p>
          </div>

          <div>
            <h3 className="font-black mb-4 text-[#13113a]">عنواننا</h3>
            <p className="text-gray-600 leading-relaxed">{SITE.address}<br/>نخدم كل لبنان من عكار لصور</p>
            <div className="flex gap-4 mt-4 text-xs">
              <Link href={SITE.links.privacy} className="text-purple-600 hover:underline">سياسة الخصوصية</Link>
              <Link href={SITE.links.terms} className="text-purple-600 hover:underline">الشروط والأحكام</Link>
            </div>
          </div>

          <div>
            <h3 className="font-black mb-4 text-[#13113a]">تابعنا على</h3>
            <div className="flex flex-col gap-2">
              <a href={SITE.social.facebook} target="_blank" className="text-gray-600 hover:text-blue-600">📘 فيسبوك</a>
              <a href={SITE.social.tiktok} target="_blank" className="text-gray-600 hover:text-black">🎵 تيك توك</a>
              <a href={SITE.social.youtube} target="_blank" className="text-gray-600 hover:text-red-600">▶️ يوتيوب</a>
              <p className="text-gray-400 text-xs mt-3">www.md-marketplace.store</p>
            </div>
          </div>

        </div>

        <div className="text-center py-6 border-t text-gray-400 text-[11px] tracking-widest">
          © 2020-2026 MD Marketplace - جميع الحقوق محفوظة
        </div>
      </div>
    </div>
  );
}
