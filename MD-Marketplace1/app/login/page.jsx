"use client";
import { useState } from "react";
import { User, Lock, Mail, Phone, MapPin, Building, Users, LogIn, UserPlus } from "lucide-react";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", name: "", phone: "", location: "", company: "" });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const url = activeTab === "login" ? "/api/login" : "/api/register";
    const body = activeTab === "login" 
      ? { email: form.email, password: form.password }
      : { name: form.name, email: form.email, password: form.password, phone: form.phone, location: form.location, company: form.company };
    
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setMsg(data.message);
      if (data.success) setForm({ email: "", password: "", name: "", phone: "", location: "", company: "" });
    } catch {
      setMsg("حصل خطأ في الاتصال");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Building className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">MD Marketplace</h1>
            <p className="text-purple-200">منصة التسوق الذكية</p>
          </div>

          <div className="flex bg-black/20 mx-6 rounded-2xl p-1">
            <button onClick={() => setActiveTab("login")} className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === "login" ? "bg-white text-purple-900 shadow-lg" : "text-white/70"}`}>
              <LogIn className="w-4 h-4" /> دخول
            </button>
            <button onClick={() => setActiveTab("register")} className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === "register" ? "bg-white text-purple-900 shadow-lg" : "text-white/70"}`}>
              <UserPlus className="w-4 h-4" /> تسجيل
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {activeTab === "register" && (
              <>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                  <input name="name" value={form.name} onChange={handleChange} placeholder="الاسم الكامل" className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pr-12 pl-4 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500" required />
                </div>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="رقم الهاتف" className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pr-12 pl-4 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500" required />
                </div>
                <div className="relative">
                  <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                  <input name="location" value={form.location} onChange={handleChange} placeholder="الموقع" className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pr-12 pl-4 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500" required />
                </div>
                <div className="relative">
                  <Building className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                  <input name="company" value={form.company} onChange={handleChange} placeholder="اسم الشركة" className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pr-12 pl-4 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500" required />
                </div>
              </>
            )}
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="البريد الإلكتروني" className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pr-12 pl-4 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500" required />
            </div>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
              <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="كلمة المرور" className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pr-12 pl-4 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500" required />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50">
              {loading ? "جاري المعالجة..." : activeTab === "login" ? "تسجيل الدخول" : "إنشاء حساب"}
            </button>
            {msg && <div className={`text-center p-3 rounded-xl ${msg.includes("نجاح") || msg.includes("success") ? "bg-green-500/20 text-green-200" : "bg-red-500/20 text-red-200"}`}>{msg}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}