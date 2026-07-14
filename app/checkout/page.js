'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();

  // نفس الحقول اللي كانو ثابتين بالقديم - ما لمست شي
  const [areaID, setAreaID] = useState("fad82d73");
  const [deliveryAddress, setDeliveryAddress] = useState("ابن سينا وادي حلول");
  const [note, setNote] = useState("ازا ما لقى لبنة...");

  const handleConfirm = async () => {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerID: "5482cbf7",   // نفس القديم
        areaID,
        deliveryAddress,
        note
      })
    });

    const data = await res.json();

    if (data.success) {
      router.push(`/order-success?id=${data.request_id}`);
    } else {
      alert('صار خطأ');
    }
  };

  return (
    <div className="min-h-screen gradient-bg text-white" style={{ direction: 'rtl' }}>
      
      {/* الهيدر مع كبسة رجوع عالسلة */}
      <header className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <button 
            onClick={() => router.push('/cart')}
            className="bg-white/10 p-2 rounded-xl active:scale-90 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">إتمام الطلب</h1>
        </div>
        <p className="text-sm text-purple-200 mr-11">أدخل معلومات التوصيل</p>
      </header>

      <div className="px-4 pb-6">
        <div className="glass p-5 rounded-2xl border border-white/10 flex flex-col gap-5">

          <div>
            <label className="text-sm text-purple-200 mb-2 block">اختر المنطقة</label>
            <select
              value={areaID}
              onChange={(e) => setAreaID(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl p-3.5 text-white focus:border-pink-500 focus:outline-none transition"
            >
              <option value="fad82d73">وادي حلول</option>
              <option value="a8d92f11">المنارة</option>
              <option value="b7c21d55">النبطية</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-purple-200 mb-2 block">العنوان التفصيلي</label>
            <input
              type="text"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="مثال: شارع، بناية، طابق"
              className="w-full bg-white/10 border border-white/20 rounded-xl p-3.5 text-white placeholder:text-white/40 focus:border-pink-500 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="text-sm text-purple-200 mb-2 block">ملاحظة للسائق (اختياري)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="اكتب اي ملاحظة تساعد السائق..."
              className="w-full bg-white/10 border border-white/20 rounded-xl p-3.5 text-white placeholder:text-white/40 h-28 resize-none focus:border-pink-500 focus:outline-none transition"
            />
          </div>

        </div>

        <button
          onClick={handleConfirm}
          className="w-full bg-pink-600 py-4 rounded-2xl text-white font-bold text-lg mt-6 active:scale-95 transition shadow-lg shadow-pink-600/30"
        >
          تأكيد الطلب
        </button>
      </div>

    </div>
  );
}
