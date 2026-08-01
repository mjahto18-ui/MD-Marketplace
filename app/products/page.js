'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Search, ShoppingCart, Package, Check } from 'lucide-react';
import Image from 'next/image';

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true); // بس أول مرة
  const [isSearching, setIsSearching] = useState(false); // للبحث بس
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [addingId, setAddingId] = useState(null);
  const [customerID, setCustomerID] = useState(null);
  const [globalCfg, setGlobalCfg] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const firstLoad = useRef(true);

  useEffect(() => {
    fetch('/api/global-config', { next: { revalidate: 10 } }).then(r=>r.json()).then(d=>setGlobalCfg(d)).catch(()=>{});
  }, []);

  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
  .then(async (res) => {
        if (!res.ok) { router.push('/login'); return; }
        const data = await res.json();
        if (data.user?.customerId) setCustomerID(data.user.customerId);
        else router.push('/login');
      })
  .catch(() => router.push('/login'));
  }, [router]);

  const fetchProducts = useCallback(async (pageNum, searchText, isNewSearch = false) => {
    // هون الفرق - ما منعمل loading للبحث
    if (isNewSearch) {
      if (firstLoad.current) setLoading(true);
      else setIsSearching(true);
    } else if (pageNum > 1) setLoadingMore(true);

    try {
      const params = new URLSearchParams();
      params.set('limit', '20');
      params.set('page', String(pageNum));
      if (searchText.trim()) params.set('search', searchText.trim());

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        if (isNewSearch || pageNum === 1) {
          setProducts(data.products);
          setFiltered(data.products);
        } else {
          setProducts(prev => [...prev,...data.products]);
          setFiltered(prev => [...prev,...data.products]);
        }
        setHasMore(data.products.length === 20);
        if (firstLoad.current) firstLoad.current = false;
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(1, "", true);
  }, [fetchProducts]);

  // بحث سلس - ما بيمحي المنتجات
  useEffect(() => {
    if (firstLoad.current) return; // أول تحميل ما نرجع نبحث
    const timer = setTimeout(() => {
      setPage(1);
      fetchProducts(1, search, true);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, fetchProducts]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && hasMore &&!loading &&!isSearching) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchProducts(nextPage, search, false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [page, hasMore, loadingMore, loading, isSearching, search, fetchProducts]);

  const addToCart = async (productID) => {
    if (addingId) return;
    if (globalCfg?.isCartClosed) {
      setToast(globalCfg.cart_closed_message || "السلة مغلقة حالياً");
      setTimeout(() => setToast(null), 3000);
      return;
    }
    if (!customerID) { router.push('/login'); return; }
    setAddingId(productID);
    try {
      const prod = [...products,...filtered].find(p => p.productID === productID);
      const res = await fetch('/api/cart/add', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productID, qty: 1 })
      });
      const data = await res.json();
      if (!res.ok ||!data.success) {
        setToast(data.message || "فشل الاضافة");
        setTimeout(() => { setToast(null); setAddingId(null); }, 3000);
        return;
      }
      setToast(prod? `${prod.name} - تمت الإضافة` : 'تمت الإضافة');
      setTimeout(() => { setToast(null); setAddingId(null); }, 2000);
    } catch (e) {
      setToast("خطأ بالاتصال");
      setTimeout(() => { setToast(null); setAddingId(null); }, 2000);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 flex items-center justify-center text-white">
      <div className="text-center"><div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p>جاري التحميل...</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white" style={{ direction: 'rtl' }}>
      {globalCfg?.isCartClosed && (<div className="bg-amber-500 text-black text-center py-3 px-4 font-bold sticky top-0 z-50">{globalCfg.cart_closed_message}</div>)}
      <header className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} className="bg-white/10 p-2 rounded-xl active:scale-90 transition"><ChevronRight className="w-5 h-5" /></button>
          <h1 className="text-2xl font-bold">كل المنتجات</h1>
        </div>
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
          <input type="text" placeholder="ابحث عن منتج..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-white placeholder:text-purple-300 focus:border-purple-500 focus:outline-none transition" />
          {isSearching && <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>}
        </div>
        {isSearching && <p className="text-xs text-purple-300 mt-2 mr-2">عم دوّر...</p>}
      </header>
      <div className="px-4 pb-6">
        {filtered.length === 0 &&!isSearching && (<div className="text-center py-20"><Package className="w-16 h-16 text-purple-400 mx-auto mb-4" /><p className="text-xl font-bold mb-2">ما لقينا منتجات</p></div>)}
        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 transition-opacity ${isSearching? 'opacity-50' : 'opacity-100'}`}>
          {filtered.map(product => (
            <div key={product.productID} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
              <div className="relative w-full h-[140px] bg-white flex items-center justify-center overflow-hidden"><Image src={product.image} alt={product.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-contain p-2" loading="lazy" /></div>
              <div className="p-3">
                <h3 className="font-bold text-sm mb-1 truncate">{product.name}</h3>
                <p className="text-xs text-purple-300 mb-2 truncate">المتجر: {product.storeName}</p>
                <div className="space-y-1 text-xs mb-3"><p className="text-purple-200">السعر: <span className="font-bold text-white">{Number(product.price).toLocaleString()} ل.ل</span></p></div>
                <button onClick={() => addToCart(product.productID)} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 py-2.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2">
                  {addingId === product.productID? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <ShoppingCart className="w-4 h-4" />}{addingId === product.productID? '...' : 'اضف للسلة'}
                </button>
              </div>
            </div>
          ))}
        </div>
        {loadingMore && (<div className="text-center py-6"><div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div></div>)}
      </div>
      {toast && (<div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-3 rounded-full shadow-2xl z-[999] flex items-center gap-2"><div className="bg-green-500 rounded-full p-1"><Check className="w-3 h-3 text-white" /></div><span className="text-sm font-bold">{toast}</span></div>)}
    </div>
  );
}
