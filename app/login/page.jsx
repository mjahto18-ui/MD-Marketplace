"use client";
import { useState } from "react";

export default function LoginPage() {
  const [tab, setTab] = useState("login"); // login | register
  const [form, setForm] = useState({ 
    mobile: "", 
    pin: "", 
    name: "", 
    area: "", 
    address: "" 
  });
  const [msg, setMsg] = useState({ text: "", error: false });
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState({ lat: null, lng: null });

  const getLocation = () => {
    setMsg({ text: "جاري تحديد موقعك...", error: false });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setMsg({ text: "تم تحديد الموقع بنجاح ✓", error: false });
      },
      () => setMsg({ text: "لازم توافق على الموقع", error: true }),
      { enableHighAccuracy: true }
    );
  };

  const handleLogin = async () => {
    if (!form.mobile || !form.pin) return setMsg({ text: "دخل رقم الموبايل والـ PIN", error: true });
    setLoading(true);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile: form.mobile, pin: form.pin }),
    });
    const data = await res.json();
    setMsg({ text: data.msg, error: !data.success });
    setLoading(false);
    if (data.success) {
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "/categories";
    }
  };

  const handleRegister = async () => {
    if (!form.name || !form.mobile || !form.pin || !form.area || !form.address) 
      return setMsg({ text: "عبي كل الخانات المطلوبة", error: true });
    if (!coords.lat) return setMsg({ text: "حدد موقعك بالأول", error: true });
    
    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, lat: coords.lat, lng: coords.lng }),
    });
    const data = await res.json();
    setMsg({ text: data.msg, error: !data.success });
    setLoading(false);
    if (data.success) setTimeout(() => setTab("login"), 1500);
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={tabsStyle}>
          <button onClick={() => setTab("login")} style={tab === "login" ? activeTab : tabStyle}>
            دخول
          </button>
          <button onClick={() => setTab("register")} style={tab === "register" ? activeTab : tabStyle}>
            انضم الينا
          </button>
        </div>

        {msg.text && (
          <div style={msg.error ? errorStyle : successStyle}>{msg.text}</div>
        )}

        {tab === "login" ? (
          <div style={formStyle}>
            <input type="tel" placeholder="رقم الموبايل" style={inputStyle}
              value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            <input type="password" placeholder="PIN - 4 أرقام" maxLength={4} style={inputStyle}
              value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} />
            <button onClick={handleLogin} disabled={loading} style={btnStyle}>
              {loading ? "جاري الدخول..." : "دخول"}
            </button>
          </div>
        ) : (
          <div style={formStyle}>
            <input placeholder="الاسم الكامل" style={inputStyle}
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input type="tel" placeholder="رقم الموبايل" style={inputStyle}
              value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            <input type="password" placeholder="PIN - 4 أرقام" maxLength={4} style={inputStyle}
              value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} />
            <input placeholder="المنطقة" style={inputStyle}
              value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
            <input placeholder="العنوان بالتفصيل" style={inputStyle}
              value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            
            <button onClick={getLocation} style={locationBtnStyle}>
              📍 {coords.lat ? "تم تحديد الموقع ✓" : "حدد موقعي"}
            </button>
            
            <button onClick={handleRegister} disabled={loading} style={btnGreenStyle}>
              {loading ? "جاري التسجيل..." : "تسجيل مستخدم جديد"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f5f7fa",
  padding: 20,
  direction: "rtl",
  fontFamily: "system-ui, -apple-system, sans-serif"
};

const cardStyle = {
  background: "#fff",
  borderRadius: 16,
  padding: 24,
  width: "100%",
  maxWidth: 400,
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
};

const tabsStyle = {
  display: "flex",
  gap: 8,
  marginBottom: 20,
  background: "#f0f2f5",
  padding: 4,
  borderRadius: 10
};

const tabStyle = {
  flex: 1,
  padding: "10px",
  border: "none",
  background: "transparent",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 500,
  color: "#666"
};

const activeTab = {
  ...tabStyle,
  background: "#fff",
  color: "#1a73e8",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
};

const formStyle = { display: "flex", flexDirection: "column", gap: 12 };

const inputStyle = {
  padding: "12px 16px",
  borderRadius: 10,
  border: "1px solid #ddd",
  fontSize: 15,
  outline: "none"
};

const btnStyle = {
  padding: 12,
  borderRadius: 10,
  border: "none",
  background: "#1a73e8",
  color: "#fff",
  fontWeight: "bold",
  fontSize: 15,
  cursor: "pointer"
};

const btnGreenStyle = {
  ...btnStyle,
  background: "#0f9d58"
};

const locationBtnStyle = {
  padding: 12,
  borderRadius: 10,
  border: "1px solid #1a73e8",
  background: "#fff",
  color: "#1a73e8",
  fontWeight: 500,
  cursor: "pointer"
};

const errorStyle = {
  background: "#fee",
  color: "#c00",
  padding: 10,
  borderRadius: 8,
  marginBottom: 12,
  fontSize: 14,
  textAlign: "center"
};

const successStyle = {
  background: "#e6f4ea",
  color: "#0f9d58",
  padding: 10,
  borderRadius: 8,
  marginBottom: 12,
  fontSize: 14,
  textAlign: "center"
};
