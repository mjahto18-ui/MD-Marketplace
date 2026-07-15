"use client";
import { useEffect, useState } from "react";
import { User, Package, MapPin, LogOut, ShoppingBag, Gift, MessageCircle, ChevronRight, Bell, Star, Wallet, RefreshCcw } from "lucide-react";
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';


const Map = dynamic(() => import('@/components/Map'), { ssr: false });

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [balance, setBalance] = useState({ points: 0, wallet: 0 });
  const [orders, setOrders] = useState([]);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);


  // نظام تحديث الموقع
  const [needsLocationUpdate, setNeedsLocationUpdate] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) { window.location.href = '/login'; return; }
        const data = await res.json();
        setUser(data.user);
        setLoading(false);

        // فحص آخر تحديث للموقع
        if (data.user.LastLocationUpdate) {
          const last = new Date(data.user.LastLocationUpdate);
          const now = new Date();
          const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));

          if (diffDays >= 15) {
            setNeedsLocationUpdate(true);
          }
        }

        fetch(`/api/notifications/count?userID=${data.user.customerId}`)
          .then(r => r.json()).then(n => setNotificationCount(n.count || 0));

        fetch(`/api/my-balance?customerID=${data.user.customerId}`)
          .then(r => r.json()).then(b => setBalance({ points: b.points || 0, wallet: b.wallet || 0 }));

        fetch(`/api/my-orders?customerID=${data.user.customerId}`)
          .then(r => r.json()).then(o => setOrders(o.orders || []));
      })
      .catch(() => { window.location.href = '/login'; });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    window.location.href = '/login';
  };
  useEffect(() => {
  async function load() {
    const res = await fetch("/api/get-notifications", {
      method: "POST",
      body: JSON.stringify({ customerId: user?.customerId }),
    });

    const data = await res.json();
    setNotifications(data.notifications || []);
  }

  if (user) load();
}, [user]);


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
  <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950" style={{ direction: "rtl" }}>

    {/* الهيدر */}
    <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 p-4 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">

        {/* القسم اليسار */}
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

        {/* القسم اليمين */}
        <div className="flex items-center gap-2">

          {/* الجرس + قائمة الإشعارات */}
          <div className="relative">
            <button onClick={() => setOpenNotifications(!openNotifications)} className="p-2 rounded-xl bg-white/10 active:scale-90 transition">
              <Bell className="w-6 h-6 text-white" />

              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {notificationCount}
                </span>
              )}
            </button>

            {openNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-[#1a1a1a] text-white shadow-lg rounded-lg p-3 z-50">

                {notifications.length === 0 && (
                  <div className="text-center py-4 text-gray-400">
                    لا يوجد إشعارات بعد
                  </div>
                )}

                {notifications.map((n, i) => (
                  <div
                    key={i}
                    className={`border-b border-gray-700 py-2 ${
                      i === 0 ? "bg-[#2a2a2a]" : "bg-transparent"
                    }`}
                  >
                    <div className={`font-bold ${i === 0 ? "text-yellow-300" : "text-white"}`}>
                      {n.title}
                    </div>

                    <div className={`text-sm ${i === 0 ? "text-yellow-200" : "text-gray-300"}`}>
                      {n.message}
                    </div>

                    <div className={`text-xs ${i === 0 ? "text-yellow-400" : "text-gray-500"}`}>
                      {n.date}
                    </div>
                  </div>
                ))}

              </div>
            )}
          </div>

          {/* زر تحديث الموقع */}
          {needsLocationUpdate ? (
            <button
              onClick={() => setShowLocationModal(true)}
              className="bg-red-500/30 border border-red-500/50 px-3 py-2 rounded-xl flex items-center gap-2 hover:bg-red-500/40 transition"
            >
              <RefreshCcw className="w-4 h-4 text-red-300" />
              <span className="text-red-300 text-sm font-bold">تحديث الموقع</span>
            </button>
          ) : (
            <button className="bg-white/10 px-3 py-2 rounded-xl text-white/50 text-sm cursor-default flex items-center gap-2">
              <RefreshCcw className="w-4 h-4 text-white/40" />
              موقعك محدّث
            </button>
          )}

          {/* زر الإشعارات القديم */}
          <button onClick={() => router.push('/notifications')} className="relative w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition">
            <Bell className="w-5 h-5 text-white" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          {/* زر الخروج */}
          <button onClick={handleLogout} className="bg-red-500/20 border border-red-500/30 px-3 py-2 rounded-xl flex items-center gap-2 hover:bg-red-500/30 transition active:scale-95">
            <LogOut className="w-4 h-4 text-red-300" />
            <span className="text-red-300 text-sm font-bold hidden sm:block">خروج</span>
          </button>

        </div>
      </div>
    </div>

    {/* باقي الصفحة نفسها بدون تغيير */}
    <div className="max-w-6xl mx-auto p-4 space-y-4 pb-24">

      {/* نقاطي ومحفظتي */}
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

      {/* الخريطة */}
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

      {/* طلباتي */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-purple-400" />
          <h2 className="text-white font-bold">طلباتي</h2>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-purple-300/50 mx-auto mb-3" />
            <p className="text-purple-200">لا يوجد طلبات بعد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(o => (
              <div key={o.requestID} className="bg-white/5 rounded-xl p-3 border border-white/5">
                <div className="flex justify-between items-center">
                  <p className="text-white font-bold text-sm">#{o.requestID.slice(-6)}</p>
                  <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-200 border border-yellow-500/20">{o.status}</span>
                </div>

                <p className="text-purple-300/60 text-xs mt-1">{o.date}</p>

                <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                  <div>
                    <p className="text-white/40">قبل التوصيل</p>
                    <p className="text-white font-bold">{Number(o.itemsCost||0).toLocaleString()}</p>
                  </div>

                  <div>
                    <p className="text-white/40">التوصيل</p>
                    <p className="text-white">{o.freeUsed ? 'مجاني' : Number(o.deliveryFee||0).toLocaleString()}</p>
                  </div>

                  <div>
                    <p className="text-white/40">المجموع</p>
                    <p className="text-green-300 font-bold">{Number(o.total||0).toLocaleString()}</p>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={() => window.location.href = '/shop'} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition">
        <ShoppingBag className="w-5 h-5" />
        تصفح المتجر
      </button>

    </div>

    {/* واتساب */}
    <button onClick={() => window.open('https://wa.me/961XXXXXXXX?text=مرحبا، بدي مساعدة')} className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all z-50">
      <MessageCircle className="w-7 h-7 text-white" />
    </button>

    {/* صفحة تحديث الموقع */}
    {showLocationModal && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white/10 border border-white/20 rounded-2xl p-6 w-80 text-center">
          <h2 className="text-white font-bold mb-3">تحديث موقعك</h2>
          <p className="text-purple-200 text-sm mb-4">
            هذا الاجراء يساعدنا في تحديد بياناتك إذا تغيّر عنوان إقامتك.
          </p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={async () => {
                await fetch('/api/update-location-date', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ customerID: user.customerId })
                });
                setNeedsLocationUpdate(false);
                setShowLocationModal(false);
              }}
              className="bg-green-500/30 border border-green-500/50 px-4 py-2 rounded-xl text-white font-bold"
            >
              نعم
            </button>

            <button
              onClick={async () => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(async (pos) => {
                    await fetch('/api/update-location', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        customerID: user.customerId,
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                      })
                    });
                    setNeedsLocationUpdate(false);
                    setShowLocationModal(false);
                  });
                }
              }}
              className="bg-red-500/30 border border-red-500/50 px-4 py-2 rounded-xl text-white font-bold"
            >
              لا
            </button>
          </div>
        </div>
      </div>
    )}

  </div>
);
