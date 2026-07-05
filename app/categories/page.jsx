"use client";

export default function Categories() {
  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user"))
      : null;

  const isGuest = !user;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top, #1a1a1a, #000)",
        padding: "25px",
        direction: "rtl",
        color: "#fff",
      }}
    >
      <h1 style={{ marginBottom: "20px" }}>
        {isGuest ? "تصفح كزائر" : `أهلاً ${user.name}`}
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {!isGuest && <a href="/wallet" style={boxStyle}>💰 المحفظة</a>}
        {!isGuest && <a href="/profile" style={boxStyle}>👤 ملفي</a>}
        {!isGuest && <a href="/cart" style={boxStyle}>🛒 السلة</a>}

        <a href="/stores" style={boxStyle}>🏪 المتاجر</a>
        <a href="/products" style={boxStyle}>📦 المنتجات</a>

        {!isGuest && <a href="/orders" style={boxStyle}>📑 الطلبات</a>}
      </div>
    </main>
  );
}

const boxStyle = {
  background: "rgba(255,255,255,0.05)",
  padding: "15px",
  borderRadius: "10px",
  textDecoration: "none",
  color: "#fff",
  fontSize: "18px",
};
