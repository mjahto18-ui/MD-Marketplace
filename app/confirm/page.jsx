"use client";

export default function ConfirmPage() {
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
        تأكيد المعلومات
      </h1>

      <p style={{ textAlign: "center", opacity: 0.8 }}>
        سيتم إرسال طلبك للمراجعة والتفعيل.
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
          onClick={() => (window.location.href = "/location")}
        >
          متابعة
        </button>
      </div>
    </main>
  );
}
