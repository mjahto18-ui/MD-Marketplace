'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, ChevronRight, Plus, Minus, Trash2, ArrowLeft } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [totalWeight, setTotalWeight] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [loading, setLoading] = useState(true);
  const [customerID, setCustomerID] = useState(null);
  const [globalCfg, setGlobalCfg] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);
  const hasRedirected = useRef(false);

  useEffect(() => {
    fetch('/api/global-config', { cache: 'no-store' })
   .then(r=>r.json())
   .then(d=>{ setGlobalCfg(d); setConfigLoading(false); })
   .catch(()=>setConfigLoading(false));
  }, []);

  useEffect(() => {
    if(configLoading) return;
    if(globalCfg?.isLocked) { setLoading(false); return; }

    let cancelled = false;
    fetch('/api/me', { credentials: 'include', cache: 'no-store' })
   .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          if (!hasRedirected.current) {
            hasRedirected.current = true;
            router.replace('/login');
          }
          return;
        }
        const data = await res.json();
        if (data.user?.customerId) {
          setCustomerID(data.user.customerId);
        } else {
          if (!hasRedirected.current) {
            hasRedirected.current = true;
            router.replace('/login');
          }
        }
      })
   .catch(()=> {
        if (!hasRedirected.current) {
          hasRedirected.current = true;
          router.replace('/login');
        }
      })
   .finally(()=> { if(!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [router, configLoading, globalCfg]);

  const fetchCart = async () => {
    if (!customerID) return;
    if(globalCfg?.isCartClosed) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/cart?customerID=${customerID}`, { credentials: 'include', cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setCart(data.cart || []);
        setTotalWeight(data.totalWeight);
        setSubtotal(data.subtotal);
        const totalPoints = data.totalWeight;
        const freeRemaining = data.freeDeliveryRemaining || 0;
        const lastDate = data.lastFreeDeliveryDate || "";
        const today = new Date().toISOString().split('T')[0];
        const baseFee = data.baseDeliveryFee || 0;
        let finalFee = freeRemaining === 0? baseFee : (lastDate === today? baseFee : (totalPoints <= 10? 0 : baseFee));
        setDeliveryFee(finalFee);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(()=>{ if(customerID && !globalCfg?.isCartClosed) fetchCart(); }, [customerID, globalCfg]);

  const updateQty = async (cartID, newQty) => {
    if (globalCfg?.isCartClosed) return;
    if (newQty < 1) return;
    await fetch('/api/cart/update', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartID, qty: newQty })
    });
    fetchCart();
  };

  const removeItem = async (productID) => {
    if (globalCfg?.isCartClosed) return;
    await fetch(`/api/cart/remove?customerID=${customerID}&productID=${productID}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    fetchCart();
  };

  const handleBack = () => {
    if (window.history.length > 1) router.back();
    else router.push('/shop');
  };

  if (configLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-slate-950 flex items-center justify-center text-white">جاري التحميل...</div>;
  }

  if (globalCfg?.isLocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-slate-950 text-white flex flex-col items-center justify-center px-6" style={{ direction: 'rtl' }}>
        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">🔒</div>
          <h1 className="text-2xl font-bold mb-3">{globalCfg.emergency_lock?.message || globalCfg.emergency_lock?.raw || 'المنصة متوقفة حداداً'}</h1>
          <button onClick={handleBack} className="w-full bg-white/10 py-3 rounded-2xl font-bold mt-6 flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4"/> رجوع
          </button>
        </div>
      </div>
    );
  }

  if (globalCfg?.isCartClosed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-slate-950 text-white" style={{ direction: 'rtl' }}>
        {globalCfg?.isComingSoon && (
          <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white text-center py-3 px-4 font-bold">
            ⏰ {globalCfg.coming_soon_message || globalCfg.coming_soon?.message}
          </div>
        )}
        <div className="flex flex-col items-center justify-center min-h-screen px-6">
          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 text-center max-w-md w-full">
            <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">🛒</div>
            <h1 className="text-2xl font-bold mb-3">السلة مغلقة حالياً</h1>
            <p className="text-white/70 mb-6">{globalCfg.cart_closed_message || 'السلة مغلقة حاليا'}</p>
            <button onClick={handleBack} className="w-full bg-white/10 py-3 rounded-2xl font-bold flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4"/> رجوع للمتجر
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-slate-950 flex items-center justify-center text-white">جاري التحميل...</div>;
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-slate-950 text-white" style={{ direction: 'rtl' }}>
        {globalCfg?.isComingSoon && (
          <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white text-center py-3 px-4 font-bold">
            ⏰ {globalCfg.coming_soon_message || globalCfg.coming_soon?.message}
          </div>
        )}
        <header className="px-4 pt-6 pb-4"><div className="flex items-center justify-between mb-3"><button onClick={handleBack}><ChevronRight className="w-6 h-6" /></button><div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center"><ShoppingCart className="w-7 h-7" /></div><div className="w-6"></div></div></header>
        <div className="flex flex-col items-center justify-center mt-20 px-4"><ShoppingCart className="w-20 h-20 text-purple-400 mb-4" /><p className="text-xl font-bold mb-2">السلة فاضية</p><button onClick={handleBack} className="bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-3 rounded-2xl font-bold mt-4">رجوع</button></div>
      </div>
    );
  }

  const total = subtotal + deliveryFee;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white" style={{ direction: 'rtl' }}>
      {globalCfg?.isComingSoon && (
        <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white text-center py-2 px-4 font-bold text-sm">
          ⏰ {globalCfg.coming_soon_message || globalCfg.coming_soon?.message}
        </div>
      )}
      <header className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-3"><button onClick={handleBack}><ChevronRight className="w-6 h-6" /></button><div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/50"><ShoppingCart className="w-7 h-7" /></div><div className="w-6"></div></div>
        <div className="text-center"><h1 className="text-xl font-bold">MD Marketplace</h1></div>
      </header>
      <div className="px-4 pb-6">
        <h2 className="text-2xl font-bold mb-6">إتمام الطلب</h2>
        <div className="flex flex-col gap-3 mb-6">
          {cart.map(item => (
            <div key={item.cartID} className="bg-white/5 backdrop-blur-xl p-3 rounded-2xl border border-white/10 flex gap-3 items-center">
              <img src={item.image} className="w-16 h-16 rounded-xl object-cover" alt="" />
              <div className="flex-1">
                <h3 className="font-bold text-sm">{item.name}</h3>
                <p className="text-xs text-purple-300">{item.unitPrice.toLocaleString()} LBP • الكمية {item.qty}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => updateQty(item.cartID, item.qty - 1)} className="bg-white/10 p-1.5 rounded-lg active:scale-90"><Minus className="w-3.5 h-3.5" /></button>
                  <span className="font-bold text-sm w-6 text-center">{item.qty}</span>
                  <button onClick={() => updateQty(item.cartID, item.qty + 1)} className="bg-white/10 p-1.5 rounded-lg active:scale-90"><Plus className="w-3.5 h-3.5" /></button>
                  <button onClick={() => removeItem(item.productID)} className="mr-auto text-red-400 p-1.5"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="text-left font-bold">{item.lineTotal.toLocaleString()} LBP</div>
            </div>
          ))}
        </div>
        <div className="bg-white/5 backdrop-blur-xl p-5 rounded-2xl border border-white/10 mb-6">
          <h3 className="text-lg font-bold mb-4 text-center">ملخص الطلب</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center"><span className="text-purple-200">المجموع الفرعي</span><span>{subtotal.toLocaleString()} LBP</span></div>
            <div className="flex justify-between items-center"><span className="text-purple-200">رسوم التوصيل</span><span>{deliveryFee.toLocaleString()} LBP</span></div>
            <div className="border-t border-dashed border-white/20 my-3"></div>
            <div className="flex justify-between items-center text-lg font-bold"><span>الإجمالي</span><span className="text-fuchsia-400">{total.toLocaleString()} LBP</span></div>
          </div>
        </div>
        <button onClick={() => router.push('/checkout')} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 py-4 rounded-2xl text-white font-bold text-lg shadow-lg shadow-purple-500/50 active:scale-95 transition">تأكيد الطلب {total.toLocaleString()} LBP</button>
      </div>
    </div>
  );
}
