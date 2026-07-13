'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [totalWeight, setTotalWeight] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [loading, setLoading] = useState(true);

  // مؤقت – لازم يجي من /api/me
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

  useEffect(() => {
    fetchCart();
  }, []);

  const updateQty = async (cartID, newQty) => {
    if (newQty < 1) return;
    await fetch('/api/cart/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartID, qty: newQty })
    });
    fetchCart();
  };

  // 🔥 النسخة الصحيحة للحذف
  const removeItem = async (productID) => {
    await fetch(`/api/cart/remove?customerID=${customerID}&productID=${productID}`, {
      method: 'DELETE'
    });
    fetchCart();
  };

  const total = subtotal + deliveryFee;

  if (loading)
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center text-white">
        جاري التحميل...
      </div>
    );

  if (cart.length === 0)
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center text-white text-xl">
        السلة فاضية
      </div>
    );

  return (
    <div className="min-h-screen gradient-bg p-4 text-white" style={{ direction: 'rtl' }}>
      
      <h1 className="text-xl font-bold mb-4">سلة التسوق</h1>

      {/* كروت المنتجات */}
      <div className="flex flex-col gap-4">
        {cart.map(item => (
          <div key={item.cartID} className="glass p-4 rounded-2xl border border-white/10 flex gap-4">
            
            {/* صورة المنتج */}
            <img 
              src={item.image} 
              className="w-20 h-20 rounded-xl object-cover"
            />

            {/* تفاصيل المنتج */}
            <div className="flex-1">
              <h3 className="font-bold">{item.name}</h3>
              <p className="text-purple-200 text-sm">المتجر: {item.storeName}</p>
              <p className="text-sm">السعر: {item.unitPrice.toLocaleString()} ل.ل</p>
              <p className="text-sm">الوزن: {item.linePoints} نقطة</p>

              {/* تعديل الكمية */}
              <div className="flex items-center gap-3 mt-2">
                <button 
                  onClick={() => updateQty(item.cartID, item.qty - 1)}
                  className="bg-white/10 px-3 py-1 rounded-lg"
                >
                  -
                </button>

                <span>{item.qty}</span>

                <button 
                  onClick={() => updateQty(item.cartID, item.qty + 1)}
                  className="bg-white/10 px-3 py-1 rounded-lg"
                >
                  +
                </button>
              </div>

              {/* حذف */}
              <button 
                onClick={() => removeItem(item.productID)}
                className="mt-3 text-red-400 text-sm"
              >
                حذف المنتج
              </button>
            </div>

            {/* المجموع */}
            <div className="text-right font-bold">
              {item.lineTotal.toLocaleString()} ل.ل
            </div>
          </div>
        ))}
      </div>

      {/* ملخص الطلب */}
      <div className="glass p-4 rounded-2xl border border-white/10 mt-6">
        <h3 className="font-bold mb-2">ملخص الطلب</h3>
        <p>وزن السلة: {totalWeight} نقطة</p>
        <p>مجموع المنتجات: {subtotal.toLocaleString()} ل.ل</p>
        <p>رسوم التوصيل: {deliveryFee === 0 ? 'مجاني' : deliveryFee.toLocaleString() + ' ل.ل'}</p>
        <h2 className="text-lg font-bold mt-2">المجموع الكلي: {total.toLocaleString()} ل.ل</h2>
      </div>

      {/* زر تأكيد الطلب */}
      <button
        onClick={() => router.push('/checkout')}
        className="w-full bg-pink-600 py-3 rounded-2xl text-white font-bold text-lg mt-6"
      >
        تأكيد الطلب {total.toLocaleString()} ل.ل
      </button>

    </div>
  );
}
