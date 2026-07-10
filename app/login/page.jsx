"use client";
import { useState, useEffect } from "react";
import { User, Lock, Phone, MapPin, Home, Mail, ShoppingCart, LogIn, UserPlus, Eye, MessageCircle, ChevronRight, Shield, Zap, BadgeCheck, MapPinned, X, Info } from "lucide-react";

export default function LoginPage() {
  const [view, setView] = useState("main");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    area: "",
    address: "",
    email: "",
    pin: "",
  });
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkExistingSession = async () => {

      // ⚠️ تم حذف شرط md_guest هون لأنه كان يعمل redirect غلط

      try {
        const res = await fetch('/api/me', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
         if (data.user) {
            window.location.replace('/shop');

          
            return;
          }
        }
      } catch {}

      setCheckingSession(false);
    };

    checkExistingSession();
  }, []);

  const handleChange = (e) => setForm({...form, [e.target.name]: e.target.value });

  const getLocationAndRegister = () => {
    setShowLocationPopup(false);
    setLoading(true);
    setMsg("");

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setLocation(currentLocation);
          await submitRegistration(currentLocation);
        },
        () => {
          setMsg("يلزم السماح باستخدام موقعك الحالي لإكمال التسجيل");
          setLoading(false);
        }
      );
    } else {
      setMsg("المتصفح لا يدعم تحديد الموقع");
      setLoading(false);
    }
  };

  const submitRegistration = async (currentLocation) => {
    try {
      const deviceInfo = {
        deviceType: /Mobile|Android|iP(hone|od)|IEMobile/.test(navigator.userAgent)? 'Mobile' : 'Desktop',
        deviceName: navigator.platform,
        browser: navigator.userAgent,
      };
      const ipRes = await fetch('https://api.ipify.org?format=json').then(r => r.json());

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          registrationLatitude: currentLocation.lat,
          registrationLongitude: currentLocation.lng,
          currentLatitude: currentLocation.lat,
          currentLongitude: currentLocation.lng,
          ...deviceInfo,
          ipAddress: ipRes.ip,
          status: 'Pending',
          freeDeliveryRemaining: 5,
          joinDate: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      setMsg(data.message);
      if (data.success) {
        setTimeout(() => setView("main"), 2000);
      }
    } catch {
      setMsg("حصل خطأ في الاتصال");
    }
    setLoading(false);
  };

  const handleRegisterClick = (e) => {
    e.preventDefault();
    setMsg("");

    if (!form.name ||!form.phone ||!form.area ||!form.address ||!form.pin) {
      setMsg("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }

    setShowLocationPopup(true);
  };

  const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);
  setMsg("");

  try {
    // مسح كوكي الزائر
    document.cookie = 'md_guest=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ phone: form.phone, pin: form.pin }),
    });

    const data = await res.json();

    // ما نعمل setMsg إلا إذا موجودة فعلاً
    if (data.message) {
      setMsg(data.message);
    }

    const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);
  setMsg("");

  try {
    // مسح كوكي الزائر
    document.cookie =
      "md_guest=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax";

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ phone: form.phone, pin: form.pin }),
    });

    const data = await res.json();

    // ما نعمل setMsg إلا إذا موجودة فعلاً
    if (data.message) {
      setMsg(data.message);
    }

    if (data.success) {
      // ربط OneSignal برقم الهاتف مع تأكد من الجهوزية
      if (typeof window !== "undefined" && window.OneSignal) {
        try {
          // إذا الـ SDK جاهز مباشرة
          window.OneSignal.User.login(data.user.phone);

          const subId = window.OneSignal.User.PushSubscription.id || null;
          console.log("PushSubscription ID:", subId);

          // إذا بدك يظهر تأكيد التنبيهات فوراً:
          // window.OneSignal.showSlidedownPrompt();
        } catch (e) {
          console.log("OneSignal not ready yet:", e);
        }
      }

      // تحويل إلى صفحة المتاجر
      window.location.replace("/shop");
    }
  } catch (err) {
    console.log(err);
    setMsg("حصل خطأ في الاتصال");
  }

  setLoading(false);
};



  const handleGuest = async () => {
    setLoading(true);
    await fetch("/api/guest", {
      method: "POST",
      credentials: 'include'
    });
    window.location.replace('/shop');
  };

  const handleWhatsApp = () => {
    window.open('https://wa.me/9613177653', '_blank');
  };

  const handleAbout = () => {
    window.location.href = '/about';
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-white text-xl">جاري التحميل...</div>
      </div>
    );
  }

  // باقي الصفحة بدون أي تعديل



  if (view === "main") {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-32 h-32 mx-auto mb-4 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 rounded-3xl rotate-6"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-600 rounded-3xl flex items-center justify-center">
                <ShoppingCart className="w-16 h-16 text-white" strokeWidth={2.5} />
              </div>
              <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl rotate-12"></div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 tracking-wide">MD</h1>
            <p className="text-purple-200 text-lg mb-1">MARKETPLACE</p>
            <p className="text-white/80 text-xl font-semibold">One App For <span className="text-pink-400">Everything</span></p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="w-12 h-1 bg-pink-500 rounded-full"></div>
              <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
            </div>
          </div>

          <div className="space-y-4">
            <button onClick={() => setView("login")} className="w-full glass rounded-3xl p-5 flex items-center justify-between hover:bg-white/10 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl flex items-center justify-center">
                  <LogIn className="w-7 h-7 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-white font-bold text-lg">دخول</div>
                  <div className="text-purple-200 text-sm">لديك حساب بالفعل؟ سجل الدخول</div>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-white/50 group-hover:text-white transition-all" />
            </button>

            <button onClick={() => setView("register")} className="w-full glass rounded-3xl p-5 flex items-center justify-between hover:bg-white/10 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-600 to-pink-800 rounded-2xl flex items-center justify-center">
                  <UserPlus className="w-7 h-7 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-white font-bold text-lg">تسجيل جديد</div>
                  <div className="text-purple-200 text-sm">انضم إلينا وابدأ رحلتك</div>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-white/50 group-hover:text-white transition-all" />
            </button>

            <button onClick={handleGuest} disabled={loading} className="w-full glass rounded-3xl p-5 flex items-center justify-between hover:bg-white/10 transition-all group disabled:opacity-50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center">
                  <Eye className="w-7 h-7 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-white font-bold text-lg">دخول كزائر</div>
                  <div className="text-purple-200 text-sm">تصفح المتاجر والمنتجات بدون تسجيل</div>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-white/50 group-hover:text-white transition-all" />
            </button>

            <button onClick={handleAbout} className="w-full glass rounded-3xl p-5 flex items-center justify-between hover:bg-white/10 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[#6A11CB] to-[#FF4E9A] rounded-2xl flex items-center justify-center">
                  <Info className="w-7 h-7 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-white font-bold text-lg">من نحن</div>
                  <div className="text-purple-200 text-sm">تعرف على MD Marketplace</div>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-white/50 group-hover:text-white transition-all" />
            </button>

            <button onClick={handleWhatsApp} className="w-full glass rounded-3xl p-5 flex items-center justify-between hover:bg-white/10 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-green-800 rounded-2xl flex items-center justify-center">
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-white font-bold text-lg">راسلنا</div>
                  <div className="text-purple-200 text-sm">تواصل معنا لأي استفسار أو مساعدة</div>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-white/50 group-hover:text-white transition-all" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-6 mt-8 text-purple-200 text-sm">
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              <span>تسوق آمن</span>
            </div>
            <div className="flex items-center gap-1">
              <BadgeCheck className="w-4 h-4" />
              <span>موثوق</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4" />
              <span>سريع</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === "login") {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <button onClick={() => setView("main")} className="text-white/70 hover:text-white mb-4 flex items-center gap-2">
            <ChevronRight className="w-5 h-5 rotate-180" />
            رجوع
          </button>

          <div className="glass rounded-3xl overflow-hidden">
            <div className="p-6 text-center border-b border-white/10">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                دخول <Lock className="w-5 h-5 text-pink-400" />
              </h2>
              <p className="text-purple-200 text-sm mt-1">سجل دخولك للوصول إلى حسابك</p>
            </div>

            <form onSubmit={handleLogin} className="p-6 space-y-4">
              <div>
                <label className="text-purple-200 text-sm mb-2 block">رقم الهاتف</label>
                <div className="relative">
                  <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                  <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="مثال: 71 123 456" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" required />
                </div>
              </div>

              <div>
                <label className="text-purple-200 text-sm mb-2 block">رمز الدخول (PIN)</label>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                  <input name="pin" type="password" value={form.pin} onChange={handleChange} placeholder="أدخل رمز الدخول الخاص بك" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" required />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-4 rounded-2xl hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50">
                {loading? "جاري الدخول..." : "تسجيل الدخول"}
              </button>

              {msg && <div className={`text-center p-3 rounded-xl text-sm ${msg.includes("نجاح")? "bg-green-500/20 text-green-200" : "bg-red-500/20 text-red-200"}`}>{msg}</div>}

              <div className="text-center text-purple-200 text-sm pt-2">
                أو
              </div>

              <button type="button" onClick={() => setView("register")} className="w-full text-pink-400 hover:text-pink-300 font-semibold">
                ليس لديك حساب؟ تسجيل جديد
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (view === "register") {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <button onClick={() => setView("main")} className="text-white/70 hover:text-white mb-4 flex items-center gap-2">
            <ChevronRight className="w-5 h-5 rotate-180" />
            رجوع
          </button>

          <div className="glass rounded-3xl overflow-hidden">
            <div className="p-6 text-center border-b border-white/10">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                تسجيل جديد <UserPlus className="w-5 h-5 text-pink-400" />
              </h2>
              <p className="text-purple-200 text-sm mt-1">أنشئ حسابك وابدأ رحلتك معنا</p>
            </div>

            <form onSubmit={handleRegisterClick} className="p-6 space-y-4">
              <div>
                <label className="text-purple-200 text-sm mb-2 block">الاسم الكامل</label>
                <div className="relative">
                  <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                  <input name="name" value={form.name} onChange={handleChange} placeholder="أدخل اسمك الكامل" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500" required />
                </div>
              </div>

              <div>
                <label className="text-purple-200 text-sm mb-2 block">رقم الهاتف</label>
                <div className="relative">
                  <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                  <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="مثال: 71 123 456" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-purple-200 text-sm mb-2 block">المنطقة</label>
                  <div className="relative">
                    <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                    <input name="area" value={form.area} onChange={handleChange} placeholder="منطقة سكنك" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500" required />
                  </div>
                </div>
                <div>
                  <label className="text-purple-200 text-sm mb-2 block">العنوان</label>
                  <div className="relative">
                    <Home className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                    <input name="address" value={form.address} onChange={handleChange} placeholder=" عنوانك بالتفصيل" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500" required />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-purple-200 text-sm mb-2 block">البريد الإلكتروني (اختياري)</label>
                <div className="relative">
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                  <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="example@email.com" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>

              <div>
                <label className="text-purple-200 text-sm mb-2 block">رمز الدخول (PIN)</label>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                  <input name="pin" type="password" value={form.pin} onChange={handleChange} placeholder="من 4 ارقام سوف يتغير لاحقا" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500" required />
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-pink-400 text-sm mb-2">
                  <MapPinned className="w-4 h-4" />
                  <span>الموقع الجغرافي</span>
                </div>
                <p className="text-purple-200 text-xs">سيتم طلب موقعك عند الضغط على "إرسال طلب الانضمام" لتأكيد عنوانك</p>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-4 rounded-2xl hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {loading? "جاري الإرسال..." : "إرسال طلب الانضمام"}
              </button>

              {msg && <div className={`text-center p-3 rounded-xl text-sm ${msg.includes("نجاح")? "bg-green-500/20 text-green-200" : "bg-red-500/20 text-red-200"}`}>{msg}</div>}

              <p className="text-center text-purple-300 text-xs">سيتم مراجعة طلبك خلال وقت قصير</p>
            </form>
          </div>
        </div>

        {showLocationPopup && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="glass rounded-3xl p-6 max-w-sm w-full">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <MapPinned className="w-6 h-6 text-white" />
                </div>
                <button onClick={() => {setShowLocationPopup(false); setLoading(false);}} className="text-white/50 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">تأكيد موقعك الحالي</h3>
              <p className="text-purple-200 text-sm mb-6">لإكمال التسجيل، يرجى السماح باستخدام موقعك الحالي. نستخدم موقعك لتقديم خدمة أفضل وتحديد أقرب المتاجر لك.</p>
              <div className="flex gap-3">
                <button onClick={() => {setShowLocationPopup(false); setLoading(false);}} className="flex-1 bg-white/10 text-white font-semibold py-3 rounded-xl hover:bg-white/20 transition-all">
                  إلغاء
                </button>
                <button onClick={getLocationAndRegister} className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-all">
                  موافق
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
