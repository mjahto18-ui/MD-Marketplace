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
      <h1>كل المتاجر</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {stores.map(store => (
          <Link key={store.storeID} href={`/store/${store.storeID}`}>
            <div style={{ border: '1px solid #ccc', padding: 10, cursor: 'pointer' }}>
              <img src={store.image} width="100%" />
              <h3>{store.storeName}</h3>
              <p>{store.address}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
