'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

// ضغط الصورة لـ 800x800 webp - تجربة قبل المنتجات
async function compressToWebp800(file) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX = 800;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        const ratio = Math.min(MAX / w, MAX / h);
        w = Math.round(w * ratio); h = Math.round(h * ratio);
      }
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => resolve(blob), 'image/webp', 0.75);
    };
    img.src = URL.createObjectURL(file);
  });
}

export default function SpecialOrderPage() {
  const router = useRouter();
  const [customerID, setCustomerID] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [addressType, setAddressType] = useState(null);
  const [areaID, setAreaID] = useState("");
  const [areas, setAreas] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [orderText, setOrderText] = useState("");
  const [storeHint, setStoreHint] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
     .then(async (res) => {
        if (!res.ok) { router.push('/login'); return; }
        const data = await res.json();
        if (data.user?.customerId) setCustomerID(data.user.customerId);
        else router.push('/login');
      })
     .catch(() => router.push('/login'))
     .finally(() => setAuthLoading(false));
  }, [router]);

  useEffect(() => {
    fetch('/api/areas').then(r => r.json()).then(d => {
      if (d.areas?.length) { setAreas(d.areas); setAreaID(d.areas[0].id); }
    }).catch(()=>{});
  }, []);

  const handleImage = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const handleConfirm = async () => {
    if (!orderText.trim()) { alert("شو بدك؟ اكتب الطلب أولاً"); return; }
    if (!addressType) { alert("اختَر نوع العنوان أولاً"); return; }
    if (!customerID) { alert("جاري تحميل بياناتك..."); return; }

    setLoading(true);
    let lat = "", lng = "";

    if (addressType === "new") {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000 });
        });
        lat = pos.coords.latitude.toString();
        lng = pos.coords.longitude.toString();
      } catch {
        setLoading(false); alert("ما قدرنا نجيب موقعك… جرّب مرة تانية"); return;
      }
    }

    // 1. رفع الصورة مضغوطة اذا فيه صورة
    let imageUrl = "";
    if (imageFile) {
      try {
        const compressed = await compressToWebp800(imageFile);
        const fd = new FormData();
        fd.append('file', compressed, 'special-order.webp');
        const up = await fetch('/api/upload', { method: 'POST', body: fd });
        const upData = await up.json();
        if (upData.url) imageUrl = upData.url;
      } catch (e) { console.error("upload fail", e); }
    }

    // 2. بعت الطلب
    const res = await fetch('/api/special-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerID, orderText, storeHint, quantity, note, addressType, areaID, deliveryAddress, lat, lng, imageUrl })
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) router.push(`/special-order/success?id=${data.request_id}`);
    else alert(data.message || "صار خطأ");
  };

  if (authLoading) return <div className="min-h-screen bg-[#0D0D21] flex items-center justify-center text-white">جاري التحميل...</div>;

  return (
    <div className="min-h-screen gradient-bg text-white" style={{ direction: 'rtl' }}>
      <header className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => router.back()} className="bg-white/10 p-2 rounded-xl active:scale-90 transition"><ChevronRight className="w-5 h-5" /></button>
          <h1 className="text-2xl font-bold">طلب خاص</h1>
        </div>
        <p className="text-sm text-purple-200 mr-11">شو بدك نجبلك؟ من أي محل؟</p>
      </header>

      <div className="px-4 pb-6 flex flex-col gap-4">
        <div className="glass p-5 rounded-2xl border border-white/10 flex flex-col gap-4">
          <div>
            <label className="text-sm text-purple-200 mb-2 block">شو بدك؟ *</label>
            <textarea value={orderText} onChange={(e)=>setOrderText(e.target.value)} placeholder="مثلا: بدي كيلو لحمة" className="w-full bg-white/10 border border-white/20 rounded-xl p-3.5 text-white h-24 resize-none" />
          </div>
          <div>
            <label className="text-sm text-purple-200 mb-2 block">من أي محل؟ (اختياري)</label>
            <input value={storeHint} onChange={(e)=>setStoreHint(e.target.value)} placeholder="مثلا: من ملحمة ... - اذا بتعرف" className="w-full bg-white/10 border border-white/20 rounded-xl p-3.5 text-white" />
            <p className="text-xs text-purple-300 mt-1">اذا ما بتعرف، اتركها فاضية ونحنا منلاقيلك</p>
          </div>
          <div>
            <label className="text-sm text-purple-200 mb-2 block">الكمية</label>
            <div className="flex items-center gap-3">
              <button onClick={()=>setQuantity(Math.max(1, quantity-1))} className="bg-white/10 w-10 h-10 rounded-xl font-bold">-</button>
              <span className="font-bold text-lg w-8 text-center">{quantity}</span>
              <button onClick={()=>setQuantity(quantity+1)} className="bg-white/10 w-10 h-10 rounded-xl font-bold">+</button>
            </div>
          </div>
          <div>
            <label className="text-sm text-purple-200 mb-2 block">صورة (اختياري)  </label>
            <input type="file" accept="image/*" onChange={handleImage} className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white" />
            {imagePreview && <img src={imagePreview} className="w-32 h-32 object-cover rounded-xl mt-2" />}
            <p className="text-xs text-purple-300 mt-1">ارفاق صورة اذا شيء خاص او محدد</p>
          </div>
          <div>
            <label className="text-sm text-purple-200 mb-2 block">ملاحظات عامة</label>
            <textarea value={note} onChange={(e)=>setNote(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl p-3.5 text-white h-20 resize-none" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={()=>setAddressType("fixed")} className={`w-full py-3 rounded-xl font-bold ${addressType==="fixed"?"bg-pink-600":"bg-white/10"}`}>عنواني الثابت</button>
          <button onClick={()=>setAddressType("new")} className={`w-full py-3 rounded-xl font-bold ${addressType==="new"?"bg-pink-600":"bg-white/10"}`}>عنوان جديد</button>
        </div>

        {addressType==="new" && (
          <div className="glass p-5 rounded-2xl border border-white/10 flex flex-col gap-4">
            <div>
              <label className="text-sm text-purple-200 mb-2 block">اختر المنطقة</label>
              <select value={areaID} onChange={(e)=>setAreaID(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl p-3.5 text-white">
                {areas.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-purple-200 mb-2 block">العنوان التفصيلي</label>
              <input value={deliveryAddress} onChange={(e)=>setDeliveryAddress(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl p-3.5 text-white" />
            </div>
          </div>
        )}

        <button onClick={handleConfirm} disabled={loading} className="w-full bg-pink-600 py-4 rounded-2xl font-bold text-lg mt-2">{loading?"جاري الإرسال...":"إرسال الطلب الخاص"}</button>
      </div>
    </div>
  );
}
