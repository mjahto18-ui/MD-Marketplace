'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';

export default function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const requestID = searchParams.get("id");
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!requestID) return;

    const fetchOrder = async () => {
      const res = await fetch(`/api/order-success?id=${requestID}`);
      const data = await res.json();

      if (data.success) {
        setOrder(data.order);
      }
    };

    fetchOrder();
  }, [requestID]);

  if (!order) {
    return (
      <div className="flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // بس الكادر - بدون min-h-screen ولا خلفية
  return (
    <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 text-center max-w-md w-full shadow-2xl shadow-purple-500/20 mx-auto" style={{ direction: 'rtl' }}>

      {/* لوجو MD صغير فوق */}
      <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-purple-500/50">
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </div>
      <p className="text-xs text-purple-300 mb-6">MD MARKETPLACE</p>

      {/* ايقونة صح خضرا */}
      <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/50">
        <CheckCircle2 className="w-12 h-12" />
      </div>

      <h1 className="text-3xl font-bold mb-3">تم تأكيد طلبك بنجاح!</h1>

      {/* رقم الطلب - بتجيبه من الـAPI */}
      <p className="text-lg mb-2">
        طلب رقم <span className="font-bold">#{order.requestID}</span>
      </p>

      {/* الوقت المتوقع للتوصيل - ثابت 15-25 زي ما طلبت */}
      <p className="text-purple-200 mb-8">
        الوقت المتوقع للتوصيل: 15-25 دقيقة
      </p>

      {/* زر واحد بس: الرجوع الى المتجر */}
      <button
        onClick={() => router.push('/shop')}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 py-4 rounded-2xl text-white font-bold text-lg shadow-lg shadow-purple-500/50 active:scale-95 transition"
      >
        الرجوع الى المتجر
      </button>

      {/* الكتابة اللي من تحت */}
      <p className="text-xs text-purple-300 mt-6">
        يمكنك متابعة طلبك من قسم "طلباتي" في التطبيق
      </p>

    </div>
  );
}
