"use client";
import { useEffect, useState } from "react";
import { ShoppingCart, User, LogOut, Store, Package, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';

function CartBell() {
  const [hasItems, setHasItems] = useState(false);
  useEffect(() => {
    async function checkCart() {
      try {
        const res = await fetch('/api/cart', { credentials: 'include' });
        const data = await res.json();
        if (data.success && data.cart && data.cart.length > 0) setHasItems(true);
      } catch (e) {}
    }
    checkCart();
  }, []);
  if (!hasItems) return null;
  return (
    <div style={{ position: 'absolute', top: -4, right: -4, background: 'yellow', width: 16, height: 16, borderRadius: '50%', border: '2px solid white', animation: 'shake 0.5s infinite' }}>
      <style>{`@keyframes shake {0%{transform:translate(0,0)}25%{transform:translate(2px,-2px)}50%{transform:translate(-2px,2px)}75%{transform:translate(2px,2px)}100%{transform:translate(0,0)}}`}</style>
    </div>
  );
}

function CartIcon({ user }) {
  const router = useRouter();
  if (!user) return null;
  return (
    <button onClick={() => router.push('/cart')} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 relative active:scale-95 transition">
      <ShoppingCart className="w-5 h-5 text-white" />
      <CartBell />
    </button>
  );
}

export default function ShopPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState({ categories: [], stores: [], products: [] });

  useEffect(() => {
    fetch('/api/me', { credentials: 'include', cache: 'no-store' }).then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        if (data.user) setUser(data.user);
      }
    }).finally(() => setLoading(false));
    Promise.all([
      fetch('/api/categories').then(r => r.json()),
      fetch('/api/stores').then(r => r.json()),
      fetch('/api/products').then(r => r.json())
    ]).then(([catData, storeData, prodData]) => {
      setCategories(catData.categories || []);
      setStores(storeData.stores || []);
      setProducts(prodData.products || []);
    });
  }, []);

  useEffect(() => {
    const text = search.trim().toLowerCase();
    if (!text) { setSearchResults({ categories: [], stores: [], products: [] }); return; }
    setSearchResults({
      categories: categories.filter(c => c.name.toLowerCase().includes(text)),
      stores: stores.filter(s => s.store_name?.toLowerCase().includes(text)),
      products: products.filter(p => p.name.toLowerCase().includes(text))
    });
  }, [search, categories, stores, products]);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
    document.cookie = 'acceptedTerms=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
    router.push('/login');
    router.refresh();
  };

  if (loading) return (<div className="min-h-screen gradient-bg flex items-center justify-center"><div className="text-white text-xl">جاري التحميل...</div></div>);

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
                <p className="text-purple-200 text-xs">{user? `أهلاً ${user.name}` : 'تصفح كزائر'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CartIcon user={user} />
              {user ? (
                <>
                  <button onClick={() => router.push('/dashboard')} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 active:scale-95 transition"><User className="w-5 h-5 text-white" /></button>
                  <button onClick={handleLogout} className="bg-red-500/20 border border-red-500/30 px-3 py-2 rounded-xl flex items-center gap-2 hover:bg-red-500/30 transition active:scale-95"><LogOut className="w-4 h-4 text-red-300" /><span className="text-red-300 text-sm font-bold hidden sm:block">خروج</span></button>
                </>
              ) : (
                <button onClick={() => router.push('/login')} className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 rounded-xl text-white text-sm font-semibold active:scale-95 transition">تسجيل دخول</button>
              )}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
            <input type="text" placeholder="ابحث عن منتج، متجر، او قسم..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pr-12 pl-4 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-pink-500" />
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-3 gap-3 mb-8">
          <Link href="/stores" className="glass rounded-2xl p-4 text-center hover:bg-white/10 transition-all border border-purple-500/30 active:scale-95"><Store className="w-7 h-7 text-purple-400 mx-auto mb-2" /><h3 className="text-white font-bold text-sm">جميع المتاجر</h3></Link>
          <Link href="/products" className="glass rounded-2xl p-4 text-center hover:bg-white/10 transition-all border border-pink-500/30 active:scale-95"><Package className="w-7 h-7 text-pink-400 mx-auto mb-2" /><h3 className="text-white font-bold text-sm">جميع المنتجات</h3></Link>
          <button onClick={() => window.open(`https://wa.me/9613177653?text=${encodeURIComponent("مرحبا، بدي اطلب طلب خاص")}`, '_blank')} className="glass rounded-2xl p-4 text-center hover:bg-white/10 transition-all border border-yellow-500/30 active:scale-95"><Sparkles className="w-7 h-7 text-yellow-400 mx-auto mb-2" /><h3 className="text-white font-bold text-sm">طلب خاص</h3></button>
        </div>
        {search ? (
          <div className="space-y-6">
            {searchResults.products.length === 0 && searchResults.stores.length === 0 && searchResults.categories.length === 0 && (<div className="text-center py-20"><Search className="w-16 h-16 text-purple-400 mx-auto mb-4" /><p className="text-white text-xl font-bold mb-2">ما لقينا شي</p><p className="text-purple-300">جرب تبحث بكلمة تانية</p></div>)}
            {searchResults.products.length > 0 && (<div><h2 className="text-white font-bold text-lg mb-3">📦 منتجات - {searchResults.products.length}</h2><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{searchResults.products.slice(0, 8).map(product => (<div key={product.productID} className="glass rounded-xl p-3 active:scale-95 transition"><img src={product.image} className="w-full h-24 object-cover rounded-lg mb-2 bg-white/5" /><p className="text-white text-xs font-bold truncate">{product.name}</p><p className="text-pink-400 text-sm font-bold">{product.price} ل.ل</p></div>))}</div></div>)}
            {searchResults.stores.length > 0 && (<div><h2 className="text-white font-bold text-lg mb-3 mt-6">🏪 متاجر - {searchResults.stores.length}</h2><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{searchResults.stores.slice(0, 8).map(store => (<Link key={store.store_id} href={`/store/${store.store_id}`} className="glass rounded-xl p-3 active:scale-95 transition"><img src={store.logo || '/placeholder.png'} className="w-full h-20 object-cover rounded-lg mb-2 bg-white/5" /><p className="text-white text-xs font-bold truncate">{store.store_name}</p></Link>))}</div></div>)}
            {searchResults.categories.length > 0 && (<div><h2 className="text-white font-bold text-lg mb-3 mt-6">📂 أقسام - {searchResults.categories.length}</h2><div className="grid grid-cols-3 md:grid-cols-5 gap-3">{searchResults.categories.map(cat => (<Link key={cat.id} href={`/category/${cat.id}`} className="glass rounded-xl p-3 text-center active:scale-95 transition"><div className="aspect-square bg-white/5 rounded-xl mb-2 overflow-hidden flex items-center justify-center p-2"><img src={cat.image} className="w-full h-full object-contain" /></div><p className="text-white text-xs font-semibold">{cat.name}</p></Link>))}</div></div>)}
          </div>
        ) : (
          <>
            <h2 className="text-white font-bold text-lg mb-4">تصفح حسب القسم</h2>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-8">
              {categories.map((cat) => (<Link key={cat.id} href={`/category/${cat.id}`} className="glass rounded-2xl p-3 text-center hover:bg-white/10 transition-all group active:scale-95"><div className="aspect-square bg-white/5 rounded-xl mb-2 overflow-hidden flex items-center justify-center p-2">{cat.image && (<img src={cat.image} alt={cat.name} className="w-full h-full object-contain group-hover:scale-110 transition-all duration-300" />)}</div><h3 className="text-white font-semibold text-xs">{cat.name}</h3></Link>))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
