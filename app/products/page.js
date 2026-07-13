'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);   // ← للفلترة
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");       // ← نص الفلتر

  const customerID = "5482cbf7"; // مؤقت

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProducts(data.products);
          setFiltered(data.products); // ← أول مرة نفس الشي
        }
        setLoading(false);
      });
  }, []);

  // فلترة حسب الاسم
  useEffect(() => {
    const text = search.trim().toLowerCase();
    if (!text) {
      setFiltered(products);
      return;
    }

    const result = products.filter(p =>
      p.name?.toLowerCase().includes(text)
    );

    setFiltered(result);
  }, [search, products]);

  const addToCart = async (productID) => {
    const res = await fetch('/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerID, productID, qty: 1 })
    });
    const data = await res.json();
    alert(data.message);
  };

  if (loading) return <div style={{ color: 'white', padding: 20 }}>جاري التحميل...</div>;

  return (
    <div style={{ padding: 20, direction: 'rtl', background: '#000', minHeight: '100vh', color: 'white' }}>
      
      {/* زر الرجوع */}
      <button 
        onClick={() => router.back()}
        style={{
          background: '#444',
          color: 'white',
          padding: '10px 20px',
          borderRadius: 8,
          border: 'none',
          marginBottom: 20,
          cursor: 'pointer'
        }}
      >
        رجوع
      </button>

      <h1 style={{ marginBottom: 20 }}>كل المنتجات</h1>

      {/* فلتر البحث */}
      <input
        type="text"
        placeholder="ابحث عن منتج..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          padding: 12,
          marginBottom: 20,
          borderRadius: 8,
          border: 'none',
          fontSize: 16
        }}
      />

      {/* Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
        gap: 15 
      }}>
        {filtered.map(product => (
          <div 
            key={product.productID} 
            style={{ 
              background: '#111',
              borderRadius: 10,
              padding: 10,
              textAlign: 'center'
            }}
          >
            <img 
              src={product.image} 
              style={{ 
                width: '100%', 
                height: 120, 
                objectFit: 'cover', 
                borderRadius: 8 
              }} 
            />

            <h3 style={{ fontSize: 16, marginTop: 10 }}>{product.name}</h3>
            <p style={{ fontSize: 13, color: '#ccc' }}>المتجر: {product.storeName}</p>
            <p style={{ fontSize: 13 }}>السعر: {product.price.toLocaleString()} ل.ل</p>
            <p style={{ fontSize: 13 }}>الوزن: {product.weightPoint} نقطة</p>

            {/* زر السلة */}
            <button 
              onClick={() => addToCart(product.productID)}
              style={{
                marginTop: 10,
                background: '#e91e63',
                color: 'white',
                padding: '8px 12px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              اضف للسلة
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
