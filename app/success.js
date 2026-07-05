'use client';

export default function Success() {
  return (
    <main style={pageStyle}>
      <div style={boxStyle}>
        <h2 style={titleStyle}>🎉 تم تفعيل حسابك</h2>

        <p style={{ opacity: 0.85 }}>
          رمز الدخول الخاص بك: <b>5522</b>
        </p>

        <p style={{ opacity: 0.85 }}>
          لديك 5 توصيلات مجانية 🎁
        </p>

        <button
          style={btnStyle}
          onClick={() => window.location.href = '/'}
        >
          تسجيل الدخول الآن
        </button>
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

const btnStyle = {
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
};
