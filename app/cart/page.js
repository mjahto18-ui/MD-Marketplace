'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, ChevronRight, Plus, Minus, Trash2 } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [totalWeight, setTotalWeight] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [loading, setLoading] = useState(true);

  // مؤقت – بعدين من /api/me
  const customerID = "5482cbf7";

  const fetchCart = async () => {
    setLoading(true);
    const res = await fetch(`/api/cart?customerID=${customerID}`);
    const data = await res.json();

    if (data.success) {
      setCart(data.cart);
      setTotalWeight(data.totalWeight);
      setSubtotal(data.subtotal);
      const isFree = data.totalWeight <= 10;
      setDeliveryFee(isFree ? 0 : 15000);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCart(); }, []);

  const updateQty = async (cartID, newQty) => {
    if (newQty < 1) return;
    await fetch('/api/cart/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartID, qty: newQty })
    });
    fetchCart();
  };

  const removeItem = async (productID) => {
    await fetch(`/api/cart/remove?customerID=${customerID}&productID=${productID}`, {
      method: 'DELETE'
    });
    fetchCart();
  };

  const total = subtotal + deliveryFee;

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-slate-950 flex items-center justify-center text-white">
        جاري التحميل...
      </div>
    );

  if (cart.length === 0)
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-slate-950 text-white" style={{ direction: 'rtl' }}>
        {/* الهيدر */}
        <header className="px-4 pt-6 pb-4">
          <div className="flex items-center justify-between mb-3">
            <button className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 rounded-xl text-sm font-medium">تسجيل دخول</button>
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <ShoppingCart className="w-7 h-7" />
            </div>
            <button className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl">
              <ShoppingCart className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold">MD Marketplace</h1>
            <p className="text-xs text-purple-300">تصفح كزائر</p>
          </div>
        </header>

        <div className="flex flex-col items-center justify-center mt-20 px-4">
          <ShoppingCart className="w-20 h-20 text-purple-400 mb-4" />
          <p className="text-xl font-bold mb-2">السلة فاضية</p>
          <p className="text-purple-200 mb-6">ابدأ التسوق واملأها بالمنتجات</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-3 rounded-2xl font-bold"
          >
            تصفح المنتجات
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white" style={{ direction: 'rtl' }}>
      
      {/* الهيدر تبع MD */}
      <header className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-3">
          <button className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 rounded-xl text-sm font-medium shadow-lg shadow-purple-500/30">
            تسجيل دخول
          </button>
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/50">
            <ShoppingCart className="w-7 h-7" />
          </div>
          <button className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl shadow-lg shadow-purple-500/30">
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold">MD Marketplace</h1>
          <p className="text-xs text-purple-300">تصفح كزائر</p>
        </div>
      </header>

      <div className="px-4 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <ChevronRight className="w-6 h-6" />
          <h2 className="text-2xl font-bold">سلة التسوق</h2>
        </div>
        <p className="text-purple-200 mb-6 mr-8">{cart.length} عناصر</p>

        {/* كروت المنتجات */}
        <div className="flex flex-col gap-3">
          {cart.map(item => (
            <div key={item.cartID} className="bg-white/5 backdrop-blur-xl p-4 rounded-2xl border border-white/10 flex gap-3">
              <img src={item.image} className="w-20 h-20 rounded-xl object-cover" />
              
              <div className="flex-1">
                <h3 className="font-bold text-sm mb-1">{item.name}</h3>
                <p className="text-purple-300 text-xs mb-1">المتجر: {item.storeName}</p>
                <p className="text-xs text-purple-200">الوزن: {item.linePoints} نقطة</p>

                <div className="flex items-center gap-2 mt-3">
                  <button 
                    onClick={() => updateQty(item.cartID, item.qty - 1)}
                    className="bg-white/10 p-2 rounded-lg active:scale-90 transition"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-bold">{item.qty}</span>
                  <button 
                    onClick={() => updateQty(item.cartID, item.qty + 1)}
                    className="bg-white/10 p-2 rounded-lg active:scale-90 transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => removeItem(item.productID)}
                    className="mr-auto text-red-400 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-left">
                <p className="text-xs text-purple-300">{item.unitPrice.toLocaleString()} ل.ل</p>
                <p className="font-bold text-fuchsia-400">{item.lineTotal.toLocaleString()} ل.ل</p>
              </div>
            </div>
          ))}
        </div>

        {/* ملخص الطلب */}
        <div className="bg-white/5 backdrop-blur-xl p-5 rounded-2xl border border-white/10 mt-6">
          <h3 className="font-bold mb-4 text-center text-purple-200">ملخص الطلب</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-purple-200">وزن السلة</span>
              <span>{totalWeight} نقطة</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-200">مجموع المنتجات</span>
              <span>{subtotal.toLocaleString()} ل.ل</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-200">رسوم التوصيل</span>
              <span className={deliveryFee === 0 ? 'text-green-400' : ''}>
                {deliveryFee === 0 ? 'مجاني' : deliveryFee.toLocaleString() + ' ل.ل'}
              </span>
            </div>
            <div className="border-t border-dashed border-white/20 my-3"></div>
            <div className="flex justify-between text-lg font-bold">
              <span>المجموع الكلي</span>
              <span className="text-fuchsia-400">{total.toLocaleString()} ل.ل</span>
            </div>
          </div>
        </div>

        {/* زر الانتقال للدفع */}
        <button
          onClick={() => router.push('/checkout')}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 py-4 rounded-2xl text-white font-bold text-lg mt-6 shadow-lg shadow-purple-500/50 active:scale-95 transition"
        >
          الانتقال للدفع {total.toLocaleString()} ل.ل
        </button>
      </div>
    </div>
  );
}
