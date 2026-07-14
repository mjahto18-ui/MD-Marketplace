'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, ChevronRight } from 'lucide-react'; // بدك تنزل lucide-react

export default function CheckoutPage() {
  const router = useRouter();
  const [areaID, setAreaID] = useState("fad82d73");
  const [deliveryAddress, setDeliveryAddress] = useState("ابن سينا وادي حلول");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if(!deliveryAddress.trim()) return alert('اكتب العنوان التفصيلي');
    setLoading(true);
    // ... منطق التشيك اوت تبعك
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white" style={{ direction: 'rtl' }}>
      
      {/* الهيدر تبع MD - بيطلع بكل الصفحات */}
      <header className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-3">
          {/* زر تسجيل دخول */}
          <button className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 rounded-xl text-sm font-medium shadow-lg shadow-purple-500/30">
            تسجيل دخول
          </button>

          {/* اللوجو بالنص */}
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/50 mb-1">
              <ShoppingCart className="w-7 h-7 text-white" />
            </div>
          </div>

          {/* ايقونة السلة */}
          <button className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl shadow-lg shadow-purple-500/30">
            <ShoppingCart className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* اسم المتجر */}
        <div className="text-center">
          <h1 className="text-xl font-bold">MD Marketplace</h1>
          <p className="text-xs text-purple-300">تصفح كزائر</p>
        </div>
      </header>

      {/* محتوى الصفحة */}
      <div className="px-4 pb-6">
        {/* عنوان الصفحة + زر رجوع */}
        <div className="flex items-center gap-2 mb-1">
          <ChevronRight className="w-6 h-6" />
          <h2 className="text-2xl font-bold">إتمام الطلب</h2>
        </div>
        <p className="text-purple-200 mb-6 mr-8">سلة التسوق - 3 عناصر</p>

        {/* كرت العنوان */}
        <div className="bg-white/5 backdrop-blur-xl p-5 rounded-2xl border border-white/10 mb-4">
          <h3 className="text-lg font-bold mb-4 text-purple-200">عنوان التوصيل</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-purple-200">اختر المنطقة</label>
              <select
                value={areaID}
                onChange={(e) => setAreaID(e.target.value)}
                className="w-full mt-2 bg-white/10 border border-white/20 rounded-xl p-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none"
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
                placeholder="اسم الشارع، البناية، الطابق..."
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full mt-2 bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder:text-white/40 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-purple-200">ملاحظة للسائق - اختياري</label>
              <textarea
                placeholder="مثال: لا ترن الجرس"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full mt-2 bg-white/10 border border-white/20 rounded-xl p-3 text-white h-24 placeholder:text-white/40 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none"
              />
            </div>
          </div>
        </div>

        {/* ملخص الطلب */}
        <div className="bg-white/5 backdrop-blur-xl p-5 rounded-2xl border border-white/10 mb-6">
          <h3 className="text-lg font-bold mb-4 text-center text-purple-200">ملخص الطلب</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-purple-200">المجموع الفرعي</span>
              <span>840,000 LBP</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-200">رسوم التوصيل</span>
              <span>50,000 LBP</span>
            </div>
            <div className="border-t border-dashed border-white/20 my-3"></div>
            <div className="flex justify-between text-lg font-bold">
              <span>الإجمالي</span>
              <span className="text-fuchsia-400">1,240,000 LBP</span>
            </div>
          </div>
        </div>

        {/* زر التأكيد */}
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 py-4 rounded-2xl text-white font-bold text-lg shadow-lg shadow-purple-500/50 disabled:opacity-50 active:scale-95 transition"
        >
          {loading ? 'جاري تأكيد الطلب...' : 'تأكيد الطلب 1,240,000 LBP'}
        </button>

        <p className="text-center text-xs text-purple-300 mt-4">
          بالمتابعة، أنت توافق على الشروط والأحكام
        </p>
      </div>
    </div>
  );
}
