"use client";
import { useState } from "react";

export default function LoginPage() {
  const [mobile, setMobile] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError("");

    const res = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ mobile, pin }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.status === "pending") {
      setError("تم إرسال طلب الانضمام… الرجاء انتظار التفعيل");
      return;
    }

    if (!data.success) {
      setError(data.message);
      return;
    }

    localStorage.setItem("user", JSON.stringify(data.user));
    window.location.href = "/categories";
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f0f0f, #1a1a1a)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        direction: "rtl",
        color: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "30px",
          maxWidth: "900px",
          width: "100%",
        }}
      >
        {/* صندوق المعلومات */}
        <div
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.05)",
            padding: "30px",
            borderRadius: "15px",
            boxShadow: "0 0 20px rgba(0,0,0,0.4)",
          }}
        >
          <h1 style={{ fontSize: "32px", marginBottom: "10px" }}>
            MD Marketplace
          </h1>
          <p style={{ opacity: 0.7, marginBottom: "20px" }}>
            ONE APP FOR EVERYTHING
          </p>

          <p style={{ lineHeight: "1.8", opacity: 0.8 }}>
            أهلاً في تطبيق MD Marketplace  
            المنصة اللي بتجمع كل شي بمكان واحد:  
            متاجر – منتجات – طلبات – محفظة – نقاط – سلة – ملف شخصي.
          </p>
        </div>

        {/* صندوق تسجيل الدخول */}
        <div
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.05)",
            padding: "30px",
            borderRadius: "15px",
            boxShadow: "0 0 20px rgba(0,0,0,0.4)",
          }}
        >
          <h2 style={{ textAlign: "center", marginBottom: "25px" }}>
            تسجيل الدخول
          </h2>

          <input
            placeholder="رقم الهاتف"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            style={inputStyle}
          />

          <input
            placeholder="PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            style={inputStyle}
          />

          <button
            onClick={handleLogin}
            style={btnPrimary}
          >
            {loading ? "جاري التحقق…" : "دخول"}
          </button>

          {error && (
            <p style={{ color: "red", marginTop: "15px", textAlign: "center" }}>
              {error}
            </p>
          )}

          <div style={{ marginTop: "25px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <a href="/register" style={btnSecondary}>تسجيل جديد</a>
            <a href="/categories" style={btnSecondary}>دخول كزائر</a>
            <a href="/contact" style={btnSecondary}>راسلنا</a>
          </div>
        </div>
      </div>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "12px",
  borderRadius: "10px",
  border: "none",
  background: "rgba(255,255,255,0.1)",
  color: "#fff",
};

const btnPrimary = {
  width: "100%",
  padding: "12px",
  background: "#6a00ff",
  border: "none",
  borderRadius: "10px",
  color: "#fff",
  fontSize: "18px",
  marginTop: "10px",
  cursor: "pointer",
};

const btnSecondary = {
  width: "100%",
  padding: "12px",
  background: "rgba(255,255,255,0.1)",
  borderRadius: "10px",
  textAlign: "center",
  color: "#fff",
  fontSize: "16px",
  textDecoration: "none",
};
