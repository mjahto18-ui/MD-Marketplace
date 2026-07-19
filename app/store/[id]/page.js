'use client';
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, Search, ShoppingCart, Package, Check, Lock } from "lucide-react";

export default function StorePage() {
  const { id: storeID } = useParams();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [addingId, setAddingId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetch('/api/me', { credentials: 'include', cache: 'no-store' })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data.user) setUser(data.user);
        }
      })
      .finally(() => setCheckingUser(false));
  }, []);

  useEffect(() => {
    if (!storeID) return;
    fetch(`/api/products/by-store?id=${storeID}`)
     .then(res => res.json())
     .then(data => {
        if (data.success) {
          setProducts(data.products);
          setFilteredProducts(data.products);
        }
        setLoading(false);
      });
  }, [storeID]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  const addToCart = async (productID) => {
    if (addingId) return;
    if (!user) {
      router.push('/login');
      return;
    }
    setAddingId(productID);
    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productID, qty: 1 })
      });
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      if (data.success || res.ok) {
        const prod = products.find(p => p.productID === productID);
        setToast(prod ? prod.name : 'المنتج');
        setTimeout(() => {
          setToast(null);
          setAddingId(null);
        }, 2000);
      } else {
        alert(data.message || 'صار خطأ');
        setAddingId(null);
      }
    } catch (e) {
      setAddingId(null);
    }
  };

  if (loading || checkingUser) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 flex items-center justify-center text-white">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p>جاري التحميل...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white" style={{ direction: 'rtl' }}>
      <header className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} className="bg-white/10 p-2 rounded-xl active:scale-90 transition">
            <ChevronRight className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">منتجات المتجر</h1>
        </div>
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ابحث عن منتج..." className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-white placeholder:text-purple-300 focus:border-purple-500 focus:outline-none transition" />
        </div>
      </header>

      <div className="px-4 pb-6">
        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <p className="text-xl font-bold mb-2">ما لقينا منتجات</p>
            <p className="text-purple-300">جرب تبحث باسم تاني</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {filteredProducts.map(product => (
            <div key={product.productID} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/50 transition">
              <img src={product.image} alt={product.name} className="w-full h-32 md:h-36 object-cover bg-white/5" />
              <div className="p-3">
                <h3 className="font-bold text-sm mb-2 truncate">{product.name}</h3>
                <div className="space-y-1 text-xs mb-3">
                  <p className="text-purple-200">السعر: <span className="font-bold text-white">{Number(product.price).toLocaleString()} ل.ل</span></p>
                  <p className="text-purple-300">الوزن: {product.weightPoint} نقطة</p>
                </div>
                {user ? (
                  <button onClick={() => addToCart(product.productID)} disabled={!!addingId} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 py-2.5 rounded-xl text-white font-bold text-sm active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-60">
                    {addingId === product.productID ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <ShoppingCart className="w-4 h-4" />}
                    {addingId === product.productID ? '...' : 'اضف للسلة'}
                  </button>
                ) : (
                  <button onClick={() => router.push('/login')} className="w-full bg-white/10 border border-white/20 py-2.5 rounded-xl text-white font-bold text-sm active:scale-95 transition flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4" />
                    سجل دخول للطلب
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-3 rounded-full shadow-2xl z-[999] flex items-center gap-2">
          <div className="bg-green-500 rounded-full p-1"><Check className="w-3 h-3 text-white" /></div>
          <span className="text-sm font-bold">{toast} - تمت الإضافة</span>
        </div>
      )}
    </div>
  );
}
