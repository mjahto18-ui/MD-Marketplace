"use client";

export default function PendingPage() {
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
        قيد المراجعة
      </h1>

      <p style={{ textAlign: "center", opacity: 0.8 }}>
        تم إرسال طلبك وسيتم تفعيل حسابك قريباً.
      </p>
    </main>
  );
}
