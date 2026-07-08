"use client";
import { useEffect, useState } from "react";
import { ShoppingCart, User, LogOut, Clock, MessageCircle, ChevronRight, Store, Package, Search, Sparkles } from "lucide-react";
import Link from "next/link";

export default function ShopPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // نجيب اليوزر بس ما منرجعه عالـ login - منخليه يفوت لو ما في
    fetch('/api/me', {
      credentials: 'include',
      cache: 'no-store',
    })
  .then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        if (data.user) setUser(data.user);
      }
      setLoading(false); // المهم هون: وقف التحميل بكل الاحوال
    })
  .catch(() => {
      setLoading(false); // حتى لو فشل، وقف التحميل وخليه يفوت
    });

    // نجيب الاقسام
    fetch('/api/categories', { cache: 'no-store' })
  .then(res => res.json())
  .then(data => {
      if (data.categories) setCategories(data.categories);
    })
  .catch(() => {});
  }, []);

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
    localStorage.clear();
    window.location.replace('/login');
  };

  if (loading) return (
    <div className="min-h-screen gradient-bg flex items-center justify-center">
      <div className="text-white text-xl">جاري التحميل...</div>
    </div>
  );

  return (
    <div className="min-h-screen gradient-bg">
      {/* نفس الكود تبعك كامل من هون وتحت - بس شيل جزء isGuest */}
      <div className="glass border-b border-white/10 p-4">
        <div className="max-w-6xl mx-auto flex flex-col gap-4">
          <div className="flex items-center justify-between">
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
              {user && (
                <button onClick={() => window.location.href = '/dashboard'} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20">
                  <User className="w-5 h-5 text-white" />
                </button>
              )}
              <button onClick={handleLogout} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20">
                <LogOut className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
            <input
              type="text"
              placeholder="ابحث عن قسم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pr-12 pl-4 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {!user && (
          <div className="glass rounded-2xl p-4 mb-6 flex items-center justify-between border border-blue-500/30">
            <p className="text-white">سجل دخول لتتمكن من الطلب</p>
            <button onClick={() => window.location.href = '/login'} className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 rounded-xl text-white text-sm font-semibold">
              تسجيل دخول
            </button>
          </div>
        )}

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
            <p className="text-purple-200 col-span-full text-center">ما في نتائج</p>
          )}
        </div>
      </div>
    </div>
  );
}
