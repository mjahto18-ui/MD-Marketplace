'use client';

export default function Confirm() {
  const handleYes = () => window.location.href = '/location';
  const handleEdit = () => window.location.href = '/register';

  return (
    <main style={pageStyle}>
      <div style={boxStyle}>
        <h2 style={titleStyle}>تأكيد المعلومات</h2>

        <p style={{ opacity: 0.85 }}>
          هل المعلومات التي أدخلتها صحيحة؟
        </p>

        <button style={btnStyle} onClick={handleYes}>نعم، أكمل</button>
        <button style={editBtnStyle} onClick={handleEdit}>تعديل المعلومات</button>
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
  display: 'flex',
  flexDirection: 'column',
  gap: 16
};

const titleStyle = { margin: 0, fontSize: 22 };

const btnStyle = {
  padding: 11,
  borderRadius: 12,
  border: 'none',
  background: 'linear-gradient(135deg, #4caf50, #8bc34a)',
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 14,
  cursor: 'pointer'
};

const editBtnStyle = {
  padding: 11,
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.25)',
  background: 'transparent',
  color: '#fff',
  fontSize: 14,
  cursor: 'pointer'
};
