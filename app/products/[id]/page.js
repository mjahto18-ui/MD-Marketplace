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
    fetch('/api/global-config').then(r=>r.json()).then(d=>setGlobalCfg(d)).catch(()=>{});
    fetch('/api/me', { credentials: 'include' }).then(r=>r.json()).then(d=>{
      if(d.user?.customerId) setIsCustomer(true);
    }).catch(()=>{});
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        console.log("Loading product detail", id);
        const res = await fetch(`/api/products/${id}`);
        const json = await res.json();
        console.log("Detail response", json);
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

      <header className="px-4 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="bg-white/10 p-2 rounded-xl active:scale-90 transition"><ChevronRight className="w-5 h-5" /></button>
        <h1 className="text-lg font-bold truncate">{product.name}</h1>
      </header>

      <div className="px-4 pb-28">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="relative w-full h- bg-white flex items-center justify-center overflow-hidden">
            <Image src={product.image} alt={product.name} fill className="object-contain p-4" />
          </div>
          <div className="p-4">
            <h2 className="text-2xl font-bold mb-1">{product.name}</h2>
            <p className="text-sm text-purple-300 mb-3">المتجر: {product.storeName} • {product.category}</p>

            <div className="bg-white/5 rounded-xl p-3 mb-4">
              <p className="text-purple-200 text-sm">السعر:</p>
              <p className="text-2xl font-bold text-white">{Number(product.price).toLocaleString()} ل.ل</p>
              {product.stock!== undefined && <p className="text-xs text-gray-400 mt-1">الكمية المتاحة: {product.stock}</p>}
            </div>

            {product.description && (
              <div className="mb-4">
                <p className="text-sm font-bold text-purple-200 mb-1">الوصف:</p>
                <p className="text-sm text-gray-300 leading-6">{product.description}</p>
              </div>
            )}

            <div className="flex gap-2 text-xs text-purple-300">
              <span className="bg-white/5 px-3 py-1 rounded-full">الوحدة: {product.unit}</span>
              {product.available === false && <span className="bg-red-500/20 text-red-300 px-3 py-1 rounded-full">غير متوفر</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 to-transparent">
        {isCustomer? (
          <button onClick={addToCart} disabled={adding || product.available === false} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50">
            {adding? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <ShoppingCart className="w-5 h-5" />}
            {adding? '...' : 'اضف للسلة'}
          </button>
        ) : (
          <button onClick={()=>router.push('/login')} className="w-full bg-white/10 py-4 rounded-2xl font-bold">سجل دخول للطلب</button>
        )}
      </div>

      {toast && (<div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-3 rounded-full shadow-2xl z-[999] flex items-center gap-2"><div className="bg-green-500 rounded-full p-1"><Check className="w-3 h-3 text-white" /></div><span className="text-sm font-bold">{toast}</span></div>)}
    </div>
  );
}
