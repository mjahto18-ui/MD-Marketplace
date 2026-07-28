"use client";
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen gradient-bg flex flex-col overflow-hidden">
      {/* NAVBAR */}
      <div className="flex justify-between items-start p-4 md:p-6">
        <div className="flex flex-col">
          <h1 className="text-white font-black tracking-wider text-[13px] md:text-sm">MD-MARKETPLACE</h1>
          <p className="text-white/40 text-[10px] md:text-xs mt-0.5 tracking-wide">One App For Everything</p>
        </div>
        <div className="flex gap-2">
          <Link href="/shop" className="bg-white text-black px-5 py-2 rounded-full text-sm font-black hover:bg-white/90 transition">Shop</Link>
          <Link href="/login" className="glass border border-white/10 text-white/70 px-5 py-2 rounded-full text-sm font-bold">Login</Link>
        </div>
      </div>

      {/* HERO - بالنص تماما */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center -mt-10 md:-mt-20">

        {/* الصورة الجديدة بالنص */}
        <div className="mb-8 bg-white p-4 rounded-[32px] shadow-[0_0_40px_rgba(168,85,247,0.6)]">
          <Image
            src="/icon.png"
            alt="MD Logo"
            width={120}
            height={120}
            
          />
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

      {/* FOOTER - رجعتو */}
      <div className="text-center py-6 text-white/20 text-[11px] tracking-widest">
        ©️ 2020 MD Marketplace - All Rights Reserved
      </div>
    </div>
  );
}
