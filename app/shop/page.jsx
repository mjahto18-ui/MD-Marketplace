"use client"
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { ShoppingCart, User, LogOut, Store, Package, Sparkles, Crown } from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import Image from 'next/image';

function CartBell() {
  const [hasItems, setHasItems] = useState(false);
  useEffect(() => {
    async function checkCart() {
      try {
        const res = await fetch('/api/cart', { credentials: 'include' });
        const data = await res.json();
        if (data.success && data.cart && data.cart.length > 0) setHasItems(true);
      } catch (e) {}
    }
    checkCart();
  }, []);
  if (!hasItems) return null;
  return (
    <div style={{ position: 'absolute', top: -4, right: -4, background: 'yellow', width: 16, height: 16, borderRadius: '50%', border: '2px solid white', animation: 'shake 0.5s infinite' }}>
      <style>{`@keyframes shake {0%{transform:translate(0,0)}25%{transform:translate(2px,-2px)}50%{transform:translate(-2px,2px)}75%{transform:translate(2px,2px)}100%{transform:translate(0,0)}}`}</style>
    </div>
  );
}

function CartIcon({ user }) {
  const router = useRouter();
  if (!user) return null;
  return (
    <button onClick={() => router.push('/cart')} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 relative active:scale-95 transition">
      <ShoppingCart className="w-5 h-5 text-white" />
      <CartBell />
    </button>
  );
}

export default function ShopPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [tierData, setTierData] = useState(null);
  const [kingsData, setKingsData] = useState(null);
  const [showKings, setShowKings] = useState(false);

  useEffect(() => {
    fetch('/api/me', { credentials: 'include', cache: 'no-store' }).then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          fetch(`/api/my-balance?customerID=${data.user.customerId}`, { credentials: 'include' })
        .then(r=>r.json()).then(b=>{
            fetch('/api/loyalty-tiers').then(r=>r.json()).then(tData=>{
              const tiersList = tData.tiers || [];
              if(tiersList.length){
                let current = tiersList[0];
                for(let t of tiersList) if((b.points||0) >= t.min_points) current = t;
                let fill = current.min_spent && current.min_spent>0? (b.total_spent||0)/current.min_spent : 1;
                if(fill>1) fill=1; if(fill<0) fill=0;
                let disc = Number(current.base_discount)*fill;
                setTierData({
                  current,
                  fill_percent: Math.round(fill*100),
                  actual_discount: Number(disc.toFixed(2))
                });
              }
            });
          });
        }
      }
    }).finally(() => setLoading(false));

    fetch('/api/categories', { cache: 'no-store' }).then(r => r.json()).then((catData) => {
      setCategories(catData.categories || []);
    });

    fetch('/api/leaderboard', { cache: 'no-store' }).then(r=>r.json()).then(setKingsData);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
    document.cookie = 'acceptedTerms=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
    router.push('/login');
    router.refresh();
  };

  if (loading) return (<div className="min-h-screen gradient-bg flex items-center justify-center"><div className="text-white text-xl">جاري التحميل...</div></div>);

  return (
    <div className="min-h-screen gradient-bg">
      <div className="glass border-b border-white/10 p-4">
        <div className="max-w-6xl mx-auto flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold">MD Marketplace</h1>
                <p className="text-purple-200 text-xs">{user? `أهلاً ${user.name}` : 'تصفح كزائر'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CartIcon user={user} />
              {user? (
                <>
                  <button onClick={() => router.push('/dashboard')} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 active:scale-95 transition"><User className="w-5 h-5 text-white" /></button>
                  <button onClick={handleLogout} className="bg-red-500/20 border border-red-500/30 px-3 py-2 rounded-xl flex items-center gap-2 hover:bg-red-500/30 transition active:scale-95"><LogOut className="w-4 h-4 text-red-300" /><span className="text-red-300 text-sm font-bold hidden sm:block">خروج</span></button>
                </>
              ) : (
                <button onClick={() => router.push('/login')} className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 rounded-xl text-white text-sm font-semibold active:scale-95 transition">تسجيل دخول</button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Link href="/stores" className="glass rounded-2xl p-4 text-center hover:bg-white/10 transition-all border border-purple-500/30 active:scale-95"><Store className="w-7 h-7 text-purple-400 mx-auto mb-2" /><h3 className="text-white font-bold text-sm">جميع المتاجر</h3></Link>

          {user? (
            <Link href="/products" className="glass rounded-2xl p-4 text-center hover:bg-white/10 transition-all border border-pink-500/30 active:scale-95"><Package className="w-7 h-7 text-pink-400 mx-auto mb-2" /><h3 className="text-white font-bold text-sm">جميع المنتجات</h3></Link>
          ) : (
            <button onClick={() => router.push('/login')} className="glass rounded-2xl p-4 text-center hover:bg-white/10 transition-all border border-white/10 opacity-60 active:scale-95"><Package className="w-7 h-7 text-gray-400 mx-auto mb-2" /><h3 className="text-white font-bold text-sm">🔒 جميع المنتجات</h3></button>
          )}

          {/* هون قسمنا بوكس الطلب الخاص ل تنين */}
          {user? (
            <button onClick={() => window.open(`https://wa.me/9613177653?text=${encodeURIComponent("مرحبا، بدي اطلب طلب خاص")}`, '_blank')} className="glass rounded-2xl p-3 text-center hover:bg-white/10 transition-all border border-yellow-500/30 active:scale-95">
              <Sparkles className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
              <h3 className="text-white font-bold text-xs">طلب خاص</h3>
            </button>
          ) : (
            <button onClick={() => router.push('/login')} className="glass rounded-2xl p-3 text-center border border-white/10 opacity-60 active:scale-95">
              <Sparkles className="w-6 h-6 text-gray-400 mx-auto mb-1" />
              <h3 className="text-white font-bold text-xs">🔒 طلب خاص</h3>
            </button>
          )}

          {/* البوكس الجديد - الملك العام - يلمع */}
          <button onClick={() => setShowKings(true)} className="rounded-2xl p-3 text-center active:scale-95 relative overflow-hidden group border border-yellow-400/50"
            style={{ background: 'linear-gradient(135deg, #FFD70015, #FFA50025)', boxShadow: '0 0 20px rgba(255,215,0,0.3)' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" style={{animation:'shine 2s infinite'}}></div>
            <style>{`@keyframes shine{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}} @keyframes glow{0%,100%{box-shadow:0 0 10px gold}50%{box-shadow:0 0 25px gold}}`}</style>
            <Crown className="w-6 h-6 text-yellow-400 mx-auto mb-1 animate-pulse drop-shadow-[0_0_8px_gold]" />
            <h3 className="text-yellow-300 font-bold text-xs">👑 ملك المتجر</h3>
            <p className="text- text-white/80 mt-1 truncate">{kingsData?.top1? `${kingsData.top1.display_name} - ${kingsData.top1.tier_name}` : 'جاري...'}</p>
            <p className="text- text-yellow-200/60">اضغط للعرض</p>
          </button>

          {user && tierData? (
            <Link href="/dashboard" className="glass rounded-2xl p-4 text-center hover:bg-white/10 transition-all active:scale-95 relative overflow-hidden group col-span-2 md:col-span-2" style={{ borderColor: tierData.current.color, borderWidth: '1px', background: `linear-gradient(135deg, ${tierData.current.color}15, transparent)` }}>
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20 -mr-10 -mt-10" style={{ background: tierData.current.color }}></div>
              <div className="w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center relative" style={{ background: tierData.current.color }}>
                <Crown className="w-6 h-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-white font-bold text-sm" style={{ color: tierData.current.color }}>{tierData.current.tier_name}</h3>
              <p className="text-xs mt-1 font-bold" style={{ color: tierData.current.color }}>خصمك {tierData.actual_discount}%</p>
              <div className="w-full bg-white/10 rounded-full h-1.5 mt-2 overflow-hidden">
                <div className="h-1.5 rounded-full transition-all" style={{ width: `${tierData.fill_percent}%`, background: tierData.current.color }}></div>
              </div>
            </Link>
          ) : user? (
            <div className="glass rounded-2xl p-4 text-center border border-white/10 opacity-50 col-span-2">
              <Crown className="w-7 h-7 text-gray-400 mx-auto mb-2 animate-pulse" />
              <h3 className="text-white font-bold text-sm">...</h3>
            </div>
          ) : (
            <button onClick={() => router.push('/login')} className="glass rounded-2xl p-4 text-center hover:bg-white/10 transition-all border border-white/10 opacity-60 active:scale-95 col-span-2"><Crown className="w-7 h-7 text-gray-400 mx-auto mb-2" /><h3 className="text-white font-bold text-sm">🔒 مرتبتي</h3></button>
          )}
        </div>

        <h2 className="text-white font-bold text-lg mb-4">تصفح حسب القسم</h2>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-8">
          {categories.map((cat, index) => (
            <Link key={cat.id} href={`/category/${cat.id}`} className="glass rounded-2xl p-3 text-center hover:bg-white/10 transition-all group active:scale-95">
              <div className="relative aspect-square bg-white/5 rounded-xl mb-2 overflow-hidden flex items-center justify-center p-2">
                {cat.image && (
                  <Image src={cat.image} alt={cat.name} fill sizes="200px" className="object-contain p-2 group-hover:scale-110 transition-all duration-300" unoptimized loading="eager" priority={index < 3} fetchPriority={index < 3? "high" : "low"} />
                )}
              </div>
              <h3 className="text-white font-semibold text-xs">{cat.name}</h3>
            </Link>
          ))}
        </div>
      </div>

      {showKings && kingsData && (
        <div onClick={()=>setShowKings(false)} className="fixed inset-0 bg-black/70 z-[9999] flex justify-center items-center p-4">
          <div onClick={e=>e.stopPropagation()} className="glass w-full max-w- max-h- overflow-auto rounded- p-5" style={{background:'#1a1a3e'}}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white font-bold text-lg">👑 لائحة الملوك</h2>
              <button onClick={()=>setShowKings(false)} className="text-white/60 w-8 h-8 bg-white/10 rounded-full">✕</button>
            </div>
            {kingsData.top1 && (
              <div className="mb-4 p-3 rounded-xl border" style={{background: `${kingsData.top1.color}20`, borderColor: kingsData.top1.color, boxShadow:`0 0 15px ${kingsData.top1.color}50`}}>
                <p className="text-xs opacity-70 text-white">👑 ملك المتجر الحالي</p>
                <p className="text-white font-bold">{kingsData.top1.display_name} - {kingsData.top1.tier_name} - {Math.floor(kingsData.top1.total_spent/1000000)}M</p>
              </div>
            )}
            {Object.entries(kingsData.grouped).map(([slug, users])=>(
              <div key={slug} className="mb-4 pb-3 border-b border-white/10">
                <h3 className="text-white/80 text-sm font-bold uppercase mb-2">{slug} ({users.length})</h3>
                {users.length===0? <p className="text-white/30 text-xs">لا يوجد ملوك بعد</p> :
                  users.map((u,i)=>(
                    <div key={u.customer_id} className="flex justify-between py-2">
                      <span className="text-white text-sm">{i+1}. {u.display_name}</span>
                      <span className="text-white/60 text-xs">{Math.floor(u.total_spent/1000000)}M - {u.points} نقطة</span>
                    </div>
                  ))
                }
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
