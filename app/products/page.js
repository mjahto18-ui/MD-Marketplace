'use client';
import { useEffect, useState } from 'react';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // بدك تجيب customerID من السيشن
  const customerID = "5482cbf7"; // مؤقت

  useEffect(() => {
    fetch('/api/products')
     .then(res => res.json())
     .then(data => {
        if (data.success) setProducts(data.products);
        setLoading(false);
      });
  }, []);

  const addToCart = async (productID) => {
    const res = await fetch('/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerID, productID, qty: 1 })
    });
    const data = await res.json();
    alert(data.message);
  };

  if (loading) return <div>جاري التحميل...</div>;

  return (
    <div style={{ padding: 20, direction: 'rtl' }}>
      <h1>كل المنتجات</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {products.map(product => (
          <div key={product.productID} style={{ border: '1px solid #ccc', padding: 10 }}>
            <img src={product.image} width="100%" />
            <h3>{product.name}</h3>
            <p>المتجر: {product.storeName}</p>
            <p>السعر: {product.price.toLocaleString()} ل.ل</p>
            <p>الوزن: {product.weightPoint} نقطة</p>
            <button onClick={() => addToCart(product.productID)}>
              اضف للسلة
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
