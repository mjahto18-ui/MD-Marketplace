'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Search, ShoppingCart, Package, Check } from 'lucide-react';
import Image from 'next/image';

// === كومبوننت صورة بسوايب + مقاس ===
function ProductImage({ product }) {
  const [idx, setIdx] = useState(0)
  const [startX, setStartX] = useState(null)
  const images = product.images?.length ? product.images : (product.image ? [product.image] : [])

  const next = () => setIdx(i => (i + 1) % images.length)
  const prev = () => setIdx(i => (i - 1 + images.length) % images.length)

  if (!images.length) return <div className="w-full h-44 bg-white rounded-t-2xl flex items-center justify-center text-gray-400 text-xs">لا صورة</div>

  return (
    <div
      className="relative w-full h-44 bg-white rounded-t-2xl overflow-hidden"
      onTouchStart={e => setStartX(e.touches[0].clientX)}
      onTouchEnd={e => {
        if (startX === null) return
        const diff = e.changedTouches[0].clientX - startX
        if (diff < -30) next()
        if (diff > 30) prev()
        setStartX(null)
      }}
    >
      <Image src={images[idx]} alt={product.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-contain p-2" loading="lazy" />

      {/* أسهم */}
      {images.length > 1 && (
        <>
          <button onClick={(e)=>{e.stopPropagation(); prev()}} className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/60 text-white w-6 h-6 rounded-full text-xs z-10">‹</button>
          <button onClick={(e)=>{e.stopPropagation(); next()}} className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/60 text-white w-6 h-6 rounded-full text-xs z-10">›</button>
        </>
      )}

      {/* عداد */}
      {images.length > 1 && (
        <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full z-10">{idx+1}/{images.length}</span>
      )}

      {/* مقاس */}
      {product.size && (
        <span className="absolute bottom-2 right-2 bg-amber-300 text-black text-[11px] font-black px-2 py-1 rounded-full z-10">مقاس: {product.size}</span>
      )}

      {/* نقاط */}
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
          {images.map((_, i) => (
            <span key={i} onClick={(e)=>{e.stopPropagation(); setIdx(i)}} className={`w-1.5 h-1.5 rounded-full cursor-pointer ${i===idx ? 'bg-pink-500' : 'bg-gray-300'}`} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [addingId, setAddingId] = useState(null);
  const [customerID, setCustomerID] = useState(null);
  const [isCustomer, setIsCustomer] = useState(false);
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
        if (!data.user) { router.push('/login'); return; }
        if (data.user?.customerId) {
          setCustomerID(data.user.customerId);
          setIsCustomer(true);
        } else {
          setIsCustomer(false);
        }
      })
    .catch(() => router.push('/login'));
  }, [router]);

  async function getLocationFast() {
    const cachedLat = localStorage.getItem('user_lat');
    const cachedLng = localStorage.getItem('user_lng');
    if (cachedLat && cachedLng) {
      return { lat: cachedLat, lng: cachedLng };
    }
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          localStorage.setItem('user_lat', lat);
          localStorage.setItem('user_lng', lng);
          resolve({ lat, lng });
        },
        () => resolve(null),
        { enableHighAccuracy: false, timeout: 8000 }
      );
    });
  }

  const fetchProducts = useCallback(async (pageNum, searchText, isNewSearch = false) => {
    if (isNewSearch) {
      if (firstLoad.current) setLoading(true);
      else setIsSearching(true);
    } else if (pageNum > 1) setLoadingMore(true);

    try {
      const loc = await getLocationFast();

      const params = new URLSearchParams();
      params.set('limit', '20');
      params.set('page', String(pageNum));
      if (searchText.trim()) params.set('search', searchText.trim());
      if (loc) {
        params.set('lat', loc.lat);
        params.set('lng', loc.lng);
      }

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

  useEffect(() => {
    if (firstLoad.current) return;
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
    if (!isCustomer) return;
    if (addingId) return;
    if (globalCfg?.isCartClosed) {
      setToast(globalCfg.cart_closed_message || "السلة مغلقة حالياً");
      setTimeout(() => setToast(null), 3000);
      return;
    }
    if (!customerID) { router.push('/login'); return; }
    setAddingId(productID);

    const doAdd = async (lat, lng) => {
      try {
        const prod = [...products,...filtered].find(p => p.productID === productID);
        const res = await fetch('/api/cart/add', {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productID, qty: 1, lat, lng })
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

    const cachedLat = localStorage.getItem('user_lat');
    const cachedLng = localStorage.getItem('user_lng');
    if (cachedLat && cachedLng) {
      doAdd(cachedLat, cachedLng);
      return;
    }

    if (!navigator.geolocation) {
      setToast("متصفحك ما بيدعم تحديد الموقع");
      setTimeout(() => { setToast(null); setAddingId(null); }, 3000);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        localStorage.setItem('user_lat', pos.coords.latitude);
        localStorage.setItem('user_lng', pos.coords.longitude);
        doAdd(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setToast("لازم تسمح بالموقع لتضيف عالسلة");
        setTimeout(() => { setToast(null); setAddingId(null); }, 3000);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
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
          <h1 className="text-2xl font-bold">كل المنتجات {!isCustomer && <span className="text-sm font-normal text-purple-300">(عرض فقط)</span>}</h1>
        </div>
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
          <input type="text" placeholder="ابحث عن منتج..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-white placeholder:text-purple-300 focus:border-purple-500 focus:outline-none transition" />
          {isSearching && <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>}
        </div>
        {isSearching && <p className="text-xs text-purple-300 mt-2 mr-2">عم دوّر...</p>}
      </header>
      <div className="px-4 pb-6">
        {filtered.length === 0 &&!isSearching && (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <p className="text-xl font-bold mb-2">لا يوجد منتجات ضمن نطاقك الجغرافي</p>
            <p className="text-sm text-purple-300 mt-2">يبدو أنك خارج مناطق التغطية الحالية</p>
          </div>
        )}
        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 transition-opacity ${isSearching? 'opacity-50' : 'opacity-100'}`}>
          {filtered.map(product => (
            <div key={product.productID} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
              <ProductImage product={product} />
              <div className="p-3">
                <h3 className="font-bold text-sm mb-1 truncate">{product.name}</h3>
                <p className="text-xs text-purple-300 mb-1 truncate">المتجر: {product.storeName}</p>
                {product.size && <p className="text- text-amber-300 font-bold mb-1">مقاس: {product.size}</p>}
                 {/* هون زيد التوصيل */}
                {product.coverage_type === 'global' ? (
              <span className="inline-block text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full mb-2">
             🚚 توصيل خلال 72 ساعة - لكل لبنان
             </span>
            ) : (
            <span className="inline-block text-[10px] bg-green-500/20 text-green-300 border border-green-500/30 px-2 py-0.5 rounded-full mb-2">
            ⚡ توصيل فوري - خلال 25 دقيقة
           </span>
           )}

                {product.description && (
                <p className="text-[11px] text-gray-400 leading-4 line-clamp-2 mb-2 min-h-[28px]">
                {product.description}
                </p>
                )}
                <div className="space-y-1 text-xs mb-3"><p className="text-purple-200">السعر: <span className="font-bold text-white">{Number(product.price).toLocaleString()} ل.ل</span></p></div>
                {isCustomer? (
                  <button onClick={() => addToCart(product.productID)} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 py-2.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2">
                    {addingId === product.productID? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <ShoppingCart className="w-4 h-4" />}{addingId === product.productID? '...' : 'اضف للسلة'}
                  </button>
                ) : (
                  <div className="w-full bg-white/5 py-2.5 rounded-xl text-center text-xs text-purple-300">عرض فقط - للكوستيمر</div>
                )}
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
