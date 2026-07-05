'use client';
import { useEffect, useState } from 'react';
import { FaPlus, FaMinus, FaShoppingCart } from "react-icons/fa";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // كمية كل منتج
  const [qty, setQty] = useState({});

  const increaseQty = (id) => {
    setQty(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    animateQty(id);
  };

  const decreaseQty = (id) => {
    setQty(prev => ({ ...prev, [id]: Math.max((prev[id] || 0) - 1, 0) }));
    animateQty(id);
  };

  const addToCart = (id) => {
    animateCart(id);
    console.log("Product:", id, "Qty:", qty[id] || 0);
  };

  // Animation للعدد
  const animateQty = (id) => {
    const el = document.getElementById(`qty-${id}`);
    if (!el) return;
    el.style.transform = "scale(1.3)";
    el.style.transition = "0.15s";
    setTimeout(() => {
      el.style.transform = "scale(1)";
    }, 150);
  };

  // Animation للسلة
  const animateCart = (id) => {
    const el = document.getElementById(`cart-${id}`);
    if (!el) return;
    el.style.transform = "scale(1.2)";
    el.style.transition = "0.2s";
    setTimeout(() => {
      el.style.transform = "scale(1)";
    }, 200);
  };

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

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: 20,
        marginTop: 30
      }}>
        {products.map(p => (
          <div key={p.id} style={{
            border: '1px solid #ddd',
            borderRadius: 8,
            padding: 15
          }}>
            <img 
              src={p.image} 
              alt={p.name} 
              style={{
                width: '100%',
                height: 200,
                objectFit: 'cover',
                borderRadius: 4
              }} 
            />

            <h3>{p.name}</h3>
            <p style={{color: 'green', fontWeight: 'bold'}}>LB. {p.price}</p>

            {/* زر الكمية + السلة */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 15,
              background: '#fafafa',
              padding: 12,
              borderRadius: 10,
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
            }}>
              
              {/* ناقص */}
              <button 
                onClick={() => decreaseQty(p.id)}
                style={{
                  background: '#f0f0f0',
                  border: 'none',
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: 20,
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                <FaMinus />
              </button>

              {/* العدد */}
              <span 
                id={`qty-${p.id}`}
                style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  width: 40,
                  textAlign: 'center'
                }}
              >
                {qty[p.id] || 0}
              </span>

              {/* زائد */}
              <button 
                onClick={() => increaseQty(p.id)}
                style={{
                  background: '#000',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: 20,
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                <FaPlus />
              </button>

              {/* السلة */}
              <button 
                id={`cart-${p.id}`}
                onClick={() => addToCart(p.id)}
                style={{
                  background: '#ff9800',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 14px',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 18,
                  cursor: 'pointer'
                }}
              >
                <FaShoppingCart size={22} />
              </button>

            </div>

          </div>
        ))}
      </div>
    </main>
  );
}
