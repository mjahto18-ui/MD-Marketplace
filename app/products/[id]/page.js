'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, ShoppingCart, Check, Package } from 'lucide-react';
import Image from 'next/image';

export default function ProductDetailPage({ params }) {
  const id = params.id;
  const router = useRouter();
  const [product, setProduct] = useState(null);
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
        const res = await fetch(`/api/products/${id}`);
        const json = await res.json();
        if (!json.success) setError(json.message);
        else setProduct(json.product);
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
    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productID: product.productID, qty: 1 })
      });
      const data = await res.json();
      if (!data.success) {
        setToast(data.message || "فشل الاضافة");
      } else {
        setToast(`${product.name} - تمت الإضافة`);
      }
    } catch {
      setToast("خطأ بالاتصال");
    }
    setTimeout(()=>{ setToast(null); setAdding(false); }, 2000);
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 flex items-center justify-center text-white">
      <div className="text-center"><div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p>جاري التحميل...</p></div>
    </div>
  );

  if (error ||!product) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white flex flex-col items-center justify-center p-6">
      <Package className="w-16 h-16 text-purple-400 mb-4" />
      <p className="text-xl font-bold">{error || "المنتج غير موجود"}</p>
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
        {/* ديسكتوب: عمودين، موبايل: عمود واحد */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded- overflow-hidden p-4 md:p-6 lg:p-8">

          {/* الصورة - ظابطة موبايل وديسكتوب */}
          <div className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square bg-white rounded-2xl overflow-hidden flex items-center justify-center">
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain p-6 md:p-8"
              priority
            />
          </div>

          {/* التفاصيل */}
          <div className="flex flex-col justify-between py-2">
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 leading-tight">{product.name}</h2>
              <p className="text-sm md:text-base text-purple-300 mb-6">المتجر: {product.storeName} • {product.category}</p>

              <div className="bg-white/5 rounded-2xl p-4 md:p-5 mb-6 border border-white/5">
                <p className="text-purple-200 text-sm mb-1">السعر:</p>
                <p className="text-3xl md:text-4xl font-bold text-white">{Number(product.price).toLocaleString()} <span className="text-lg font-normal">ل.ل</span></p>
                {product.stock!== undefined && <p className="text-xs md:text-sm text-gray-400 mt-2">الكمية المتاحة: {product.stock}</p>}
              </div>

              {product.description && (
                <div className="mb-6">
                  <p className="text-sm md:text-base font-bold text-purple-200 mb-2">الوصف:</p>
                  <p className="text-sm md:text- text-gray-300 leading-7 whitespace-pre-line">{product.description}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 text-xs md:text-sm text-purple-300 mb-8">
                <span className="bg-white/5 px-4 py-2 rounded-full border border-white/10">الوحدة: {product.unit}</span>
                {product.available === false && <span className="bg-red-500/20 text-red-300 px-4 py-2 rounded-full">غير متوفر</span>}
                {product.available!== false && <span className="bg-green-500/20 text-green-300 px-4 py-2 rounded-full">متوفر</span>}
              </div>
            </div>

            {/* زر الشراء - ديسكتوب جوات الكارد، موبايل ثابت تحت */}
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

      {/* زر موبايل ثابت */}
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

      {toast && (<div className="fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-3 rounded-full shadow-2xl z-[999] flex items-center gap-2"><div className="bg-green-500 rounded-full p-1"><Check className="w-3 h-3 text-white" /></div><span className="text-sm font-bold whitespace-nowrap">{toast}</span></div>)}
    </div>
  );
}
