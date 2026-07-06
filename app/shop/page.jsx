"use client";
import { useEffect, useState } from "react";
import { ShoppingCart, User, LogOut, Package, Clock, MessageCircle } from "lucide-react";

export default function ShopPage() {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('md_user');
    const guestData = localStorage.getItem('md_guest');
    if (userData) setUser(JSON.parse(userData));
    else if (guestData) setIsGuest(true);
    else window.location.href = '/login';
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('md_user');
    localStorage.removeItem('md_guest');
    window.location.href = '/login';
  };

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
                {user? `أهلاً ${user.name}` : 'تصفح كزائر'}
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

        {isGuest && (
          <div className="glass rounded-2xl p-4 mb-6 flex items-center justify-between">
            <p className="text-white">عم تتصفح كزائر. سجل دخولك لتتمكن من الطلب</p>
            <button onClick={() => window.location.href = '/login'} className="bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2 rounded-xl text-white text-sm font-semibold">
              تسجيل دخول
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
                {user && user.status === 'Active'? (
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
      <button onClick={() => window.open('https://wa.me/961XXXXXXXX')} className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all">
        <MessageCircle className="w-7 h-7 text-white" />
      </button>
    </div>
  );
}
