"use client";
import { useState } from "react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setLoading(true);
    setError("");

    const res = await fetch("/api/register", {
      method: "POST",
      body: JSON.stringify({
        name,
        mobile,
        area,
        address,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.message);
      return;
    }

    alert("تم إرسال طلب التسجيل… الرجاء انتظار التفعيل");
    window.location.href = "/login";
  }

  return (
    <main style={{ padding: 20, direction: "rtl" }}>
      <h2>تسجيل جديد</h2>

      <input
        placeholder="الاسم الكامل"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={inputStyle}
      />

      <input
        placeholder="رقم الهاتف"
        value={mobile}
        onChange={(e) => setMobile(e.target.value)}
        style={inputStyle}
      />

      <input
        placeholder="المنطقة"
        value={area}
        onChange={(e) => setArea(e.target.value)}
        style={inputStyle}
      />

      <input
        placeholder="العنوان"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        style={inputStyle}
      />

      <button onClick={handleRegister} style={btnPrimary}>
        {loading ? "جاري الإرسال…" : "تسجيل"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </main>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "12px",
  borderRadius: "10px",
  border: "none",
  background: "#eee",
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
