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

      <div className="relative flex-1 bg-gradient-to-br from-[#1e1b4b] via-[#221a5e] to-[#2d1b69] flex flex-col items-center justify-center px-5 py-10 md:py-20 text-center overflow-hidden">
        <div className="absolute w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="relative mb-6 md:mb-8 bg-white p-3 md:p-4 rounded-[24px] md:rounded-[32px] shadow-[0_0_50px_rgba(168,85,247,0.5)]">
          <Image src="/icon.png" alt="MD Logo" width={120} height={120} className="w-[72px] h-[72px] md:w-[120px] md:h-[120px] object-contain" />
        </div>
        <h1 className="relative text-[26px] leading-[1.1] md:text-7xl font-black text-white max-w-4xl">
          Everything You Need<br/>
          <span className="bg-gradient-to-r from-purple-300 to-pink-400 bg-clip-text text-transparent">In One Place</span>
        </h1>
        <p className="relative text-white/50 mt-4 md:mt-5 text-[12.5px] md:text-[16px] max-w-[320px] md:max-w-md leading-relaxed">
          Discover products from multiple stores. Shop from your favorite local stores in one checkout.
        </p>
        <Link href="/shop" className="relative mt-6 md:mt-8 bg-gradient-to-br from-purple-500 to-pink-500 text-white px-7 md:px-8 py-3 md:py-3.5 rounded-full font-bold flex items-center gap-2 text-[13px] md:text-[14px] shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:scale-105 active:scale-95 transition">
          Start Shopping <ArrowRight size={18}/>
        </Link>
      </div>

      <div className="bg-white w-full" dir="rtl">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-12 md:py-20">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-[22px] md:text-4xl font-black text-[#13113a]">كل شي بدك ياه بمكان واحد</h2>
            <p className="text-gray-500 text-[13px] md:text-sm mt-3">اختار من متاجرنا المحلية</p>
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
              </div>
            ))}
          </div>
        </div>

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
              <h3 className="font-black mb-5 text-[#13113a]">تابعنا على</h3>
              <div className="flex flex-col gap-3">
                {/* Facebook */}
                <a href={SITE.social.facebook} target="_blank" className="flex items-center gap-3 group">
                  <div className="w-9 h-9 bg-[#1877F2] rounded-full flex items-center justify-center text-white group-hover:scale-110 transition">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </div>
                  <span className="text-[13px] font-bold text-gray-700 group-hover:text-[#1877F2]">Facebook</span>
                </a>
                {/* TikTok */}
                <a href={SITE.social.tiktok} target="_blank" className="flex items-center gap-3 group">
                  <div className="w-9 h-9 bg-black rounded-full flex items-center justify-center text-white group-hover:scale-110 transition">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                  </div>
                  <span className="text-[13px] font-bold text-gray-700 group-hover:text-black">TikTok</span>
                </a>
                {/* YouTube */}
                <a href={SITE.social.youtube} target="_blank" className="flex items-center gap-3 group">
                  <div className="w-9 h-9 bg-[#FF0000] rounded-full flex items-center justify-center text-white group-hover:scale-110 transition">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  </div>
                  <span className="text-[13px] font-bold text-gray-700 group-hover:text-[#FF0000]">YouTube</span>
                </a>
              </div>
              <p className="text-gray-400 text-[11px] mt-5">www.md-marketplace.store</p>
            </div>
          </div>
          <div className="text-center py-6 border-t border-gray-50 text-gray-400 text-[11px]">© 2020-2026 MD Marketplace - جميع الحقوق محفوظة</div>
        </div>
      </div>
    </div>
  );
}
