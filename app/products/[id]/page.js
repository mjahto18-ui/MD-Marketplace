'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, ShoppingCart, Check, Package } from 'lucide-react';
import Image from 'next/image';

export default function ProductDetailPage({ params }) {
  const id = params.id;
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [idx, setIdx] = useState(0)
  const [startX, setStartX] = useState(null)
  const [zoomOpen, setZoomOpen] = useState(false)
  const [zoomStartX, setZoomStartX] = useState(null)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [adding, setAdding] = useState(false);
  const [isCustomer, setIsCustomer] = useState(false);
  const [globalCfg, setGlobalCfg] = useState(null);

  useEffect(() => {
    fetch('/api/global-config', { next: { revalidate: 10 } }).then(r=>r.json()).then(d=>setGlobalCfg(d)).catch(()=>{});
    fetch('/api/me', { credentials: 'include' }).then(r=>r.json()).then(d=>{
      if(d.user?.customerId) setIsCustomer(true);
    }).catch(()=>{});
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const lat = localStorage.getItem('user_lat');
        const lng = localStorage.getItem('user_lng');
        let url = `/api/products/${id}`;
        if (lat && lng) url += `?lat=${lat}&lng=${lng}`;
        const res = await fetch(url);
        const json = await res.json();
        if (!json.success) {
          setError(json.message || "المنتج غير متاح في منطقتك");
        }
        else setProduct(json.product);
        if (!lat ||!lng) {
          navigator.geolocation.getCurrentPosition(
            pos => {
              localStorage.setItem('user_lat', pos.coords.latitude);
              localStorage.setItem('user_lng', pos.coords.longitude);
            },
            ()=>{},
            { enableHighAccuracy: false, timeout: 3000 }
          );
        }
      } catch (e) {
        setError(e.message);
      }
      setLoading(false);
    };
    if(id) load();
  }, [id]);

  const addToCart = async () => {
    if (!isCustomer) { router.push('/login'); return; }
    if (globalCfg?.isCartClosed) {
      setToast(globalCfg.cart_closed_message || "السلة مغلقة حالياً");
      setTimeout(()=>setToast(null), 3000);
      return;
    }
    setAdding(true);
    const doAdd = async (lat, lng) => {
      try {
        const res = await fetch('/api/cart/add', {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productID: product.productID, qty: 1, lat, lng })
        });
        const data = await res.json();
        if (!data.success) setToast(data.message || "فشل الاضافة");
        else setToast(`${product.name} - تمت الإضافة`);
      } catch {
        setToast("خطأ بالاتصال");
      }
      setTimeout(()=>{ setToast(null); setAdding(false); }, 2000);
    };
    const cachedLat = localStorage.getItem('user_lat');
    const cachedLng = localStorage.getItem('user_lng');
    if (cachedLat && cachedLng) { doAdd(cachedLat, cachedLng); return; }
    if (!navigator.geolocation) {
      setToast("متصفحك ما بيدعم تحديد الموقع");
      setTimeout(()=>{ setToast(null); setAdding(false); }, 3000);
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
        setTimeout(()=>{ setToast(null); setAdding(false); }, 3000);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 flex items-center justify-center text-white">
      <div className="text-center"><div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p>جاري التحميل...</p></div>
    </div>
  );

  if (error ||!product) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white flex flex-col items-center justify-center p-6">
      <Package className="w-16 h-16 text-purple-400 mb-4" />
      <p className="text-xl font-bold text-center">{error || "المنتج غير موجود"}</p>
      <p className="text-sm text-purple-300 mt-2 text-center">المنتج مش متاح في نطاقك الحالي</p>
      <button onClick={()=>router.back()} className="mt-6 bg-white/10 px-6 py-2 rounded-xl">رجوع</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white" style={{ direction: 'rtl' }}>
      {globalCfg?.isCartClosed && (<div className="bg-amber-500 text-black text-center py-3 px-4 font-bold sticky top-0 z-50">{globalCfg.cart_closed_message}</div>)}

      <header className="px-4 md:px-8 lg:px-12 pt-6 pb-4 flex items-center gap-3 max-w-7xl mx-auto w-full">
        <button onClick={() => router.back()} className="bg-white/10 p-2 rounded-xl active:scale-90 transition hover:bg-white/20"><ChevronRight className="w-5 h-5" /></button>
        <h1 className="text-lg md:text-xl font-bold truncate">{product.name}</h1>
      </header>

      <div className="px-4 md:px-8 lg:px-12 pb-28 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden p-4 md:p-6 lg:p-8">
          {(() => {
            const images = product.images?.length ? product.images : (product.image ? [product.image] : [])
            if (!images.length) return <div className="w-full aspect-square bg-white rounded-2xl flex items-center justify-center text-gray-400">لا صورة</div>
            return (
              <div
                onClick={() => setZoomOpen(true)}
                className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square bg-white rounded-2xl overflow-hidden flex items-center justify-center cursor-zoom-in"
                onTouchStart={e => setStartX(e.touches[0].clientX)}
                onTouchEnd={e => {
                  if (startX === null) return
                  const diff = e.changedTouches[0].clientX - startX
                  if (diff < -30) setIdx(i => (i + 1) % images.length)
                  if (diff > 30) setIdx(i => (i - 1 + images.length) % images.length)
                  setStartX(null)
                }}
              >
                <Image src={images[idx]} alt={product.name} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-contain p-6 md:p-8" priority />

                {images.length > 1 && (
                  <>
                    <button onClick={(e)=>{e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length)}} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 text-white w-9 h-9 rounded-full text-lg z-10">‹</button>
                    <button onClick={(e)=>{e.stopPropagation(); setIdx(i => (i + 1) % images.length)}} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 text-white w-9 h-9 rounded-full text-lg z-10">›</button>
                  </>
                )}

                {images.length > 1 && (
                  <span className="absolute top-3 left-3 bg-black/60 text-white text- px-2.5 py-1 rounded-full z-10">{idx+1}/{images.length}</span>
                )}

                {product.size && (
                  <span className="absolute top-3 right-3 bg-amber-300 text-black text- font-black px-3 py-1.5 rounded-full z-10">مقاس: {product.size}</span>
                )}
                {/* === بادج العرض - على الصورة === */}
{product.isOfferActive && (
    <span className="absolute top-12 left-3 bg-red-500 text-white text-xs font-black px-3 py-1.5 rounded-full z-10 shadow-lg">
    عرض 🔥 {product.discountPercent > 0 ? `-${product.discountPercent}%` : ""}
  </span>
)}
{product.isOfferActive && product.offerEnd && (
  <span className="absolute bottom-3 right-3 bg-black/75 text-yellow-300 text-[11px] font-bold px-3 py-1 rounded-full z-10">
    ينتهي بـ {new Date(product.offerEnd).toLocaleDateString("ar-LB", { day: "numeric", month: "short" })}
  </span>
)}

                {images.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10 bg-black/30 p-1.5 rounded-full">
                    {images.map((img, i) => (
                      <img key={i} src={img} onClick={(e)=>{e.stopPropagation(); setIdx(i)}} className={`w-10 h-10 object-cover rounded-full cursor-pointer border-2 ${i===idx ? 'border-pink-500' : 'border-white/50'}`} />
                    ))}
                  </div>
                )}
              </div>
            )
          })()}
          <div className="flex flex-col justify-between py-2">
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 leading-tight">{product.name}</h2>
              <p className="text-sm md:text-base text-purple-300 mb-6">المتجر: {product.storeName} • {product.category}</p>
              {product.size && (
                <div className="inline-flex items-center gap-2 text-sm bg-amber-300/20 text-amber-300 border border-amber-300/30 px-3 py-1.5 rounded-full mb-4 font-bold">
                  📏 المقاس: {product.size}
                </div>
              )}
              {product.coverage_type === 'global' ? (
                <div className="inline-flex items-center gap-2 text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-full mb-6">
                  🚚 توصيل خلال 72 ساعة - لكل لبنان
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 text-xs bg-green-500/20 text-green-300 border border-green-500/30 px-3 py-1.5 rounded-full mb-6">
                  ⚡ توصيل فوري - خلال 25 دقيقة
                </div>
              )}
                            <div className="bg-white/5 rounded-2xl p-4 md:p-5 mb-6 border border-white/5">
                <p className="text-purple-200 text-sm mb-1">السعر:</p>
                {product.isOfferActive && product.oldPrice > 0 && product.oldPrice > Number(product.price) ? (
                  <>
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-3xl md:text-4xl font-bold text-green-400">{Number(product.price).toLocaleString()} <span className="text-lg font-normal">ل.ل</span></p>
                      <span className="bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full">وفر {product.discountPercent}% 🔥</span>
                    </div>
                    <p className="text-gray-400 line-through text-lg mt-1">{Number(product.oldPrice).toLocaleString()} ل.ل</p>
                    {product.offerEnd && <p className="text-yellow-300 text-xs font-bold mt-2">⏰ العرض بيخلص بـ {new Date(product.offerEnd).toLocaleDateString("ar-LB", { day: "numeric", month: "short", year: "numeric" })}</p>}
                  </>
                ) : (
                  <p className="text-3xl md:text-4xl font-bold text-white">{Number(product.price).toLocaleString()} <span className="text-lg font-normal">ل.ل</span></p>
                )}
                {product.stock!== undefined && <p className="text-xs md:text-sm text-gray-400 mt-2">الكمية المتاحة: {product.stock}</p>}
              </div>
              {product.description && (
                <div className="mb-6">
                  <p className="text-sm md:text-base font-bold text-purple-200 mb-2">الوصف:</p>
                  <p className="text-sm text-gray-300 leading-7 whitespace-pre-line">{product.description}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2 text-xs md:text-sm text-purple-300 mb-8">
                <span className="bg-white/5 px-4 py-2 rounded-full border border-white/10">الوحدة: {product.unit}</span>
                {product.size && <span className="bg-amber-300/20 text-amber-300 px-4 py-2 rounded-full border border-amber-300/30 font-bold">مقاس: {product.size}</span>}
                {product.available === false && <span className="bg-red-500/20 text-red-300 px-4 py-2 rounded-full">غير متوفر</span>}
                {product.available!== false && <span className="bg-green-500/20 text-green-300 px-4 py-2 rounded-full">متوفر</span>}
              </div>
            </div>
            <div className="hidden lg:block">
              {isCustomer? (
                <button onClick={addToCart} disabled={adding || product.available === false} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition">
                  {adding? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <ShoppingCart className="w-5 h-5" />}
                  {adding? 'جاري الإضافة...' : 'اضف للسلة'}
                </button>
              ) : (
                <button onClick={()=>router.push('/login')} className="w-full bg-white/10 py-4 rounded-2xl font-bold hover:bg-white/20 transition">سجل دخول للطلب</button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
        {isCustomer? (
          <button onClick={addToCart} disabled={adding || product.available === false} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50 shadow-2xl">
            {adding? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <ShoppingCart className="w-5 h-5" />}
            {adding? '...' : 'اضف للسلة'}
          </button>
        ) : (
          <button onClick={()=>router.push('/login')} className="w-full bg-white/10 backdrop-blur-xl border border-white/10 py-4 rounded-2xl font-bold">سجل دخول للطلب</button>
        )}
      </div>

      {zoomOpen && (() => {
        const images = product.images?.length ? product.images : (product.image ? [product.image] : [])
        return (
          <div
            onClick={() => setZoomOpen(false)}
            onTouchStart={e => setZoomStartX(e.touches[0].clientX)}
            onTouchEnd={e => {
              if (zoomStartX === null) return
              const diff = e.changedTouches[0].clientX - zoomStartX
              if (diff < -30) setIdx(i => (i + 1) % images.length)
              if (diff > 30) setIdx(i => (i - 1 + images.length) % images.length)
              setZoomStartX(null)
            }}
            className="fixed inset-0 bg-black/95 z-[999] flex items-center justify-center p-2"
          >
            <button onClick={() => setZoomOpen(false)} className="absolute top-4 right-4 bg-white/20 text-white w-10 h-10 rounded-full text-xl z-10">✕</button>
            <img src={images[idx]} alt={product.name} className="max-w-full max-h-full object-contain" />
            {images.length > 1 && (
              <>
                <button onClick={(e)=>{e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length)}} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 text-white w-10 h-10 rounded-full">‹</button>
                <button onClick={(e)=>{e.stopPropagation(); setIdx(i => (i + 1) % images.length)}} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 text-white w-10 h-10 rounded-full">›</button>
              </>
            )}
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/20 text-white text-xs px-3 py-1 rounded-full">{idx+1}/{images.length}</span>
          </div>
        )
      })()}

      {toast && (<div className="fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-3 rounded-full shadow-2xl z-[999] flex items-center gap-2"><div className="bg-green-500 rounded-full p-1"><Check className="w-3 h-3 text-white" /></div><span className="text-sm font-bold whitespace-nowrap">{toast}</span></div>)}
    </div>
  );
}
