'use client';
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function StorePage() {
  const { id: storeID } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const customerID = "5482cbf7"; // مؤقت

  useEffect(() => {
    fetch(`/api/products/by-store?id=${storeID}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setProducts(data.products);
        setLoading(false);
      });
  }, [storeID]);

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
      <h1>منتجات المتجر</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {products.map(product => (
          <div key={product["Product ID"]} style={{ border: '1px solid #ccc', padding: 10 }}>
            <img src={product["Image"]} width="100%" />
            <h3>{product["Product Name"]}</h3>
            <p>السعر: {Number(product["Price"]).toLocaleString()} ل.ل</p>
            <p>الوزن: {product["Weight Points"]} نقطة</p>
            <button onClick={() => addToCart(product["Product ID"])}>
              اضف للسلة
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
