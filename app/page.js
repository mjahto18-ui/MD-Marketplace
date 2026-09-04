"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ShoppingBag,
  MapPin,
  Truck,
  ShieldCheck,
  Headphones,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const SITE = {
  emails: {
    sales: "sales@md-marketplace.store",
    support: "support@md-marketplace.store",
    info: "info@md-marketplace.store",
  },

  address: "طرابلس، لبنان - القبة",

  social: {
    facebook: "https://facebook.com/mdmarketplaceofficial",
    tiktok: "https://tiktok.com/@mdmarketplace.store",
    youtube: "https://youtube.com/@md-marketplace",
    x: "https://x.com/md_marketplace",
  },

  links: {
    privacy: "/privacy",
    terms: "/terms",
    aiGuide: "/ai-guide",
  },
};

export default function HomePage() {
  const router = useRouter();
  const [comingSoonMessage, setComingSoonMessage] = useState("");
  const [bannerVisible, setBannerVisible] = useState(false);

  /*
   * قراءة حالة المنصة والرسالة من Global Config
   */
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/global-config", {
          cache: "no-store",
        });

        if (!res.ok) return;

        const cfg = await res.json();

        const message =
          cfg?.coming_soon_message ||
          cfg?.platform_status_message ||
          "";

        const isComingSoon =
          cfg?.isComingSoon === true ||
          cfg?.platform_status?.value === "COMING_SOON";

        setComingSoonMessage(message);
        setBannerVisible(isComingSoon &&!!message);
      } catch (error) {
        console.error("Global config error:", error);
      }
    }

    loadConfig();

    // تسجيل اول ما تطلع الصفحة - مهمة لانها بتطلع مرة وحدة بس
    if (!sessionStorage.getItem("guest_logged")) {
      fetch("https://ipapi.co/json/")
       .then((r) => r.json())
       .then((geo) => {
          if (!geo.ip) return;
          return fetch("/api/log-guest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              "IP Adresse": geo.ip,
              city: geo.city,
              country: geo.country_name,
              lat: geo.latitude,
              lng: geo.longitude,
              "Log Date": new Date().toISOString(),
              page: "home-view",
            }),
          });
        })
       .then(() => {
          sessionStorage.setItem("guest_logged", "1");
        })
       .catch(() => {});
    }
  }, []);

  const handleShopClick = async (e) => {
    e.preventDefault();

    if (!sessionStorage.getItem("guest_logged")) {
      try {
        const geo = await fetch("https://ipapi.co/json/").then((r) =>
          r.json()
        );

        if (geo.ip) {
          await fetch("/api/log-guest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              "IP Adresse": geo.ip,
              city: geo.city,
              country: geo.country_name,
              lat: geo.latitude,
              lng: geo.longitude,
              "Log Date": new Date().toISOString(),
              page: "home->shop",
            }),
          });

          sessionStorage.setItem("guest_logged", "1");
        }
      } catch {}
    }

    router.push("/shop");
  };

  const categories = [
    {
      title: "مطاعم وأكل",
      desc: "وجباتك المفضلة",
      image: "/home-food.webp",
    },
    {
      title: "سوبرماركت",
      desc: "كل حاجات البيت",
      image: "/home-market.webp",
    },
    {
      title: "ألبسة وأزياء",
      desc: "ستايلك بمكان واحد",
      image: "/home-fashion.webp",
    },
    {
      title: "حلويات",
      desc: "شي طيب لكل مناسبة",
      image: "/home-sweets.webp",
    },
    {
      title: "صيدليات",
      desc: "احتياجاتك الصحية",
      image: "/home-pharmacy.webp",
    },
    {
      title: "والمزيد...",
      desc: "اكتشف متاجرنا",
      image: "/home-more.webp",
    },
  ];

  const features = [
    {
      icon: <ShoppingBag size={24} />,
      title: "كل شي بمكان واحد",
      desc: "متاجر ومنتجات متنوعة",
    },
    {
      icon: <Truck size={24} />,
      title: "توصيل سريع",
      desc: "طلبك بيوصلك لباب البيت",
    },
    {
      icon: <ShieldCheck size={24} />,
      title: "دفع عند الاستلام",
      desc: "ادفع وقت تستلم طلبك",
    },
    {
      icon: <Headphones size={24} />,
      title: "دعم متواصل",
      desc: "نحنا حدك وقت تحتاجنا",
    },
  ];

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* =====================================================
    NAVBAR
===================================================== */}

      <nav className="absolute top-0 left-0 right-0 z-50 px-4 md:px-10 py-4 md:py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="text-white text-right shrink-0">
              <div className="font-black text- md:text- tracking-wide">
                MD-MARKETPLACE
              </div>

              <div className="text-white/50 text- md:text-xs mt-1">
                One App For Everything
              </div>
            </Link>

            {/* ================= DESKTOP NAV ================= */}

            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={handleShopClick}
                className="bg-white text-[#17144d] px-5 md:px-7 py-2.5 rounded-full font-black text-sm shadow-lg hover:scale-105 transition"
              >
                Shop
              </button>

              <Link
                href={SITE.links.aiGuide}
                className="border border-white/20 bg-white/5 backdrop-blur-md text-white px-5 md:px-7 py-2.5 rounded-full font-bold text-sm hover:bg-white/10 transition"
              >
                🤖 دليل AI
              </Link>

              <Link
                href="/login"
                className="border border-white/20 bg-white/5 backdrop-blur-md text-white px-5 md:px-7 py-2.5 rounded-full font-bold text-sm hover:bg-white/10 transition"
              >
                Login
              </Link>
            </div>

            {/* ================= MOBILE MENU ================= */}

            <details className="relative md:hidden">
              <summary
                className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md shadow-lg"
                aria-label="فتح القائمة"
              >
                <span className="text-xl leading-none">☰</span>
              </summary>

              <div className="absolute left-0 top-14 w-52 overflow-hidden rounded-2xl border border-white/10 bg-[#171442]/95 p-2 shadow-2xl backdrop-blur-xl">
                <button
                  onClick={handleShopClick}
                  className="block w-full text-left rounded-xl px-4 py-3 text-sm font-black text-white hover:bg-white/10"
                >
                  🛍 Shop
                </button>

                <Link
                  href={SITE.links.aiGuide}
                  className="block rounded-xl px-4 py-3 text-sm font-bold text-white hover:bg-white/10"
                >
                  🤖 دليل استخدام AI
                </Link>

                <Link
                  href="/login"
                  className="block rounded-xl px-4 py-3 text-sm font-bold text-white hover:bg-white/10"
                >
                  🔐 Login
                </Link>
              </div>
            </details>
          </div>
        </div>
      </nav>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative min-h- md:min-h- bg-gradient-to-br from-[#171442] via-[#21185b] to-[#32166c] flex flex-col items-center justify-center px-5 pt-28 pb-16 text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute w- h- bg-purple-600/20 rounded-full blur- top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        <div className="absolute w- h- bg-pink-500/10 rounded-full blur- top-20 right-0 pointer-events-none" />

        {/* =================================================
            COMING SOON BANNER
        ================================================= */}

        {bannerVisible && comingSoonMessage && (
          <div className="relative w-full max-w-3xl mb-8 overflow-hidden rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl shadow-[0_0_35px_rgba(168,85,247,0.25)]">
            <div className="flex items-center min-h-">
              {/* ثابت صغير */}
              <div className="relative z-10 shrink-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-3 font-black text- md:text-xs">
                أحدث العروض
              </div>

              {/* النص المتحرك */}
              <div className="relative flex-1 overflow-hidden whitespace-nowrap">
                <div className="coming-soon-marquee inline-block text-white font-bold text- md:text-sm">
                  {comingSoonMessage}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Logo */}
        <div className="relative mb-7 md:mb-9 bg-white p-3 md:p-4 rounded- md:rounded- shadow-[0_0_55px_rgba(168,85,247,0.55)]">
          <Image
            src="/icon.png"
            alt="MD Marketplace"
            width={120}
            height={120}
            priority
            className="w- h- md:w- md:h- object-contain"
          />
        </div>

        {/* Main title */}
        <h1 className="relative text- md:text-7xl font-black text-white leading-[1.05] max-w-5xl">
          Everything You Need
          <br />
          <span className="bg-gradient-to-r from-purple-300 via-pink-400 to-purple-300 bg-clip-text text-transparent">
            In One Place
          </span>
        </h1>

        <p className="relative text-white/55 mt-5 text- md:text- max-w-xl leading-relaxed">
          Discover products from multiple local stores.
          <br className="hidden md:block" />
          Shop your favorite stores in one simple checkout.
        </p>

        {/* Shop button */}
        <button
          onClick={handleShopClick}
          className="relative mt-8 bg-gradient-to-br from-purple-500 to-pink-500 text-white px-8 md:px-10 py-4 rounded-full font-black flex items-center gap-3 text- md:text-base shadow-[0_0_35px_rgba(168,85,247,0.45)] hover:scale-105 active:scale-95 transition"
        >
          Start Shopping
          <ArrowRight size={19} />
        </button>

        {/* Small trust line */}
        <div className="relative mt-6 flex items-center gap-2 text-white/35 text-">
          <MapPin size={14} />
          <span>من متاجرنا المحلية إلى باب بيتك</span>
        </div>
      </section>

      {/* =====================================================
          FEATURES
      ===================================================== */}

      <section className="relative bg-white py-10 md:py-14 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
            {features.map((feature, i) => (
              <div
                key={i}
                className="rounded-2xl md:rounded-3xl bg-[#faf9fd] border border-gray-100 p-5 md:p-7 text-center hover:bg-white hover:shadow-[0_12px_35px_rgba(0,0,0,0.06)] transition"
              >
                <div className="mx-auto mb-4 w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center">
                  {feature.icon}
                </div>

                <h3 className="font-black text-[#17144d] text- md:text-">
                  {feature.title}
                </h3>

                <p className="text-gray-500 text- md:text-xs mt-2">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          CATEGORIES
      ===================================================== */}

      <section className="bg-white py-14 md:py-20" dir="rtl">
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <div className="text-center mb-9 md:mb-12">
            <div className="inline-block bg-purple-50 text-purple-600 px-4 py-2 rounded-full text- font-black mb-4">
              MD-MARKETPLACE
            </div>

            <h2 className="text- md:text-4xl font-black text-[#13113a]">
              كل شي بدك ياه بمكان واحد
            </h2>

            <p className="text-gray-500 text- md:text-sm mt-3">
              اكتشف مجموعة متنوعة من المتاجر والمنتجات
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {categories.map((category, i) => (
              <button
                key={i}
                onClick={handleShopClick}
                className="group relative h- md:h- rounded- md:rounded- overflow-hidden shadow-sm hover:shadow-2xl transition-all text-left"
              >
                <Image
                  src={category.image}
                  alt={category.title}
                  fill
                  className="object-cover group-hover:scale-110 transition duration-700"
                />
              </button>
            ))}
          </div>

          <div className="text-center mt-9">
            <button
              onClick={handleShopClick}
              className="inline-flex items-center gap-2 bg-[#17144d] text-white px-7 py-3 rounded-full font-black text- hover:bg-purple-700 transition"
            >
              اكتشف كل المتاجر
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================
          BRAND / DELIVERY IMAGE
      ===================================================== */}

      <section className="bg-[#f7f5fb] py-12 md:py-20">
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <div className="relative overflow-hidden rounded- md:rounded- shadow-xl">
            <Image
              src="/home-delivery.webp"
              alt="MD Marketplace Delivery"
              width={1400}
              height={800}
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="bg-[#121033] text-white" dir="rtl">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-12 md:py-16">
          <div className="grid md:grid-cols-3 gap-10">
            {/* Contact */}
            <div>
              <h3 className="font-black mb-5">تواصل معنا</h3>

              <a
                href={`mailto:${SITE.emails.sales}`}
                className="block text-white/60 text-sm mb-2 hover:text-white"
              >
                {SITE.emails.sales}
              </a>

              <a
                href={`mailto:${SITE.emails.support}`}
                className="block text-white/60 text-sm mb-2 hover:text-white"
              >
                {SITE.emails.support}
              </a>

              <a
                href={`mailto:${SITE.emails.info}`}
                className="block text-white/60 text-sm hover:text-white"
              >
                {SITE.emails.info}
              </a>
            </div>

            {/* Address */}
            <div>
              <h3 className="font-black mb-5">عن MD-Marketplace</h3>

              <p className="text-white/55 text-sm leading-relaxed">
                منصة تجمع المتاجر المحلية والزبائن بمكان واحد، لتجعل التسوق
                والطلب والتوصيل أسهل وأسرع.
              </p>

              <p className="text-white/40 text-xs mt-4">{SITE.address}</p>

              <div className="flex flex-wrap gap-4 mt-5">
                <Link
                  href={SITE.links.aiGuide}
                  className="text-purple-300 text-xs hover:text-white font-bold"
                >
                  🤖 دليل استخدام MD-Marketplace AI
                </Link>

                <Link
                  href={SITE.links.privacy}
                  className="text-purple-300 text-xs hover:text-white"
                >
                  سياسة الخصوصية
                </Link>

                <Link
                  href={SITE.links.terms}
                  className="text-purple-300 text-xs hover:text-white"
                >
                  الشروط والأحكام
                </Link>
              </div>
            </div>

            {/* Social */}
            <div>
              <h3 className="font-black mb-5">تابعنا على</h3>

              <div className="flex flex-wrap gap-3">
                <a
                  href={SITE.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-[#1877F2] transition text-xs font-bold"
                >
                  Facebook
                </a>

                <a
                  href={SITE.social.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-black transition text-xs font-bold"
                >
                  TikTok
                </a>

                <a
                  href={SITE.social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-[#FF0000] transition text-xs font-bold"
                >
                  YouTube
                </a>

                <a
                  href={SITE.social.x}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-black transition text-xs font-bold"
                >
                  𝕏
                </a>
              </div>

              <p className="text-white/30 text- mt-6">
                www.md-marketplace.store
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 text-center py-6 text-white/30 text-">
          © 2020-2026 MD Marketplace - جميع الحقوق محفوظة
        </div>
      </footer>

      {/* =====================================================
          MARQUEE ANIMATION
      ===================================================== */}

      <style jsx>{`
       .coming-soon-marquee {
          padding-right: 100%;
          animation: comingSoonMoveReverse 18s linear infinite;
          direction: rtl;
        }

        @keyframes comingSoonMoveReverse {
          0% {
            transform: translateX(-100%);
          }

          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
