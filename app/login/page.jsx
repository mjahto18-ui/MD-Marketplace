'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    name: '', mobile: '', area: '', address: '', email: ''
  });
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const router = useRouter();

  // تحديد الموقع
  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setMsg('✓ تم تحديد الموقع');
      }, () => setMsg('فشل تحديد الموقع'));
    }
  };

  // تسجيل الدخول بالرقم بس
  const handleLogin = async () => {
    setLoading(true);
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: form.mobile })
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      router.push('/dashboard');
    } else {
      setMsg(data.msg || 'رقم الهاتف غير صحيح او الحساب غير مفعل');
    }
  };

  // التسجيل الجديد - بدون PIN
  const handleRegister = async () => {
    if (!location.lat) return setMsg('حدد موقعك اول');
    setLoading(true);
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({...form,...location })
    });
    const data = await res.json();
    setLoading(false);
    setMsg(data.msg);
    if (data.success) setIsLogin(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* الهيدر */}
        <div className="text-center mb-8">
          <div className="inline-block px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-4">
            <span className="text-white text-sm">مشروع سعودي رقمي قادم لسوق إلكتروني متعدد البائعين 🛍️</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">السوق الإلكتروني<br/>السعودية</h1>
          <p className="text-purple-300 text-xl">marketplace.sa</p>
        </div>

        {/* الكارد */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
          {/* التاب */}
          <div className="flex gap-2 mb-6 bg-black/20 p-1 rounded-xl">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-lg transition ${isLogin? 'bg-white text-black' : 'text-white'}`}>
              دخول
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-lg transition ${!isLogin? 'bg-white text-black' : 'text-white'}`}>
              انضم الينا
            </button>
          </div>

          {msg && (
            <div className={`mb-4 p-3 rounded-lg text-center text-sm ${msg.includes('✓') || msg.includes('نجاح')? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
              {msg}
            </div>
          )}

          {isLogin? (
            // فورم الدخول - رقم بس
            <div className="space-y-4">
              <input
                type="tel"
                placeholder="رقم الموبايل"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
                value={form.mobile}
                onChange={(e) => setForm({...form, mobile: e.target.value})}
              />
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold disabled:opacity-50">
                {loading? 'جاري الدخول...' : 'دخول'}
              </button>
            </div>
          ) : (
            // فورم التسجيل - بدون PIN
            <div className="space-y-4">
              <input
                type="text"
                placeholder="الاسم الكامل"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
              />
              <input
                type="tel"
                placeholder="رقم الموبايل"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
                value={form.mobile}
                onChange={(e) => setForm({...form, mobile: e.target.value})}
              />
              <input
                type="text"
                placeholder="المنطقة"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
                value={form.area}
                onChange={(e) => setForm({...form, area: e.target.value})}
              />
              <input
                type="text"
                placeholder="العنوان بالتفصيل"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
                value={form.address}
                onChange={(e) => setForm({...form, address: e.target.value})}
              />
              <button
                onClick={getLocation}
                className="w-full py-3 rounded-xl bg-white/10 border border-white/20 text-white">
                {location.lat? '✓ تم تحديد الموقع 📍' : 'تحديد الموقع 📍'}
              </button>
              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold disabled:opacity-50">
                {loading? 'جاري التسجيل...' : 'تسجيل مستخدم جديد'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
