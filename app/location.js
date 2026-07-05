'use client';
import { useEffect } from 'react';

export default function LocationPage() {

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log('Location:', pos.coords);
        window.location.href = '/pending';
      },
      (err) => {
        alert('يجب السماح للموقع لإكمال التسجيل');
      }
    );
  }, []);

  return (
    <main style={pageStyle}>
      <div style={boxStyle}>
        <h2 style={titleStyle}>جاري تحديد موقعك…</h2>
        <p style={{ opacity: 0.85 }}>
          الرجاء السماح للتطبيق بالحصول على موقعك لإكمال التسجيل.
        </p>
      </div>
    </main>
  );
}

const pageStyle = {
  minHeight: '100vh',
  padding: 20,
  direction: 'rtl',
  background: 'radial-gradient(circle at top, #3b1d5a 0%, #0b0b16 55%, #000000 100%)',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const boxStyle = {
  background: 'rgba(10, 10, 22, 0.95)',
  borderRadius: 18,
  padding: 24,
  width: '100%',
  maxWidth: 450,
  boxShadow: '0 18px 40px rgba(0,0,0,0.6)',
  border: '1px solid rgba(255,255,255,0.08)',
  textAlign: 'center'
};

const titleStyle = { margin: 0, fontSize: 22 };
