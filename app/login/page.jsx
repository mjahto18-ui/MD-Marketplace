'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [tab, setTab] = useState('login'); // login | register | guest | contact
  const [form, setForm] = useState({
    name: '', mobile: '', pin: '', area: '', address: ''
  });
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const router = useRouter();

  // تحديد الموقع
  const getLocation = () => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setLocation(loc);
            setMsg('✓ تم تحديد الموقع');
            resolve(true);
          },
          () => {
            setMsg('لازم توافق على الموقع عشان نكمل التسجيل');
            resolve(false);
          }
        );
      } else resolve(false);
    });
  };

  // دخول - رقم + PIN
  const handleLogin = async () => {
    if (!form.mobile || !form.pin) return setMsg('حط الرقم وكلمة السر');
    setLoading(true);
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: form.mobile, pin: form.pin })
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/dashboard');
    } else {
      setMsg(data.msg || 'يرجى التسجيل او التأكد من البيانات');
    }
  };

  // تسجيل جديد
  const handleRegister = async () => {
    if (!form.name || !form.mobile || !form.area || !form.address) {
      return setMsg('عبي كل الحقول');
    }
    setMsg('الرجاء تفعيل الموقع للمتابعة...');
    const locOk = await getLocation();
    if (!locOk) return;
    
    setLoading(true);
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({...form,...location })
    });
    const data = await res.json();
    setLoading(false);
    setMsg(data.msg);
    if (data.success) {
      setTimeout(() => setTab('login'), 3000);
    }
  };

  // دخول كزائر
  const handleGuest = () => {
    localStorage.setItem('user', JSON.stringify({ role: 'guest' }));
    router.push('/categories');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">السوق الإلكتروني<br/>السعودية</h1>
          <p className="text-purple-300 text-xl">marketplace.sa</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
          {/* الـ 4 تابات */}
          <div className="grid grid-cols-4 gap-1 mb-6 bg-black/20 p-1 rounded-xl text-sm">
            <button onClick={() => setTab('login')} className={`py-2 rounded-lg ${tab==='login'? 'bg-white text-black' : 'text-white'}`}>دخول</button>
            <button onClick={() => setTab('register')} className={`py-2 rounded-lg ${tab==='register'? 'bg-white text-black' : 'text-white'}`}>تسجيل جديد</button>
            <button onClick={() => setTab('guest')} className={`py-2 rounded-lg ${tab==='guest'? 'bg-white text-black' : 'text-white'}`}>كزائر</button>
            <button onClick={() => setTab('contact')} className={`py-2 rounded-lg ${tab==='contact'? 'bg-white text-black' : 'text-white'}`}>راسلنا</button>
          </div>

          {msg && (
            <div className={`mb-4 p-3 rounded-lg text-center text-sm ${msg.includes('✓') || msg.includes('قيد')? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
              {msg}
            </div>
          )}

          {/* تاب الدخول */}
          {tab === 'login' && (
            <div className="space-y-4">
              <input type="tel" placeholder="رقم الهاتف" className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50" value={form.mobile} onChange={(e) => setForm({...form, mobile: e.target.value})} />
              <input type="password" placeholder="كلمة السر PIN" className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50" value={form.pin} onChange={(e) => setForm({...form, pin: e.target.value})} />
              <button onClick={handleLogin} disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold">{loading? '...' : 'دخول'}</button>
            </div>
          )}

          {/* تاب التسجيل الجديد */}
          {tab === 'register' && (
            <div className="space-y-4">
              <input type="text" placeholder="الاسم الكامل" className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
              <input type="tel" placeholder="رقم الهاتف" className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50" value={form.mobile} onChange={(e) => setForm({...form, mobile: e.target.value})} />
              <input type="text" placeholder="المنطقة" className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50" value={form.area} onChange={(e) => setForm({...form, area: e.target.value})} />
              <input type="text" placeholder="العنوان" className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} />
              <button onClick={handleRegister} disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold">{loading? '...' : 'موافق وتحديد الموقع'}</button>
            </div>
          )}

          {/* تاب كزائر */}
          {tab === 'guest' && (
            <div className="text-center space-y-4">
              <p className="text-white/70 text-sm">رح تدخل كزائر. ما بتقدر تشتري او تشوف السلة</p>
              <button onClick={handleGuest} className="w-full py-3 rounded-xl bg-white/10 border border-white/20 text-white">تصفح المنتجات</button>
            </div>
          )}

          {/* تاب راسلنا */}
          {tab === 'contact' && (
            <div className="text-center space-y-4">
              <a href="https://wa.me/966500000000" className="block w-full py-3 rounded-xl bg-green-500 text-white font-bold">واتساب: 0500000000</a>
              <a href="mailto:info@marketplace.sa" className="block w-full py-3 rounded-xl bg-white/10 border border-white/20 text-white">info@marketplace.sa</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
