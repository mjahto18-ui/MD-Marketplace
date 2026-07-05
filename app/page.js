'use client';
import { useEffect, useState } from 'react';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{padding: 40, textAlign: 'center'}}>تحميل...</div>;

  return (
    <main style={{padding: 20, fontFamily: 'sans-serif', direction: 'rtl'}}>
      <h1 style={{textAlign: 'center'}}>MD Marketplace</h1>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 20, marginTop: 30}}>
        {products.map(p => (
          <div key={p.id} style={{border: '1px solid #ddd', borderRadius: 8, padding: 15}}>
            <img src={p.image} alt={p.name} style={{width: '100%', height: 200, objectFit: 'cover', borderRadius: 4}} />
            <h3>{p.name}</h3>
            <p style={{color: 'green', fontWeight: 'bold'}}>LB. {p.price}</p>
            <button style={{width: '100%', padding: 10, background: '#000', color: '#fff', border: 'none', borderRadius: 4}}>
              اضف للسلة
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
