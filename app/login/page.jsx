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

    // إذا المستخدم Pending
    if (data.status === "pending") {
      setError("تم إرسال طلب الانضمام… الرجاء انتظار التفعيل");
      return;
    }

    // إذا خطأ
    if (!data.success) {
      setError(data.message);
      return;
    }

    // تخزين بيانات المستخدم
    localStorage.setItem("user", JSON.stringify(data.user));

    // دخول
    window.location.href = "/categories";
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top, #1a1a1a, #000)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        direction: "rtl",
      }}
    >
      <div
        style={{
          background: "rgba(255,255,255,0.05)",
          padding: "30px",
          borderRadius: "15px",
          width: "100%",
          maxWidth: "380px",
          color: "#fff",
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
          style={{
            width: "100%",
            padding: "12px",
            background: "#6a00ff",
            border: "none",
            borderRadius: "10px",
            color: "#fff",
            fontSize: "18px",
            marginTop: "10px",
            cursor: "pointer",
          }}
        >
          {loading ? "جاري التحقق…" : "دخول"}
        </button>

        {error && (
          <p style={{ color: "red", marginTop: "15px", textAlign: "center" }}>
            {error}
          </p>
        )}

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <a href="/categories" style={{ color: "#aaa" }}>
            دخول كزائر
          </a>
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
