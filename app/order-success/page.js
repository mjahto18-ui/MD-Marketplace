export const dynamic = "force-dynamic";

'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function OrderSuccessPage() {
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
      <div className="min-h-screen gradient-bg flex items-center justify-center text-white">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg p-4 text-white" style={{ direction: 'rtl' }}>
      
      <div className="glass p-6 rounded-2xl border border-white/10 text-center">

        <h1 className="text-2xl font-bold mb-4">تم تأكيد طلبك بنجاح!</h1>

        <p className="text-lg mb-2">
          رقم الطلب: <span className="font-bold">{order.requestID}</span>
        </p>

        <p className="text-lg mb-4">
          المبلغ الإجمالي:{" "}
          <span className="font-bold">
            {Number(order.totalAmount).toLocaleString()} ل.ل
          </span>
        </p>

        <button
          onClick={() => router.push('/orders')}
          className="w-full bg-white/10 py-3 rounded-xl text-white font-bold mb-3"
        >
          تتبع الطلب
        </button>

        <button
          onClick={() => router.push('/shop')}
          className="w-full bg-pink-600 py-3 rounded-xl text-white font-bold"
        >
          الرجوع إلى المتجر
        </button>

      </div>

    </div>
  );
}
