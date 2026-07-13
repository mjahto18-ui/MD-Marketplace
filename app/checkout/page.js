'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const router = useRouter();

  // نفس الحقول اللي كانو ثابتين بالقديم
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
    <div className="min-h-screen gradient-bg p-4 text-white" style={{ direction: 'rtl' }}>
      
      <h1 className="text-xl font-bold mb-4">إتمام الطلب</h1>

      <div className="glass p-4 rounded-2xl border border-white/10 flex flex-col gap-4">

        <div>
          <label className="text-sm text-purple-200">اختر المنطقة</label>
          <select
            value={areaID}
            onChange={(e) => setAreaID(e.target.value)}
            className="w-full mt-1 bg-white/10 border border-white/20 rounded-xl p-3 text-white"
          >
            <option value="fad82d73">وادي حلول</option>
            <option value="a8d92f11">المنارة</option>
            <option value="b7c21d55">النبطية</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-purple-200">العنوان التفصيلي</label>
          <input
            type="text"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            className="w-full mt-1 bg-white/10 border border-white/20 rounded-xl p-3 text-white"
          />
        </div>

        <div>
          <label className="text-sm text-purple-200">ملاحظة للطلب</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full mt-1 bg-white/10 border border-white/20 rounded-xl p-3 text-white h-24"
          />
        </div>

      </div>

      <button
        onClick={handleConfirm}
        className="w-full bg-pink-600 py-3 rounded-2xl text-white font-bold text-lg mt-6"
      >
        تأكيد الطلب
      </button>

    </div>
  );
}
