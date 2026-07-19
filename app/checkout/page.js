'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();

  const [addressType, setAddressType] = useState(null);
  const [areaID, setAreaID] = useState("");
  const [areas, setAreas] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [customerID, setCustomerID] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // جيب الـ customerId الحقيقي من api/me
  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        if (data.user?.customerId) {
          setCustomerID(data.user.customerId);
        } else {
          router.push('/login');
        }
      })
      .catch(() => router.push('/login'))
      .finally(() => setAuthLoading(false));
  }, [router]);

  useEffect(() => {
    async function fetchAreas() {
      try {
        const res = await fetch('/api/areas');
        const data = await res.json();
        if (data.areas && data.areas.length > 0) {
          setAreas(data.areas);
          setAreaID(data.areas[0].id);
        }
      } catch (err) {
        console.error("Areas Fetch Error:", err);
      }
    }
    fetchAreas();
  }, []);

  const handleConfirm = async () => {
    if (!addressType) {
      alert("اختَر نوع العنوان أولاً");
      return;
    }
    if (!customerID) {
      alert("جاري تحميل بياناتك...");
      return;
    }

    setLoading(true);

    let lat = "";
    let lng = "";

    if (addressType === "new") {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 8000,
          });
        });
        lat = pos.coords.latitude.toString();
        lng = pos.coords.longitude.toString();
      } catch (err) {
        setLoading(false);
        alert("ما قدرنا نجيب موقعك… جرّب مرة تانية");
        return;
      }
    }

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerID,
        areaID,
        deliveryAddress,
        note,
        addressType,
        lat,
        lng
      })
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      router.push(`/order-success?id=${data.request_id}`);
    } else {
      alert(data.message || "صار خطأ");
    }
  };

  if (authLoading) {
    return <div className="min-h-screen bg-[#0D0D21] flex items-center justify-center text-white">جاري التحميل...</div>;
  }

  return (
    <div className="min-h-screen gradient-bg text-white" style={{ direction: 'rtl' }}>
      <header className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => router.push('/cart')} className="bg-white/10 p-2 rounded-xl active:scale-90 transition">
            <ChevronRight className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">إتمام الطلب</h1>
        </div>
        <p className="text-sm text-purple-200 mr-11">اختر نوع العنوان</p>
      </header>

      <div className="px-4 pb-4 flex flex-col gap-3">
        <button onClick={() => setAddressType("fixed")} className={`w-full py-3 rounded-xl font-bold ${addressType === "fixed" ? "bg-pink-600" : "bg-white/10"}`}>عنواني الثابت</button>
        <button onClick={() => setAddressType("new")} className={`w-full py-3 rounded-xl font-bold ${addressType === "new" ? "bg-pink-600" : "bg-white/10"}`}>عنوان جديد</button>
      </div>

      {addressType === "new" && (
        <div className="px-4 pb-6">
          <div className="glass p-5 rounded-2xl border border-white/10 flex flex-col gap-5">
            <div>
              <label className="text-sm text-purple-200 mb-2 block">اختر المنطقة</label>
              <select value={areaID} onChange={(e) => setAreaID(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl p-3.5 text-white">
                {areas.map((area) => (<option key={area.id} value={area.id}>{area.name}</option>))}
              </select>
            </div>
            <div>
              <label className="text-sm text-purple-200 mb-2 block">العنوان التفصيلي</label>
              <input type="text" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl p-3.5 text-white" />
            </div>
            <div>
              <label className="text-sm text-purple-200 mb-2 block">ملاحظة للسائق</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl p-3.5 text-white h-28 resize-none" />
            </div>
          </div>
        </div>
      )}

      <div className="px-4">
        <button onClick={handleConfirm} disabled={loading} className="w-full bg-pink-600 py-4 rounded-2xl text-white font-bold text-lg mt-6">{loading ? "جاري الإرسال..." : "تأكيد الطلب"}</button>
      </div>
    </div>
  );
}
