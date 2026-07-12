'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [totalWeight, setTotalWeight] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // بدك تجيب customerID من السيشن/الكوكيز
  const customerID = "5482cbf7"; // مؤقت

  const fetchCart = async () => {
    setLoading(true);
    const res = await fetch(`/api/cart?customerID=${customerID}`);
    const data = await res.json();
    if (data.success) {
      setCart(data.cart);
      setTotalWeight(data.totalWeight);
      setSubtotal(data.subtotal);
      
      // احسب الدلفري بنفس معادلتك - نسخ لصق
      // لازم تجيب Delivery Rates + Customers من API تاني او تحطهم هون
      // مؤقت: خلينا نقول السعر 15000 اذا الوزن > 10
      const isFree = totalWeight <= 10; // هون لازم تشيك Free Delivery Remaining
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
    fetchCart(); // اعادة تحميل
  };

  const removeItem = async (cartID) => {
    await fetch(`/api/cart/remove?cartID=${cartID}`, { method: 'DELETE' });
    fetchCart();
  };

  // المعادلة: Total = Subtotal + Delivery Fee
  const total = subtotal + deliveryFee;

  if (loading) return <div>جاري التحميل...</div>;
  if (cart.length === 0) return <div>السلة فاضية</div>;

  return (
    <div style={{ padding: 20, direction: 'rtl' }}>
      <h1>سلة التسوق</h1>
      
      {cart.map(item => (
        <div key={item.cartID} style={{ border: '1px solid #ccc', padding: 10, margin: 10 }}>
          <img src={item.image} width={80} />
          <h3>{item.name}</h3>
          <p>المتجر: {item.storeName}</p>
          <p>السعر: {item.unitPrice.toLocaleString()} ل.ل</p>
          <p>الوزن: {item.linePoints} نقطة</p>
          
          <div>
            <button onClick={() => updateQty(item.cartID, item.qty - 1)}>-</button>
            <span> {item.qty} </span>
            <button onClick={() => updateQty(item.cartID, item.qty + 1)}>+</button>
          </div>
          
          <p>المجموع: {item.lineTotal.toLocaleString()} ل.ل</p>
          <button onClick={() => removeItem(item.cartID)}>حذف</button>
        </div>
      ))}

      <hr />
      <h3>ملخص الطلب</h3>
      <p>وزن السلة: {totalWeight} نقطة</p>
      <p>مجموع المنتجات: {subtotal.toLocaleString()} ل.ل</p>
      <p>رسوم التوصيل: {deliveryFee === 0 ? 'مجاني' : deliveryFee.toLocaleString() + ' ل.ل'}</p>
      <h2>المجموع الكلي: {total.toLocaleString()} ل.ل</h2>

      <button onClick={() => router.push('/checkout')}>
        تأكيد الطلب
      </button>
    </div>
  );
}
