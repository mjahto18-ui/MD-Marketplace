'use client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth < 768);
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  const handleLogin = () => console.log('Login:', { userId, password });
  const handleRegister = () => console.log('Register clicked');
  const handleContact = () => console.log('Contact clicked');

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
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: 20
        }}
      >

        {isMobile && (
          <LoginBox
            userId={userId}
            password={password}
            setUserId={setUserId}
            setPassword={setPassword}
            handleLogin={handleLogin}
            handleRegister={handleRegister}
            handleContact={handleContact}
          />
        )}

        <InfoBox />

        {!isMobile && (
          <LoginBox
            userId={userId}
            password={password}
            setUserId={setUserId}
            setPassword={setPassword}
            handleLogin={handleLogin}
            handleRegister={handleRegister}
            handleContact={handleContact}
          />
        )}
      </div>
    </main>
  );
}

/* صندوق المعلومات */
function InfoBox() {
  return (
    <div
      style={{
        background: 'rgba(15, 15, 30, 0.9)',
        borderRadius: 18,
        padding: 24,
        boxShadow: '0 18px 40px rgba(0,0,0,0.55)',
        border: '1px solid rgba(255,255,255,0.06)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
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
          <div style={{ fontSize: 23, fontWeight: 'bold' }}>MD‑Marketplace</div>

          {/* الجملة الجديدة هون */}
          <div
            style={{
              fontSize: 13,
              opacity: 0.85,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 4
            }}
          >
            <span style={{ fontSize: 13 }}>🛍️</span>
            <span>One App For Everything</span>
          </div>

          <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
            منصة رقمية للمتاجر والخدمات
          </div>
        </div>
      </div>

      <p style={{ fontSize: 14, lineHeight: 1.7, opacity: 0.9, marginBottom: 18 }}>
        واجهة موحّدة لإدارة الطلبات، والخدمات المميزة، الكوبونات، النقاط، و المحفظة الرقمية،
        وتتبع حركة الطلبات لخدمة التوصيل ، مع تجربة موجهة للسوق اللبناني.
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
          'سهولة الدفع',
          'نقاط ولاء',
          'محفظة مالية',
          'تتبع على الخريطة',
          'خدمات دليفري ',
          'جميع المنتجات',
          'إمكانية تتبع الطلب عبر MAP 🗺️',
          'برندات عالمية'
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
  );
}

/* صندوق تسجيل الدخول */
function LoginBox({ userId, password, setUserId, setPassword, handleLogin, handleRegister, handleContact }) {
  return (
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
        أدخل رقم المستخدم وكلمة المرور للوصول إلى المتاجر والخدمات.
      </p>

      <label style={{ fontSize: 13, marginTop: 12 }}>
        رقم المستخدم
        <input
          type="text"
          value={userId}
          onChange={e => setUserId(e.target.value)}
          placeholder="مثال: 70000000 أو رقم هاتف"
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

      <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
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
          مستخدم جديد
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
          راسلنا
        </button>
      </div>
    </div>
  );
}
