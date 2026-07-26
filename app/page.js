import Link from 'next/link';

export default function Home() {
  return (
    <div style={{minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20}}>
      <h1 style={{fontSize:40, fontWeight:'bold'}}>Welcome to MD Marketplace</h1>
      <p>Discover products from multiple stores</p>
      <Link href="/shop" style={{background:'black', color:'white', padding:'12px 24px', borderRadius:8}}>
        Go to Shop
      </Link>
      <Link href="/login" style={{border:'1px solid black', padding:'12px 24px', borderRadius:8}}>
        Login
      </Link>
    </div>
  )
}
