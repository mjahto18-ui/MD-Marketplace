'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, ChevronRight, Plus, Minus, Trash2, Banknote, Wallet, Check } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [totalWeight, setTotalWeight] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);

  const customerID = "5482cbf7";

  const fetchCart = async () => {
    setLoading(true);
    const res = await fetch(`/api/cart?customerID=${customerID}`);
    const data = await res.json();

    if (data.success) {
      setCart(data.cart);
      setTotalWeight(data.totalWeight);
      setSubtotal(data.subtotal);

      // ===== نفس منطق الـ checkout بالحرف =====
      const totalPoints = data.totalWeight;
      const freeRemaining = data.freeDeliveryRemaining || 0;
      const lastDate = data.lastFreeDeliveryDate || "";
      const today = new Date().toISOString().split('T')[0];
      const baseFee = data.baseDeliveryFee || 0;

      let finalFee;
      if (freeRemaining === 0) {
        finalFee = baseFee;
      } else {
        if (lastDate === today) {
          finalFee = baseFee;
        } else {
          finalFee = totalPoints <= 10 ? 0 : baseFee;
        }
      }
      setDeliveryFee(finalFee);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCart(); }, []);

  const updateQty = async (cartID, newQty) => {
    if (newQty < 1) return;
    await fetch('/api/cart/update', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cartID, qty: newQty }) });
    fetchCart();
  };

  const removeItem = async (productID) => {
    await fetch(`/api/cart/remove?customerID=${customerID}&productID=${productID}`, { method: 'DELETE' });
    fetchCart();
  };

  const total = subtotal + deliveryFee;

  if (loading) return <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-slate-950 flex items-center justify-center text-white">جاري التحميل...</div>;

  if (cart.length === 0) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-slate-950 text-white" style={{ direction: 'rtl' }}>
      <header className="px-4 pt-6 pb-4"><div className="flex items-center justify-between mb-3"><button onClick={() => router.back()}><ChevronRight className="w-6 h-6" /></button><div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center"><ShoppingCart className="w-7 h-7" /></div><div className="w-6"></div></div></header>
      <div className="flex flex-col items-center justify-center mt-20 px-4"><ShoppingCart className="w-20 h-20 text-purple-400 mb-4" /><p className="text-xl font-bold mb-2">السلة فاضية</p><button onClick={() => router.push('/')} className="bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-3 rounded-2xl font-bold mt-4">تصفح المنتجات</button></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white" style={{ direction: 'rtl' }}>
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
            <div className="flex justify-between items-center"><span className="text-purple-200">رسوم التوصيل {deliveryFee === 0 && totalWeight > 0 ? '(مجاني)' : ''}</span><span className={deliveryFee === 0 ? 'text-green-400 font-bold' : ''}>{deliveryFee === 0 && totalWeight > 0 ? 'مجاني' : `${deliveryFee.toLocaleString()} LBP`}</span></div>
            <div className="border-t border-dashed border-white/20 my-3"></div>
            <div className="flex justify-between items-center text-lg font-bold"><span>الإجمالي</span><span className="text-fuchsia-400">{total.toLocaleString()} LBP</span></div>
          </div>
        </div>

        <h3 className="text-lg font-bold mb-3 text-center">طريقة الدفع</h3>

        <div className="w-full bg-white/5 backdrop-blur-xl p-4 rounded-2xl border-2 border-fuchsia-500 shadow-lg shadow-fuchsia-500/30 mb-3 flex items-center gap-3 text-right">
          <div className="bg-white/10 p-3 rounded-xl"><Banknote className="w-6 h-6" /></div>
          <div className="flex-1"><p className="font-bold">الدفع نقداً عند الاستلام</p><p className="text-xs text-purple-300">الدفع عند استلام الطلب</p></div>
          <div className="bg-fuchsia-500 rounded-full p-1"><Check className="w-5 h-5" /></div>
        </div>

        <div className="w-full bg-white/5 backdrop-blur-xl p-4 rounded-2xl border border-white/10 mb-6 flex items-center gap-3 text-right opacity-60">
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl"><Wallet className="w-6 h-6" /></div>
          <div className="flex-1"><p className="font-bold">المحفظة <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs mr-2">قريباً</span></p><p className="text-xs text-purple-300">{walletBalance.toLocaleString()} LBP</p></div>
        </div>

        <button onClick={() => router.push('/checkout')} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 py-4 rounded-2xl text-white font-bold text-lg shadow-lg shadow-purple-500/50 active:scale-95 transition">تأكيد الطلب {total.toLocaleString()} LBP</button>
        <p className="text-center text-xs text-purple-300 mt-4">بالمتابعة، أنت توافق على الشروط والأحكام</p>
      </div>
    </div>
  );
}
