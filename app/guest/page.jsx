"use client";

export default function GuestPage() {
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
        👋 مرحباً بك كزائر
      </h1>

      <p style={{ textAlign: "center", opacity: 0.8, marginBottom: "30px" }}>
        يمكنك مشاهدة المتاجر والمنتجات فقط.  
        لإكمال الطلبات يرجى تسجيل الدخول.
      </p>

      <div
        style={{
          background: "rgba(255,255,255,0.05)",
          padding: "20px",
          borderRadius: "14px",
          backdropFilter: "blur(6px)",
          textAlign: "center"
        }}
      >
        <h3>المتاجر المتاحة</h3>
        <p style={{ opacity: 0.7 }}>سيتم عرض المتاجر هنا لاحقاً…</p>
      </div>
    </main>
  );
}
