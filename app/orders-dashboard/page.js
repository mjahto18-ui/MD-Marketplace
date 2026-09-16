"use client";
import { useEffect, useState } from "react";
import { Package, Star, Clock, Timer } from "lucide-react";
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
const Map = dynamic(() => import('@/components/Map'), { ssr: false });

// --- صفحة كل الطلبات /orders ---
export default function AllOrdersPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [pendings, setPendings] = useState([]);
  const [pendingRatingIds, setPendingRatingIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [filter, setFilter] = useState('all'); // all | active | delivered | rating
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const formatTimer = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) { window.location.href = '/login'; return; }
        const data = await res.json();
        setUser(data.user);

        const [oRes, pRes, rRes] = await Promise.all([
          fetch(`/api/my-orders?customerID=${data.user.customerId}`, { credentials: 'include' }),
          fetch(`/api/my-pending-overpay?customerID=${data.user.customerId}`, { credentials: 'include' }),
          fetch(`/api/check-pending-rating?customerID=${data.user.customerId}`, { credentials: 'include' })
        ]);

        const oData = await oRes.json();
        const pData = await pRes.json();
        const rData = await rRes.json();

        setOrders(oData.orders || []);
        setPendings(pData.pendings || []);
        setPendingRatingIds(rData.pendingIds || []);
        setLoading(false);
      })
      .catch(() => { window.location.href = '/login'; });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // ترتيب الأجدد فوق
  const sorted = [...orders].reverse();

  const filtered = sorted.filter(o => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['Picked Up', 'On The Way', 'Pending', 'Approved'].includes(o.status);
    if (filter === 'delivered') return o.status === 'Delivered';
    if (filter === 'rating') return pendingRatingIds.includes(o.requestID);
    return true;
  });

  const visible = filtered.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950" style={{ direction: "rtl" }}>
      <div className="max-w-3xl mx-auto p-4 pb-24">
        <div className="flex items-center justify-between mb-6 pt-2">
          <div>
            <h1 className="text-white text-2xl font-black">كل طلباتي</h1>
            <p className="text-purple-200/60 text-sm mt-1">{orders.length} طلب</p>
          </div>
          <button onClick={() => router.push('/dashboard')} className="bg-white/10 px-4 py-2 rounded-xl text-white text-sm">
            رجوع
          </button>
        </div>

        {/* فلتر */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'active', label: 'قيد التوصيل' },
            { id: 'delivered', label: 'تم التوصيل' },
            { id: 'rating', label: 'بانتظار تقييم' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => { setFilter(f.id); setVisibleCount(10); }}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap border transition ${filter === f.id ? 'bg-white text-black border-white' : 'bg-white/5 text-purple-200 border-white/10'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {visible.map(o => {
            const pickupTime = o.pickupAt ? new Date(o.pickupAt) : null;
            const isActiveTimer = pickupTime && (o.status === 'Picked Up' || o.status === 'On The Way');
            let remaining = 0;
            let expectedStr = '';
            let timerBg = 'bg-emerald-500';
            if (isActiveTimer) {
              const elapsed = Math.floor((now - pickupTime.getTime()) / 1000);
              remaining = Math.max(0, 25 * 60 - elapsed);
              const expected = new Date(pickupTime.getTime() + 25 * 60 * 1000);
              expectedStr = expected.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
              if (remaining === 0) timerBg = 'bg-red-600';
              else if (remaining < 300) timerBg = 'bg-red-500';
              else if (remaining < 600) timerBg = 'bg-yellow-400';
              else timerBg = 'bg-emerald-500';
            }
            const overpay = pendings.find(p => String(p["Request ID"]).trim().toLowerCase() === String(o.requestID).trim().toLowerCase());

            return (
              <div key={o.requestID} className="bg-white/5 rounded-xl p-3 border border-white/5">
                <div className="flex justify-between items-center">
                  <p className="text-white font-bold text-sm">#{o.requestID.slice(-6)}</p>
                  <div className="flex items-center gap-2">
                    {isActiveTimer && (
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/20 font-black text-xs ${timerBg} ${remaining < 600 && remaining !== 0 ? 'text-black' : 'text-white'} shadow-lg`}>
                        <Timer className="w-3.5 h-3.5" />
                        <span>{remaining === 0 ? 'تأخر!' : formatTimer(remaining)}</span>
                      </div>
                    )}
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-200 border border-yellow-500/20">{o.status}</span>
                  </div>
                </div>

                {overpay && (
                  <div className="mt-2 bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-2.5 flex justify-between items-center">
                    <p className="text-yellow-200 text-xs font-bold">عندك {Number(overpay.Net).toLocaleString()} ل.س فرق بالفاتورة</p>
                    <button onClick={() => router.push(`/donate/${overpay["Pending ID"]}`)} className="bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-black active:scale-95">
                      اختار
                    </button>
                  </div>
                )}

                {pendingRatingIds.includes(o.requestID) && (
                  <div className="mt-2 bg-gradient-to-r from-yellow-500/20 via-amber-400/20 to-yellow-500/20 border border-yellow-500/40 rounded-xl p-2.5 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
                        <Star className="w-4 h-4 text-black fill-black" />
                      </div>
                      <p className="text-yellow-100 text-xs font-bold">قيّم تجربتك و اربح نقاط</p>
                    </div>
                    <button onClick={() => router.push(`/rate/${o.requestID}`)} className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-4 py-1.5 rounded-full text-xs font-black">
                      قيّم ⭐
                    </button>
                  </div>
                )}

                {isActiveTimer && (
                  <div className="mt-2 bg-white/[0.07] border border-white/10 rounded-lg px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-300" />
                      <span className="text-purple-200 text-xs">الوقت المتوقع للتوصيل:</span>
                    </div>
                    <span className="text-white font-bold text-sm">{expectedStr}</span>
                  </div>
                )}

                <p className="text-purple-300/60 text-xs mt-1">{o.date}</p>
                <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                  <div><p className="text-white/40">قبل التوصيل</p><p className="text-white font-bold">{Number(o.itemsCost || 0).toLocaleString()}</p></div>
                  <div><p className="text-white/40">التوصيل</p><p className="text-white">{o.freeUsed ? 'مجاني' : Number(o.deliveryFee || 0).toLocaleString()}</p></div>
                  <div><p className="text-white/40">المجموع</p><p className="text-green-300 font-bold">{Number(o.total || 0).toLocaleString()}</p></div>
                </div>
              </div>
            );
          })}
        </div>

        {visible.length < filtered.length && (
          <button onClick={() => setVisibleCount(v => v + 10)} className="w-full mt-6 bg-white/5 border border-white/10 text-white py-3 rounded-2xl font-bold">
            تحميل 10 أكثر ({filtered.length - visible.length} باقي)
          </button>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-purple-300/50 mx-auto mb-3" />
            <p className="text-purple-200">ما في طلبات بهالفلتر</p>
          </div>
        )}
      </div>
    </div>
  );
}
