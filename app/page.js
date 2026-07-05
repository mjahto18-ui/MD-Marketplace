"use client";

export default function Home() {

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
    marginBottom: "10px",
    cursor: "pointer"
  };

  const btnSecondary = {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.3)",
    background: "transparent",
    color: "#fff",
    marginBottom: "10px",
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

      {/* اللوجو */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "25px"
        }}
      >
        <div style={{ fontSize: "34px", fontWeight: "bold" }}>
          MD‑Marketplace
        </div>

        <div
          style={{
            fontSize: "15px",
            opacity: 0.85,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "6px",
            marginTop: "4px"
          }}
        >
          <span style={{ fontSize: "18px" }}>🛍️</span>
          <span>One App For Everything</span>
        </div>
      </div>

      {/* البانر */}
      <div
        style={{
          background: "linear-gradient(135deg, #ff9800, #ff5722)",
          padding: "12px",
          borderRadius: "12px",
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
          marginBottom: "25px",
          flexWrap: "wrap"
        }}
      >
        <div>🎁 5 توصيلات مجانية</div>
        <div>⭐ استبدال النقاط</div>
        <div>🚚 دلفري مجاني</div>
        <div>📍 تتبع الطلب</div>
        <div>💳 محفظة رقمية</div>
      </div>

      {/* المحتوى */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap"
        }}
      >
        {/* InfoBox */}
        <div
          style={{
            flex: 1,
            minWidth: "280px",
            background: "rgba(255,255,255,0.05)",
            padding: "20px",
            borderRadius: "14px",
            backdropFilter: "blur(6px)"
          }}
        >
          <h2 style={{ marginBottom: "10px" }}>منصة رقمية للمتاجر والخدمات</h2>
          <p style={{ opacity: 0.8 }}>
            تطبيق شامل للمتاجر، المنتجات، العروض، النقاط، المحفظة، الدلفري،
            وتتبع الطلبات.  
            تجربة حديثة تجمع كل شي بمكان واحد.
          </p>
        </div>

        {/* LoginBox */}
        <div
          style={{
            flex: 1,
            minWidth: "280px",
            background: "rgba(255,255,255,0.05)",
            padding: "20px",
            borderRadius: "14px",
            backdropFilter: "blur(6px)"
          }}
        >
          <input placeholder="رقم المستخدم" style={inputStyle} />
          <input placeholder="كلمة المرور" type="password" style={inputStyle} />

          <button style={btnPrimary}>تسجيل الدخول</button>

          <button
            style={btnSecondary}
            onClick={() => (window.location.href = "/register")}
          >
            مستخدم جديد
          </button>

          <button
            style={btnSecondary}
            onClick={() => (window.location.href = "/guest")}
          >
            دخول كزائر
          </button>

          <button style={btnSecondary}>راسلنا</button>
        </div>
      </div>
    </main>
  );
}
