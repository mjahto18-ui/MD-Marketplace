"use client";
import { useEffect, useState } from "react";
import { User, Package, MapPin, LogOut, ShoppingBag, Gift, MessageCircle, ChevronRight, Bell, Star, Wallet } from "lucide-react";
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [balance, setBalance] = useState({ points: 0, wallet: 0 });

  useEffect(() => {
    fetch('/api/me', {
      credentials: 'include',
    })
     .then(async (res) => {
        if (!res.ok) {
          window.location.href = '/login';
          return;
        }
        const data = await res.json();
        setUser(data.user);
        setLoading(false);

        fetch(`/api/notifications/count?userID=${data.user.customerID}`)
         .then(r => r.json())
         .then(n => setNotificationCount(n.count || 0));

        // هون بيجيب النقاط والمحفظة من الشيتين
        fetch(`/api/my-balance?customerID=${data.user.customerID}`)
         .then(r => r.json())
         .then(b => setBalance({ points: b.points || 0, wallet: b.wallet || 0 }));
      })
     .catch(() => {
        window.location.href = '/login';
     });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/logout', {
      method: 'POST',
      credentials: 'include'
    });
    document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950" style={{direction: 'rtl'}}>
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 p-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/shop')} className="bg-white/10 p-2 rounded-xl active:scale-90 transition">
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold">اهلاً {user?.name}</h1>
              <p className="text-purple-200 text-xs">{user?.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push('/notifications')} className="relative w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition">
              <Bell className="w-5 h-5 text-white" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
            <button onClick={handleLogout} className="bg-red-500/20 border border-red-500/30 px-3 py-2 rounded-xl flex items-center gap-2 hover:bg-red-500/30 transition active:scale-95">
              <LogOut className="w-4 h-4 text-red-300" />
              <span className="text-red-300 text-sm font-bold hidden sm:block">خروج</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-4 pb-24">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-yellow-300" />
              <p className="text-yellow-200 text-xs">نقاطي</p>
            </div>
            <p className="text-white text-2xl font-bold">{balance.points}</p>
            <p className="text-yellow-200/60 text-xs mt-1">نقطة</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-emerald-300" />
              <p className="text-emerald-200 text-xs">محفظتي</p>
            </div>
            <p className="text-white text-xl font-bold">{Number(balance.wallet).toLocaleString()}</p>
            <p className="text-emerald-200/60 text-xs mt-1">ل.ل</p>
          </div>
        </div>

        {user?.freeDeliveries > 0 && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
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

        {user?.lat && user?.lng ? (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-pink-400" />
              <h2 className="text-white font-bold">موقع التوصيل</h2>
            </div>
            <div className="h-48 rounded-xl overflow-hidden mb-3">
              <Map lat={parseFloat(user.lat)} lng={parseFloat(user.lng)} />
            </div>
            <p className="text-purple-200 text-sm">{user?.address}, {user?.area}</p>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-pink-400" />
              <h2 className="text-white font-bold">موقع التوصيل</h2>
            </div>
            <p className="text-purple-200 text-sm">لم يتم تحديد الموقع بعد</p>
          </div>
        )}

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-5 h-5 text-purple-400" />
            <h2 className="text-white font-bold">طلباتي</h2>
          </div>
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-purple-300/50 mx-auto mb-3" />
            <p className="text-purple-200">لا يوجد طلبات بعد</p>
          </div>
        </div>

        <button onClick={() => window.location.href = '/shop'} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition">
          <ShoppingBag className="w-5 h-5" />
          تصفح المتجر
        </button>
      </div>

      <button onClick={() => window.open('https://wa.me/961XXXXXXXX?text=مرحبا، بدي مساعدة')} className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all z-50">
        <MessageCircle className="w-7 h-7 text-white" />
      </button>
    </div>
  );
}
