export default function Home() {
  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '40px', fontWeight: 'bold' }}>MD Marketplace</h1>
      <p style={{ marginTop: '20px', fontSize: '20px' }}>
        Welcome to MD Marketplace - Your store for everything
      </p>
      <a 
        href="/shop" 
        style={{ 
          display: 'inline-block', 
          marginTop: '30px', 
          padding: '15px 30px', 
          background: 'black', 
          color: 'white', 
          borderRadius: '10px',
          textDecoration: 'none'
        }}
      >
        Go to Shop
      </a>
    </div>
  )
}
