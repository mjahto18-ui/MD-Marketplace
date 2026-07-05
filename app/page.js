'use client';
import { useState } from 'react';

export default function Home() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    console.log('Login:', { userId, password });
  };

  const handleRegister = () => {
    console.log('Register clicked');
  };

  const handleContact = () => {
    console.log('Contact clicked');
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: 20,
        fontFamily: 'sans-serif',
        direction: 'rtl',
        background: 'radial-gradient(circle at top, #3b1d5a 0%, #0b0b16 55%, #000000 100%)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1200,
          display: 'flex',
          flexDirection: 'column',
          gap: 20
        }}
      >

        {/* الكمبيوتر والتابلت */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 20
          }}
        >

          {/* Box الميزات */}
          <div
            style={{
              background: 'rgba(15, 15, 30, 0.9)',
              borderRadius: 18,
              padding: 24,
              boxShadow: '0 18px 40px rgba(0,0,0,0.55)',
              border: '1px solid rgba(255,255,255,0.06)'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 18
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #ff9800, #ff5722)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: 22
                }}
              >
                🛒
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 'bold' }}>MD‑Marketplace</div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>منصة رقمية للمتاجر والخدمات</div>
              </div>
            </div>

            <p style={{ fontSize: 14, lineHeight: 1.7, opacity: 0.9, marginBottom: 18 }}>
              واجهة موحّدة لإدارة الطلبات، الخدمات المميزة، الكوبونات، النقاط، المحفظة الرقمية،
              وتتبع الخرائط لخدمات التوصيل الخاصة، مع تجربة موجهة للسوق السعودي.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 10,
                marginTop: 10
              }}
            >
              {[
                'طلبات من المتاجر',
                'خدمة مميزة',
                'كوبونات وعروض',
                'نقاط ولاء',
                'محفظة رقمية',
                'تتبع على الخريطة',
                'خدمات دليفري خاصة',
                'جميع المنتجات',
                'جميع المتاجر',
                'محلات وبراندات عالمية'
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: 12,
                    padding: 10,
                    border: '1px solid rgba(255,255,255,0.06)',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 999,
                      background: 'linear-gradient(135deg, #4caf50, #8bc34a)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11
                    }}
                  >
                    ✓
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Box تسجيل الدخول */}
          <div
            style={{
              background: 'rgba(10, 10, 22, 0.95)',
              borderRadius: 18,
              padding: 24,
              boxShadow: '0 18px 40px rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}
          >
            <h2 style={{ margin: 0, fontSize: 22 }}>تسجيل الدخول إلى MD‑Marketplace</h2>
            <p style={{ fontSize: 13, opacity: 0.8, margin: 0 }}>
              أدخل رقم المستخدم وكلمة المرور للوصول إلى لوحة الطلبات والمتاجر والخدمات.
            </p>

            <label style={{ fontSize: 13, marginTop: 12 }}>
              رقم المستخدم
              <input
                type="text"
                value={userId}
                onChange={e => setUserId(e.target.value)}
                placeholder="مثال: 0501234567 أو رقم حساب"
                style={{
                  marginTop: 6,
                  width: '100%',
                  padding: 10,
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: 'rgba(5,5,15,0.9)',
                  color: '#fff',
                  fontSize: 13
                }}
              />
            </label>

            <label style={{ fontSize: 13, marginTop: 8 }}>
              كلمة المرور
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الخاصة بك"
                style={{
                  marginTop: 6,
                  width: '100%',
                  padding: 10,
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: 'rgba(5,5,15,0.9)',
                  color: '#fff',
                  fontSize: 13
                }}
              />
            </label>

            <button
              onClick={handleLogin}
              style={{
                marginTop: 14,
                width: '100%',
                padding: 11,
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #ff9800, #ff5722)',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              تسجيل الدخول
            </button>

            <div
              style={{
                display: 'flex',
                gap: 10,
                marginTop: 8,
                flexWrap: 'wrap'
              }}
            >
              <button
                onClick={handleRegister}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.25)',
                  background: 'transparent',
                  color: '#fff',
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                تسجيل جديد
              </button>
              <button
                onClick={handleContact}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 10,
                  border: '1px solid rgba(76,175,80,0.7)',
                  background: 'rgba(76,175,80,0.15)',
                  color: '#a5ffb0',
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                تواصل معنا
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
