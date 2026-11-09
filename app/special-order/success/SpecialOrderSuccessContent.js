'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

export default function SpecialOrderSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const requestID = searchParams.get("id");
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!requestID) return;
    fetch(`/api/special-order-success?id=${requestID}`)
      .then(r => r.json())
      .then(data => { if (data.success) setOrder(data.order); });
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

  return (
    <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 text-center max-w-md w-full shadow-2xl shadow-purple-500/20 mx-auto" style={{ direction: 'rtl' }}>
      <div className="flex justify-center mb-6">
        <div className="bg-white p-2.5 rounded- shadow-lg">
          <Image src="/icon.png" alt="MD Marketplace" width={56} height={56} />
        </div>
      </div>
      <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/50">
        <CheckCircle2 className="w-12 h-12 text-white" />
      </div>
      <h1 className="text-3xl font-bold mb-3 text-white">وصل طلبك الخاص!</h1>
      <p className="text-lg mb-2 text-white">
        طلب رقم <span className="font-bold text-white">#{order.requestID}</span>
      </p>
      <p className="text-purple-200 mb-2">الطلب: {order.orderText} - كمية {order.quantity}</p>
      <p className="text-purple-200 mb-8">رح نراجعو ونبعتلك السعر وتكلفة التوصيل قريباً</p>
      <button onClick={() => router.push('/shop')} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 py-4 rounded-2xl text-white font-bold text-lg shadow-lg shadow-purple-500/50 active:scale-95 transition">
        الرجوع الى المتجر
      </button>
      <p className="text-xs text-purple-300 mt-6">يمكنك متابعة طلبك من قسم "طلباتي" في التطبيق</p>
    </div>
  );
}
