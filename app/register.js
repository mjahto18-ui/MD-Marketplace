'use client';
import { useState } from 'react';

export default function Register() {
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    area: '',
    address: '',
    floor: ''
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleNext = () => {
    console.log('Register Data:', form);
    window.location.href = '/confirm';
  };

  return (
    <main style={pageStyle}>
      <div style={boxStyle}>
        <h2 style={titleStyle}>إنشاء حساب جديد</h2>

        <Input label="الاسم الكامل" name="fullName" value={form.fullName} onChange={handleChange} />
        <Input label="رقم الهاتف" name="phone" value={form.phone} onChange={handleChange} />
        <Input label="المنطقة" name="area" value={form.area} onChange={handleChange} />
        <Input label="العنوان كتابيًا" name="address" value={form.address} onChange={handleChange} />
        <Input label="الشارع / الطابق" name="floor" value={form.floor} onChange={handleChange} />

        <button style={btnStyle} onClick={handleNext}>متابعة</button>
      </div>
    </main>
  );
}

function Input({ label, name, value, onChange }) {
  return (
    <label style={{ fontSize: 13 }}>
      {label}
      <input
        name={name}
        value={value}
        onChange={onChange}
        style={inputStyle}
      />
    </label>
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

const inputStyle = {
  marginTop: 6,
  width: '100%',
  padding: 10,
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.18)',
  background: 'rgba(5,5,15,0.9)',
  color: '#fff',
  fontSize: 13
};

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
