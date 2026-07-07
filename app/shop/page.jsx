"use client";
import { useEffect, useState } from "react";
import { ShoppingCart, User, LogOut, Package, Clock, MessageCircle } from "lucide-react";

export default function ShopPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false); // ← ضفنا هاي

  useEffect(() => {
    // اول شي نتشيك اذا زائر من localStorage
    const guestMode = localStorage.getItem('md_guest');
    if (guestMode === 'true') {
      setIsGuest(true);
      setLoading(false);
      return; // ما تعمل fetch للـ /api/me
    }

    // اذا مش زائر، جيب اليوزر المسجل
    fetch('/api/me', {
      credentials: 'include',
    })
   .then(async (res) => {
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
      }
      setLoading(false);
    })
   .catch(() => {
      setLoading(false);
    });
  }, []);

  const handleLogout = () => {
    // منحذف الكوكي + منحذف guest mode
    document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:01:00 GMT';
    localStorage.removeItem('md_guest'); // ← ضفنا هاي
    localStorage.removeItem('md_user');
    window.location.href = '/login';
  };

  if (loading) return (
    <div className="min-h-screen gradient-bg flex items-center justify-center">
      <div className="text-white text-xl">جاري التحميل...</div>
    </div>
  );

  return (
    <div className="min-h-screen gradient-bg">
      {/* الهيدر */}
      <div className="glass border-b border-white/10 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold">MD Marketplace</h1>
              <p className="text-purple-200 text-xs">
                {user ? `أهلاً ${user.name}` : isGuest ? 'تصفح كزائر' : 'تصفح كزائر'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* زر الداشبورد - بيبين بس لليوزر المسجل */}
            {user && (
              <button 
                onClick={() => window.location.href = '/dashboard'} 
                className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20"
                title="حسابي"
              >
                <User className="w-5 h-5 text-white" />
              </button>
            )}

            {user && user.status === 'Active' && (
              <button className="relative w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20">
                <ShoppingCart className="w-5 h-5 text-white" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full text-xs text-white flex items-center justify-center">0</span>
              </button>
            )}
            <button onClick={handleLogout} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20">
              <LogOut className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* المحتوى */}
      <div className="max-w-6xl mx-auto p-4">
        {user && user.status === 'Pending' && (
          <div className="glass rounded-2xl p-6 mb-6 text-center">
            <Clock className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <h3 className="text-white font-bold text-lg mb-2">حسابك قيد المراجعة</h3>
            <p className="text-purple-200 text-sm">سيتم تفعيل حسابك قريباً. حالياً يمكنك التصفح فقط</p>
          </div>
        )}

        {(!user && !isGuest) && (
          <div className="glass rounded-2xl p-4 mb-6 flex items-center justify-between">
            <p className="text-white">عم تتصفح كزائر. سجل دخولك لتتمكن من الطلب</p>
            <button onClick={() => window.location.href = '/login'} className="bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2 rounded-xl text-white text-sm font-semibold">
              تسجيل دخول
            </button>
          </div>
        )}

        {isGuest && (
          <div className="glass rounded-2xl p-4 mb-6 flex items-center justify-between border border-blue-500/30">
            <p className="text-white">عم تتصفح كزائر. سجل حساب لتتمكن من الطلب والاستفادة من العروض</p>
            <button onClick={() => window.location.href = '/login'} className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 rounded-xl text-white text-sm font-semibold">
              انشاء حساب
            </button>
          </div>
        )}

        {/* المنتجات - للكل */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="glass rounded-2xl overflow-hidden">
              <div className="aspect-square bg-gradient-to-br from-purple-600/20 to-pink-600/20"></div>
              <div className="p-3">
                <h3 className="text-white font-semibold text-sm mb-1">منتج {i}</h3>
                <p className="text-pink-400 font-bold mb-2">$99.99</p>
                {user && user.status === 'Active' ? (
                  <button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs py-2 rounded-lg">
                    أضف للسلة
                  </button>
                ) : (
                  <button onClick={() => window.location.href = '/login'} className="w-full bg-white/10 text-white text-xs py-2 rounded-lg">
                    سجل دخول للطلب
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* زر واتساب ثابت */}
      <button onClick={() => window.open('https://wa.me/9613177653')} className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all">
        <MessageCircle className="w-7 h-7 text-white" />
      </button>
    </div>
  );
}
