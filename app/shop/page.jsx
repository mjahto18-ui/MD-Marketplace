"use client";
import { useEffect, useState } from "react";
import { ShoppingCart, User, LogOut, Clock, MessageCircle, ChevronRight, Store, Package, Search, Sparkles } from "lucide-react";
import Link from "next/link";

export default function ShopPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // 1. نتشيك عالكوكي اول شي - اذا زائر منوقف هون
    const isGuestCookie = document.cookie.split('; ').find(row => row.startsWith('md_guest='))?.split('=')[1] === 'true';

    if (isGuestCookie) {
      setIsGuest(true);
      setLoading(false);
    } else {
      // 2. اذا مش زائر، نتشيك اذا في يوزر مسجل
      fetch('/api/me', {
        credentials: 'include',
        cache: 'no-store',
      })
    .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
          }
        }
        setLoading(false);
      })
    .catch(() => {
        setLoading(false);
      });
    }

    // 3. نجيب الاقسام من الـ API
    fetch('/api/categories', { cache: 'no-store' })
    .then(res => res.json())
    .then(data => {
        if (data.categories) setCategories(data.categories);
      })
    .catch(() => {});
  }, []);

  // فلترة الاقسام حسب البحث
  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleLogout = async () => {
    await fetch('/api/logout', {
      method: 'POST',
      credentials: 'include'
    }).catch(() => {});

    document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
    document.cookie = 'md_guest=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';

    localStorage.clear();
    window.location.replace('/login');
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/login';
    }
  };

  const handleCreateAccount = () => {
    document.cookie = 'md_guest=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
    window.location.href = '/login?view=register';
  };

  const handleSpecialRequest = () => {
    const msg = encodeURIComponent("مرحبا، بدي اطلب طلب خاص من MD Marketplace");
    window.open(`https://wa.me/9613177653?text=${msg}`, '_blank');
  };

  if (loading) return (
    <div className="min-h-screen gradient-bg flex items-center justify-center">
      <div className="text-white text-xl">جاري التحميل...</div>
    </div>
  );

  return (
    <div className="min-h-screen gradient-bg">
      <div className="glass border-b border-white/10 p-4">
        <div className="max-w-6xl mx-auto flex flex-col gap-4">
          {/* السطر الاول: اللوغو + الايقونات */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20"
                title="رجوع"
              >
                <ChevronRight className="w-5 h-5 text-white rotate-180" />
              </button>

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
              <button
                onClick={handleLogout}
                className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20"
                title="تسجيل خروج"
              >
                <LogOut className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* السطر التاني: خانة البحث */}
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
            <input
              type="text"
              placeholder="ابحث عن قسم، منتج، متجر..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pr-12 pl-4 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {user && user.status === 'Pending' && (
          <div className="glass rounded-2xl p-6 mb-6 text-center">
            <Clock className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <h3 className="text-white font-bold text-lg mb-2">حسابك قيد المراجعة</h3>
            <p className="text-purple-200 text-sm">سيتم تفعيل حسابك قريباً. حالياً يمكنك التصفح فقط</p>
          </div>
        )}

        {isGuest && (
          <div className="glass rounded-2xl p-4 mb-6 flex items-center justify-between border border-blue-500/30">
            <p className="text-white">عم تتصفح كزائر. سجل حساب لتتمكن من الطلب والاستفادة من العروض</p>
            <button onClick={handleCreateAccount} className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 rounded-xl text-white text-sm font-semibold">
              انشاء حساب
            </button>
          </div>
        )}

        {/* الكبسات الـ 3 الرئيسيات */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <Link href="/stores" className="glass rounded-2xl p-4 text-center hover:bg-white/10 transition-all border border-purple-500/30">
            <Store className="w-7 h-7 text-purple-400 mx-auto mb-2" />
            <h3 className="text-white font-bold text-sm">جميع المتاجر</h3>
          </Link>
          <Link href="/products" className="glass rounded-2xl p-4 text-center hover:bg-white/10 transition-all border border-pink-500/30">
            <Package className="w-7 h-7 text-pink-400 mx-auto mb-2" />
            <h3 className="text-white font-bold text-sm">جميع المنتجات</h3>
          </Link>
          <button onClick={handleSpecialRequest} className="glass rounded-2xl p-4 text-center hover:bg-white/10 transition-all border border-yellow-500/30">
            <Sparkles className="w-7 h-7 text-yellow-400 mx-auto mb-2" />
            <h3 className="text-white font-bold text-sm">طلب خاص</h3>
          </button>
        </div>

        
        {/* فلتر الاقسام */}
<h2 className="text-white font-bold text-lg mb-4">
  {search? `نتائج البحث عن "${search}"` : 'تصفح حسب القسم'}
</h2>
<div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-8">
  {filteredCategories.length > 0? filteredCategories.map((cat) => (
    <Link 
      key={cat.id} 
      href={`/category/${cat.id}`} 
      className="glass rounded-2xl p-3 text-center hover:bg-white/10 transition-all group"
    >
      <div className="aspect-square bg-white/5 rounded-xl mb-2 overflow-hidden flex items-center justify-center p-2">
        <img 
          src={cat.image}
          alt={cat.name}
          className="w-full h-full object-contain group-hover:scale-110 transition-all duration-300"
          onError={(e) => e.target.src = 'https://via.placeholder.com/100x100/6d28d9/ffffff?text=MD'} 
        />
      </div>
      <h3 className="text-white font-semibold text-xs">{cat.name}</h3>
    </Link>
  )) : (
    <p className="text-purple-200 col-span-full text-center">ما في نتائج للبحث</p>
  )}
</div>
      

        {/* منتجات مقترحة */}
        <h2 className="text-white font-bold text-lg mb-4">منتجات مقترحة</h2>
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
                  <button onClick={handleCreateAccount} className="w-full bg-white/10 text-white text-xs py-2 rounded-lg">
                    سجل دخول للطلب
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => window.open('https://wa.me/9613177653')} className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all">
        <MessageCircle className="w-7 h-7 text-white" />
      </button>
    </div>
  );
}
