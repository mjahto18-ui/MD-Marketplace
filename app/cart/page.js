'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, ChevronRight, Plus, Minus, Trash2, Banknote, Wallet, Check, ArrowLeft } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [totalWeight, setTotalWeight] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [customerID, setCustomerID] = useState(null);
  const [globalCfg, setGlobalCfg] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);

  useEffect(() => {
    fetch('/api/global-config').then(r=>r.json()).then(d=>{setGlobalCfg(d); setConfigLoading(false);}).catch(()=>setConfigLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/me', { credentials: 'include' }).then(async (res) => {
      if (!res.ok) { setLoading(false); router.push('/login'); return; }
      const data = await res.json();
      if (data.user?.customerId) setCustomerID(data.user.customerId);
      else { setLoading(false); router.push('/login'); }
    }).catch(()=>{setLoading(false); router.push('/login');});
  }, [router]);

  const fetchCart = async () => {
    if (!customerID) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/cart?customerID=${customerID}`);
      const data = await res.json();
      if (data.success) {
        setCart(data.cart); setTotalWeight(data.totalWeight); setSubtotal(data.subtotal);
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

  useEffect(()=>{ if(customerID) fetchCart(); }, [customerID]);

  const updateQty = async (cartID, newQty) => {
    if (globalCfg?.isCartClosed) return;
    if (newQty < 1) return;
    await fetch('/api/cart/update', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cartID, qty: newQty }) });
    fetchCart();
  };

  const removeItem = async (productID) => {
    if (globalCfg?.isCartClosed) return;
    await fetch(`/api/cart/remove?customerID=${customerID}&productID=${productID}`, { method: 'DELETE' });
    fetchCart();
  };

  const total = subtotal + deliveryFee;
  const isCartBlocked = globalCfg?.isCartClosed; // شلنا isComingSoon نهائيا

  if (configLoading) return <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-slate-950 flex items-center justify-center text-white">جاري التحميل...</div>;

  // حداد فقط
  if (globalCfg?.isLocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-slate-950 text-white flex flex-col items-center justify-center px-6" style={{ direction: 'rtl' }}>
        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">🔒</div>
          <h1 className="text-2xl font-bold mb-3">{globalCfg.emergency_lock?.message || 'المنصة متوقفة حداداً'}</h1>
          <button onClick={() => router.back()} className="w-full bg-white/10 py-3 rounded-2xl font-bold mt-6 flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4"/> رجوع
          </button>
        </div>
      </div>
    );
  }

  if (!customerID || loading) return <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-slate-950 flex items-center justify-center text-white">جاري التحميل...</div>;

  if (cart.length === 0) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-slate-950 text-white" style={{ direction: 'rtl' }}>
      <header className="px-4 pt-6 pb-4"><div className="flex items-center justify-between mb-3"><button onClick={() => router.back()}><ChevronRight className="w-6 h-6" /></button><div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center"><ShoppingCart className="w-7 h-7" /></div><div className="w-6"></div></div></header>
      <div className="flex flex-col items-center justify-center mt-20 px-4"><ShoppingCart className="w-20 h-20 text-purple-400 mb-4" /><p className="text-xl font-bold mb-2">السلة فاضية</p><button onClick={() => router.back()} className="bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-3 rounded-2xl font-bold mt-4">رجوع</button></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white" style={{ direction: 'rtl' }}>
      {isCartBlocked && (
        <div className="bg-amber-500 text-black text-center py-3 px-4 font-bold sticky top-0 z-50">
          {globalCfg.cart_closed_message || "السلة مغلقة حالياً"}
        </div>
      )}

      <header className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-3"><button onClick={() => router.back()}><ChevronRight className="w-6 h-6" /></button><div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/50"><ShoppingCart className="w-7 h-7" /></div><div className="w-6"></div></div>
        <div className="text-center"><h1 className="text-xl font-bold">MD Marketplace</h1></div>
      </header>
      <div className="px-4 pb-6">
        <h2 className="text-2xl font-bold mb-6">إتمام الطلب</h2>
        <div className="flex flex-col gap-3 mb-6">
          {cart.map(item => (
            <div key={item.cartID} className="bg-white/5 backdrop-blur-xl p-3 rounded-2xl border border-white/10 flex gap-3 items-center">
              <img src={item.image} className="w-16 h-16 rounded-xl object-cover" />
              <div className="flex-1">
                <h3 className="font-bold text-sm">{item.name}</h3>
                <p className="text-xs text-purple-300">{item.unitPrice.toLocaleString()} LBP • الكمية {item.qty}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button disabled={isCartBlocked} onClick={() => updateQty(item.cartID, item.qty - 1)} className="bg-white/10 p-1.5 rounded-lg active:scale-90 disabled:opacity-30"><Minus className="w-3.5 h-3.5" /></button>
                  <span className="font-bold text-sm w-6 text-center">{item.qty}</span>
                  <button disabled={isCartBlocked} onClick={() => updateQty(item.cartID, item.qty + 1)} className="bg-white/10 p-1.5 rounded-lg active:scale-90 disabled:opacity-30"><Plus className="w-3.5 h-3.5" /></button>
                  <button disabled={isCartBlocked} onClick={() => removeItem(item.productID)} className="mr-auto text-red-400 p-1.5 disabled:opacity-30"><Trash2 className="w-4 h-4" /></button>
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

        {isCartBlocked? (
          <>
            <button disabled className="w-full bg-gray-600 py-4 rounded-2xl text-white font-bold text-lg cursor-not-allowed">
              {globalCfg.cart_closed_message || "السلة مغلقة حالياً"}
            </button>
            <button onClick={() => router.back()} className="w-full bg-white/10 py-3 rounded-2xl font-bold mt-3 flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4"/> رجوع
            </button>
          </>
        ) : (
          <button onClick={() => router.push('/checkout')} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 py-4 rounded-2xl text-white font-bold text-lg shadow-lg shadow-purple-500/50 active:scale-95 transition">تأكيد الطلب {total.toLocaleString()} LBP</button>
        )}
      </div>
    </div>
  );
}
