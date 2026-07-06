"use client";
import { useEffect, useState } from "react";
import { User, Package, MapPin, LogOut, ShoppingBag, Gift, MessageCircle } from "lucide-react";
import dynamic from 'next/dynamic';

// استيراد الخريطة بدون SSR عشان ما تخرب
const Map = dynamic(() => import('@/components/Map'), { ssr: false });

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // منجيب بيانات اليوزر من الكوكي
    fetch('/api/me')
     .then(res => {
        if (!res.ok) window.location.href = '/login';
        return res.json();
      })
     .then(data => {
        setUser(data.user);
        setLoading(false);
      })
     .catch(() => window.location.href = '/login');
  }, []);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-white">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* الهيدر */}
      <div className="glass border-b border-white/10 p-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold">اهلاً {user?.name}</h1>
              <p className="text-purple-200 text-xs">{user?.phone}</p>
            </div>
          </div>

          <button onClick={handleLogout} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20">
            <LogOut className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-4 pb-24">
        {/* كرت التوصيل المجاني */}
        {user?.freeDeliveries > 0 && (
          <div className="glass rounded-2xl p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/30 rounded-xl flex items-center justify-center">
                <Gift className="w-6 h-6 text-green-300" />
              </div>
              <div>
                <h3 className="text-white font-bold">عندك {user.freeDeliveries} توصيل مجاني</h3>
                <p className="text-green-200 text-sm">استخدمهن بطلباتك الجاي</p>
              </div>
            </div>
          </div>
        )}

        {/* موقعي */}
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-5 h-5 text-pink-400" />
            <h2 className="text-white font-bold">موقع التوصيل</h2>
          </div>
          <div className="h-48 rounded-xl overflow-hidden mb-3">
            <Map lat={user?.lat} lng={user?.lng} />
          </div>
          <p className="text-purple-200 text-sm">{user?.address}, {user?.area}</p>
        </div>

        {/* طلباتي */}
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-5 h-5 text-purple-400" />
            <h2 className="text-white font-bold">طلباتي</h2>
          </div>
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-purple-300/50 mx-auto mb-3" />
            <p className="text-purple-200">لا يوجد طلبات بعد</p>
            <p className="text-purple-300 text-xs mt-1">بلش تسوق هلق</p>
          </div>
        </div>

        {/* زر المتجر */}
        <button
          onClick={() => window.location.href = '/shop'}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/25 transition-all"
        >
          <ShoppingBag className="w-5 h-5" />
          تصفح المتجر
        </button>
      </div>

      {/* زر واتساب ثابت */}
      <button
        onClick={() => window.open('https://wa.me/961XXXXXXXX?text=مرحبا، بدي مساعدة')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all z-50"
      >
        <MessageCircle className="w-7 h-7 text-white" />
      </button>
    </div>
  );
}
