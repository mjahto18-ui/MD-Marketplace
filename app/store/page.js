'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function StoresPage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stores')
      .then(res => res.json())
      .then(data => {
        if (data.success) setStores(data.stores);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>جاري التحميل...</div>;

  return (
    <div style={{ padding: 20, direction: 'rtl' }}>
      
      {/* زر رجوع */}
      <Link href="/shop" style={{ display: 'inline-block', marginBottom: 20 }}>
        <button style={{
          padding: '10px 20px',
          background: '#444',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer'
        }}>
          رجوع
        </button>
      </Link>

      <h1>كل المتاجر</h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 20
      }}>
        {stores.map(store => (
          <Link key={store.storeID} href={`/store/${store.storeID}`}>
            <div style={{
              border: '1px solid #ccc',
              padding: 10,
              cursor: 'pointer',
              borderRadius: 10,
              background: '#fff'
            }}>
              
              {/* صورة المتجر */}
              <img 
                src={store.image}
                style={{
                  width: '100%',
                  height: 120,
                  objectFit: 'cover',
                  borderRadius: 8,
                  background: '#eee'
                }}
              />

              <h3 style={{ marginTop: 10 }}>{store.storeName}</h3>
              <p style={{ color: '#555' }}>{store.address}</p>

            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
