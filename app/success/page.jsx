"use client";

export default function SuccessPage() {
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
        ✔ تم تفعيل حسابك
      </h1>

      <p style={{ textAlign: "center", opacity: 0.8 }}>
        يمكنك الآن تسجيل الدخول والبدء باستخدام التطبيق.
      </p>

      <div style={{ textAlign: "center", marginTop: "30px" }}>
        <button
          style={{
            padding: "12px 20px",
            borderRadius: "10px",
            background: "#ff9800",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold"
          }}
          onClick={() => (window.location.href = "/")}
        >
          العودة للرئيسية
        </button>
      </div>
    </main>
  );
}
