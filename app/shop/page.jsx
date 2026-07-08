"use client";
import { useEffect, useState } from "react";
import { ShoppingCart, User, LogOut, MessageCircle, Store, Package, Search, Sparkles } from "lucide-react";
import Link from "next/link";

export default function ShopPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // نجيب اليوزر اذا موجود
    fetch('/api/me', { credentials: 'include', cache: 'no-store' })
    .then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        if (data.user) setUser(data.user);
      }
    }).finally(() => setLoading(false));

    // نجيب الاقسام
    fetch('/api/categories', { cache: 'no-store' })
    .then(res => res.json())
    .then(data => {
      if (data.categories) setCategories(data.categories);
    });

    // نجيب المنتجات المقترحة - لازم تعمل /api/products
    fetch('/api/products?featured=true', { cache: 'no-store' })
    .then(res => res.json())
    .then(data => {
      if (data.products) setProducts(data.products.slice(0, 8));
    }).catch(() => {});
  }, []);

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
    window.location.href = '/login';
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
              {user ? (
                <>
                  <button onClick={() => window.location.href = '/dashboard'} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20">
                    <User className="w-5 h-5 text-white" />
                  </button>
                  <button onClick={handleLogout} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20">
                    <LogOut className="w-5 h-5 text-white" />
                  </button>
                </>
              ) : (
                <button onClick={() => window.location.href = '/login'} className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 rounded-xl text-white text-sm font-semibold">
                  تسجيل دخول
                </button>
              )}
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
            <p className="text-white">سجل دخول لتتمكن من الطلب والاستفادة من العروض</p>
            <button onClick={() => window.location.href = '/login'} className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 rounded-xl text-white text-sm font-semibold">
              تسجيل دخول
            </button>
          </div>
        )}

        {/* رجعناهن: الكبسات الـ 3 الرئيسيات */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <Link href="/stores" className="glass rounded-2xl p-4 text-center hover:bg-white/10 transition-all border border-purple-500/30">
            <Store className="w-7 h-7 text-purple-400 mx-auto mb-2" />
            <h3 className="text-white font-bold text-sm">جميع المتاجر</h3>
          </Link>
          <Link href="/products" className="glass rounded-2xl p-4 text-center hover:bg-white/10 transition-all border border-pink-500/30">
            <Package className="w-7 h-7 text-pink-400 mx-auto mb-2" />
            <h3 className="text-white font-bold text-sm">جميع المنتجات</h3>
          </Link>
          <button onClick={() => window.open(`https://wa.me/9613177653?text=${encodeURIComponent("مرحبا، بدي اطلب طلب خاص")}`, '_blank')} className="glass rounded-2xl p-4 text-center hover:bg-white/10 transition-all border border-yellow-500/30">
            <Sparkles className="w-7 h-7 text-yellow-400 mx-auto mb-2" />
            <h3 className="text-white font-bold text-sm">طلب خاص</h3>
          </button>
        </div>

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
                  src={cat.image || 'https://via.placeholder.com/100x100/6d28d9/ffffff?text=MD'}
                  alt={cat.name}
                  className="w-full h-full object-contain group-hover:scale-110 transition-all duration-300"
                />
              </div>
              <h3 className="text-white font-semibold text-xs">{cat.name}</h3>
            </Link>
          )) : (
            <p className="text-purple-200 col-span-full text-center">ما في اقسام</p>
          )}
        </div>

        {/* رجعناه: منتجات مقترحة */}
        <h2 className="text-white font-bold text-lg mb-4">منتجات مقترحة</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.length > 0 ? products.map(product => (
            <Link key={product.id} href={`/product/${product.id}`} className="glass rounded-2xl overflow-hidden hover:bg-white/10 transition-all">
              <div className="aspect-square bg-white/5 overflow-hidden">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-3">
                <h3 className="text-white font-semibold text-sm mb-1 truncate">{product.name}</h3>
                <p className="text-pink-400 font-bold mb-2">${product.price}</p>
                <button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs py-2 rounded-lg">
                  أضف للسلة
                </button>
              </div>
            </Link>
          )) : [1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="glass rounded-2xl overflow-hidden">
              <div className="aspect-square bg-gradient-to-br from-purple-600/20 to-pink-600/20 animate-pulse"></div>
              <div className="p-3">
                <div className="h-4 bg-white/10 rounded mb-2"></div>
                <div className="h-4 w-1/2 bg-white/10 rounded"></div>
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
