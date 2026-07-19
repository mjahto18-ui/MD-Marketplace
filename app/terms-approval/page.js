"use client";
import { useState } from "react";

export default function TermsApproval() {
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    const agree = document.getElementById("agree");

    if (!agree?.checked) {
      alert("يجب الموافقة أولاً");
      return;
    }

    setLoading(true);
    try {
      await fetch("/api/update-terms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ AcceptedTerms: true }),
      });

      window.location.href = "/shop";
    } catch (e) {
      setLoading(false);
      alert("حدث خطأ، حاول مرة أخرى");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" dir="rtl" style={{ background: "#1e1f6b" }}>
      <div className="absolute inset-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-30" style={{ background: "linear-gradient(135deg, #a855f7, #ec4899)" }}></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}></div>
      </div>

      <div className="bg-white shadow-2xl rounded-[24px] p-8 w-full max-w-[420px] relative z-10">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-lg" style={{ background: "linear-gradient(135deg, #a78bfa 0%, #a855f7 30%, #ec4899 100%)" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="21" r="1" fill="white" stroke="white" />
              <circle cx="19" cy="21" r="1" fill="white" stroke="white" />
              <path d="M2.5 2.5h3l2.5 12h11l2.5-8h-15" />
            </svg>
          </div>
          <h3 className="text-[15px] font-bold tracking-widest text-slate-800">MD-MARKETPLACE</h3>
          <p className="text-[11px] text-slate-400 mt-1 tracking-wide">منصة التسوق الموثوقة</p>
        </div>

        <h2 className="text-[22px] font-bold mb-2 text-center text-slate-900 leading-tight">
          الموافقة على الشروط
        </h2>
        <p className="text-[13px] text-slate-500 text-center mb-7 leading-relaxed">
          للمتابعة في تصفح المتجر، يرجى الاطلاع والموافقة على سياساتنا
        </p>

        <div className="space-y-3 mb-7">
          <a href="/terms" className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 hover:border-violet-200 transition group">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition">
                📄
              </div>
              <div>
                <p className="text-[13.5px] font-semibold text-slate-800">الشروط والأحكام</p>
                <p className="text-[11px] text-slate-400">اقرأ شروط الاستخدام</p>
              </div>
            </div>
            <span className="text-slate-300 group-hover:text-violet-500">←</span>
          </a>

          <a href="/privacy" className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 hover:border-violet-200 transition group">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition">
                🔒
              </div>
              <div>
                <p className="text-[13.5px] font-semibold text-slate-800">سياسة الخصوصية</p>
                <p className="text-[11px] text-slate-400">كيف نحمي بياناتك</p>
              </div>
            </div>
            <span className="text-slate-300 group-hover:text-violet-500">←</span>
          </a>
        </div>

        <div className="flex items-start gap-3 mb-7 p-3 rounded-xl bg-violet-50/50 border border-violet-100">
          <input type="checkbox" id="agree" className="w-[18px] h-[18px] mt-0.5 rounded accent-violet-600 cursor-pointer" />
          <label htmlFor="agree" className="text-[13px] leading-5 text-slate-700 cursor-pointer select-none">
            أوافق على <span className="font-semibold text-slate-900">الشروط والأحكام</span> و <span className="font-semibold text-slate-900">سياسة الخصوصية</span> الخاصة بـ MD-Marketplace
          </label>
        </div>

        <button
          onClick={handleApprove}
          disabled={loading}
          className="w-full text-white py-3.5 rounded-xl font-semibold text-[14.5px] shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 40%, #ec4899 100%)" }}
        >
          {loading ? "جاري الحفظ..." : "موافقة ومتابعة للتسوق"}
        </button>

        <p className="text-[11px] text-center text-slate-400 mt-6">
          © 2026 MD-Marketplace. جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
