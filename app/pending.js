'use client';

export default function Pending() {
  return (
    <main style={pageStyle}>
      <div style={boxStyle}>
        <h2 style={titleStyle}>🔔 حسابك قيد المراجعة</h2>

        <p style={{ opacity: 0.85, lineHeight: 1.7 }}>
          شكرًا لانضمامك!  
          تم استلام معلوماتك وتحديد موقعك بنجاح.  
          سيتم مراجعة حسابك خلال 5 دقائق.
        </p>

        <p style={{ opacity: 0.7 }}>
          بعد التفعيل، ستصلك رسالة واتساب تحتوي على رمز الدخول.
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
