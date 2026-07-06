'use client';
import { useState } from 'react';
import { ShoppingBasket, Phone, LogIn, UserPlus, User, MessageCircle } from 'lucide-react';

export default function LoginPage() {
  const [tab, setTab] = useState('login'); // login | register | guest
  const [form, setForm] = useState({ mobile: '', pin: '', name: '', area: '', address: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', error: false });

  const handleLogin = async () => {
    if (!form.mobile || !form.pin) return setMsg({ text: 'دخل رقم الموبايل والـ PIN', error: true });
    setLoading(true);
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: form.mobile, pin: form.pin })
    });
    const data = await res.json();
    setMsg({ text: data.msg, error: !data.success });
    setLoading(false);
    if (data.success) window.location.href = '/home';
  };

  const handleRegister = async () => {
    if (!form.name || !form.mobile || !form.area || !form.address) {
      return setMsg({ text: 'عبي كل الخانات المطلوبة', error: true });
    }
    setLoading(true);
    setMsg({ text: 'جاري تحديد موقعك...', error: false });

    // GPS تلقائي بدون ما يكبس الزبون شي
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, lat: latitude, lng: longitude })
      });
      const data = await res.json();
      setMsg({ text: data.msg, error: !data.success });
      setLoading(false);
      if (data.success) setTimeout(() => setTab('login'), 2000);
    }, () => {
      setMsg({ text: 'لازم توافق على الموقع لنكمل التسجيل', error: true });
      setLoading(false);
    }, { enableHighAccuracy: true });
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e] flex items-center justify-center p-4 font-['Cairo']">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        
        {/* القسم اليمين - النص */}
        <div className="text-white space-y-6 order-2 md:order-1">
          <div className="bg-[#2d1b4e]/50 backdrop-blur-sm px-4 py-2 rounded-full inline-flex items-center gap-2 border border-purple-500/20">
            <ShoppingBasket className="w-4 h-4" />
            <span className="text-sm">منصة لبنانية رقمية لسوق إلكتروني متعدد البائعين</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            السوق<br />الإلكتروني<br />اللبناني
          </h1>

          <div className="space-y-2">
            <h2 className="text-4xl md:text-5xl font-bold text-purple-400">MD-Marketplace</h2>
            <p className="text-xl text-purple-300">One App For Everything</p>
          </div>

          <p className="text-gray-300 leading-relaxed max-w-md">
            واجهة لبنانية رقمية قادمة لاسم قوي ومباشر في عالم الأسواق الإلكترونية.
            هوية مناسبة لمنصة متعددة البائعين، منتجات وخدمات، إدارة بائعين، عمولات،
            دفع، شحن، تقييمات، وعروض موجهة للسوق اللبناني.
          </p>

          <div className="flex flex-wrap gap-3">
            <a href="https://wa.me/961xxxxxxxx" target="_blank" 
               className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg flex items-center gap-2 transition">
              <Phone className="w-5 h-5" />
              تواصل واتساب
            </a>
            <button className="bg-gradient-to-l from-purple-600 to-pink-600 px-6 py-3 rounded-lg">
              الخدمات القادمة
            </button>
          </div>
        </div>

        {/* القسم الشمال - بوكس الدخول */}
        <div className="order-1 md:order-2">
          <div className="bg-[#1a0b2e]/80 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-2 shadow-2xl">
            <div className="bg-[#0f0618] rounded-2xl p-6 md:p-8">
              
              {/* الشعار */}
              <div className="flex justify-center mb-6">
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-4 rounded-2xl">
                  <ShoppingBasket className="w-12 h-12 text-white" />
                </div>
              </div>

              {/* التابات */}
              <div className="grid grid-cols-2 gap-2 mb-6 bg-[#1a0b2e] p-1 rounded-xl">
                <button onClick={() => setTab('login')} 
                  className={`py-2.5 rounded-lg text-sm font-medium transition ${tab==='login'?'bg-purple-600 text-white':'text-gray-400 hover:text-white'}`}>
                  <LogIn className="w-4 h-4 inline ml-1" /> دخول
                </button>
                <button onClick={() => setTab('register')} 
                  className={`py-2.5 rounded-lg text-sm font-medium transition ${tab==='register'?'bg-purple-600 text-white':'text-gray-400 hover:text-white'}`}>
                  <UserPlus className="w-4 h-4 inline ml-1" /> انضم الينا
                </button>
              </div>

              {/* رسالة التنبيه */}
              {msg.text && (
                <div className={`mb-4 p-3 rounded-lg text-sm text-center ${msg.error?'bg-red-500/20 text-red-300 border border-red-500/30':'bg-green-500/20 text-green-300 border border-green-500/30'}`}>
                  {msg.text}
                </div>
              )}

              {/* تبويب الدخول */}
              {tab === 'login' && (
                <div className="space-y-4">
                  <input type="tel" placeholder="رقم الموبايل 03xxxxxx" 
                    className="w-full bg-[#1a0b2e] border border-purple-500/30 text-white p-3.5 rounded-xl focus:outline-none focus:border-purple-500 transition"
                    value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} />
                  <input type="password" placeholder="PIN" maxLength={4}
                    className="w-full bg-[#1a0b2e] border border-purple-500/30 text-white p-3.5 rounded-xl focus:outline-none focus:border-purple-500 transition"
                    value={form.pin} onChange={e => setForm({...form, pin: e.target.value})} />
                  <button onClick={handleLogin} disabled={loading}
                    className="w-full bg-gradient-to-l from-purple-600 to-pink-600 hover:opacity-90 text-white py-3.5 rounded-xl font-bold transition disabled:opacity-50">
                    {loading ? 'جاري التحقق...' : 'دخول'}
                  </button>
                </div>
              )}

              {/* تبويب التسجيل */}
              {tab === 'register' && (
                <div className="space-y-3">
                  <input placeholder="الاسم بالكامل" 
                    className="w-full bg-[#1a0b2e] border border-purple-500/30 text-white p-3 rounded-xl focus:outline-none focus:border-purple-500"
                    value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                  <input type="tel" placeholder="رقم الموبايل 03xxxxxx" 
                    className="w-full bg-[#1a0b2e] border border-purple-500/30 text-white p-3 rounded-xl focus:outline-none focus:border-purple-500"
                    value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} />
                  <input placeholder="المنطقة" 
                    className="w-full bg-[#1a0b2e] border border-purple-500/30 text-white p-3 rounded-xl focus:outline-none focus:border-purple-500"
                    value={form.area} onChange={e => setForm({...form, area: e.target.value})} />
                  <input placeholder="العنوان بالتفصيل" 
                    className="w-full bg-[#1a0b2e] border border-purple-500/30 text-white p-3 rounded-xl focus:outline-none focus:border-purple-500"
                    value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                  <input type="email" placeholder="الايميل - اختياري" 
                    className="w-full bg-[#1a0b2e] border border-purple-500/30 text-white p-3 rounded-xl focus:outline-none focus:border-purple-500"
                    value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                  <p className="text-xs text-gray-400 text-center">* سيتم طلب موقعك تلقائياً لتأكيد التوصيل</p>
                  <button onClick={handleRegister} disabled={loading}
                    className="w-full bg-gradient-to-l from-green-600 to-emerald-600 hover:opacity-90 text-white py-3.5 rounded-xl font-bold transition disabled:opacity-50">
                    {loading ? 'جاري التسجيل...' : 'تسجيل مستخدم جديد'}
                  </button>
                </div>
              )}

              {/* الأزرار الإضافية */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button onClick={() => window.location.href = '/home'}
                  className="bg-[#1a0b2e] border border-purple-500/30 hover:border-purple-500 text-gray-300 py-2.5 rounded-xl text-sm transition">
                  <User className="w-4 h-4 inline ml-1" /> دخول كزائر
                </button>
                <a href="https://wa.me/961xxxxxxxx" target="_blank"
                  className="bg-[#1a0b2e] border border-green-500/30 hover:border-green-500 text-gray-300 py-2.5 rounded-xl text-sm transition text-center">
                  <MessageCircle className="w-4 h-4 inline ml-1" /> راسلنا
                </a>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
