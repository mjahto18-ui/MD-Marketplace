"use client";

export default function RegisterPage() {
  const inputStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    marginBottom: "12px",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    fontSize: "14px",
    outline: "none"
  };

  const btnPrimary = {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    background: "#ff9800",
    color: "#000",
    fontWeight: "bold",
    marginTop: "10px",
    cursor: "pointer"
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #3b1d5a 0%, #0b0b16 55%, #000000 100%)",
        padding: "25px",
        direction: "rtl",
        color: "#fff"
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
        إنشاء حساب جديد
      </h1>

      <div
        style={{
          maxWidth: "400px",
          margin: "auto",
          background: "rgba(255,255,255,0.05)",
          padding: "20px",
          borderRadius: "14px",
          backdropFilter: "blur(6px)"
        }}
      >
        <input placeholder="الاسم الكامل" style={inputStyle} />
        <input placeholder="رقم الهاتف" style={inputStyle} />
        <input placeholder="المنطقة" style={inputStyle} />
        <input placeholder="العنوان" style={inputStyle} />

        <button
          style={btnPrimary}
          onClick={() => (window.location.href = "/confirm")}
        >
          متابعة
        </button>
      </div>
    </main>
  );
}
