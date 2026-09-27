"use client";
import { useState } from "react";

export default function AdminTermsApproval() {
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    const agreeTerms = document.getElementById("agreeTerms");
    const agreePrivacy = document.getElementById("agreePrivacy");
    const agreeWork = document.getElementById("agreeWork");
    
    if (!agreeTerms?.checked || !agreePrivacy?.checked || !agreeWork?.checked) {
      alert("يجب الموافقة على الشروط الثلاثة أولاً");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/update-terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          AcceptedTerms: true,
          AcceptedPrivacy: true,
          AcceptedWorkTerms: true 
        }),
      });

      const data = await res.json();

      if (data.success) {
        window.location.href = data.redirectTo || "/admin";
      } else {
        throw new Error(data.error);
      }
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

      <div className="bg-white shadow-2xl rounded-[24px] p-8 w-full max-w-[480px] relative z-10">

        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-lg" style={{ background: "linear-gradient(135deg, #a78bfa 0%, #a855f7 30%, #ec4899 100%)" }}>
            <span className="text-white text-2xl">🛡</span>
          </div>
          <h3 className="text-[11px] font-bold tracking-widest text-slate-800">MD-ADMIN</h3>
          <p className="text-[10px] text-slate-400 mt-1 tracking-wide">لوحة تحكم العمل - نادي خاص مغلق</p>
        </div>

        <h2 className="text-[18px] font-bold mb-2 text-center text-slate-900 leading-tight">
          الموافقة على شروط العمل
        </h2>
        <p className="text-[12px] text-slate-500 text-center mb-7 leading-relaxed">
          للمتابعة الى لوحة التحكم، يرجى الموافقة على سياسات المنصة الثلاثة
        </p>

        <div className="space-y-3 mb-7">
          {/* 1 - الشروط والاحكام */}
          <a href="/terms" className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 hover:border-violet-200 transition group">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition">
                📄
              </div>
              <div>
                <p className="text-[13.5px] font-semibold text-slate-800">الشروط والأحكام</p>
                <p className="text-[11px] text-slate-400">النادي المغلق والوساطة</p>
              </div>
            </div>
            <span className="text-slate-300 group-hover:text-violet-500">←</span>
          </a>

          {/* 2 - سياسة الخصوصية */}
          <a href="/privacy" className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 hover:border-violet-200 transition group">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition">
                🔒
              </div>
              <div>
                <p className="text-[13.5px] font-semibold text-slate-800">سياسة الخصوصية</p>
                <p className="text-[11px] text-slate-400">حماية البيانات - GPS و SOS</p>
              </div>
            </div>
            <span className="text-slate-300 group-hover:text-violet-500">←</span>
          </a>

          {/* 3 - شروط العمل - الجديد */}
          <a href="/work-terms" className="flex items-center justify-between p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-50 hover:border-amber-300 transition group">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white border border-amber-100 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition">
                🛡️
              </div>
              <div>
                <p className="text-[13.5px] font-bold text-slate-900">شروط العمل</p>
                <p className="text-[11px] text-amber-700">التزامات الطاقم - تحذيرات</p>
              </div>
            </div>
            <span className="text-amber-300 group-hover:text-amber-600">←</span>
          </a>
        </div>

        <div className="space-y-2.5 mb-7 p-3 rounded-xl bg-violet-50/50 border border-violet-100">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input type="checkbox" id="agreeTerms" className="w-4 h-4 mt-0.5 rounded accent-violet-600 cursor-pointer" />
            <span className="text-[12px] leading-5 text-slate-700 cursor-pointer select-none">أوافق على <b className="text-slate-900">الشروط والأحكام</b></span>
          </label>
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input type="checkbox" id="agreePrivacy" className="w-4 h-4 mt-0.5 rounded accent-violet-600 cursor-pointer" />
            <span className="text-[12px] leading-5 text-slate-700 cursor-pointer select-none">أوافق على <b className="text-slate-900">سياسة الخصوصية</b> وسرية بيانات العملاء</span>
          </label>
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input type="checkbox" id="agreeWork" className="w-4 h-4 mt-0.5 rounded accent-violet-600 cursor-pointer" />
            <span className="text-[12px] leading-5 text-slate-800 font-semibold cursor-pointer select-none">أوافق على <b className="text-slate-900">شروط العمل</b> - أي طلب خارج النادي مسؤوليتي، وأوافق على تجميد الرصيد عند المخالفة</span>
          </label>
        </div>

        <button
          onClick={handleApprove}
          disabled={loading}
          className="w-full text-white py-3.5 rounded-xl font-semibold text-[14.5px] shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 40%, #ec4899 100%)" }}
        >
          {loading? "جاري الحفظ..." : "موافقة ومتابعة للعمل"}
        </button>

        <p className="text-[10px] text-center text-slate-400 mt-6">
          © 2026 MD-Marketplace. نادي رقمي خاص مغلق - جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
