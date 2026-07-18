'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Search, Store } from 'lucide-react';

export default function StoresPage() {
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // جلب المتاجر
  useEffect(() => {
    fetch('/api/stores')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStores(data.stores);
          setFilteredStores(data.stores);
        }
      });
  }, []);

  // جلب التقييمات
  useEffect(() => {
    fetch('/api/reviews')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setReviews(data.reviews);
        }
        setLoading(false);
      });
  }, []);

  // فلترة البحث
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStores(stores);
    } else {
      const filtered = stores.filter(store =>
        store.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStores(filtered);
    }
  }, [searchQuery, stores]);

  // حساب التقييم لكل متجر (نفس أب شيت 100%)
  function getStoreRating(storeID) {
    const approved = reviews.filter(
      r => r.storeId === storeID && r.status === "Approved"
    );

    if (approved.length === 0) {
      return { rating: 0, count: 0 };
    }

    const rating =
      approved.reduce((sum, r) => sum + r.rating, 0) / approved.length;

    return {
      rating: Number(rating.toFixed(1)),
      count: approved.length
    };
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 flex items-center justify-center text-white">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p>جاري التحميل...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white" style={{ direction: 'rtl' }}>
      
      <header className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/shop">
            <button className="bg-white/10 p-2 rounded-xl active:scale-90 transition">
              <ChevronRight className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-2xl font-bold">كل المتاجر</h1>
        </div>

        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن متجر..."
            className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-white placeholder:text-purple-300 focus:border-purple-500 focus:outline-none transition"
          />
        </div>
      </header>

      <div className="px-4 pb-6">

        {filteredStores.length === 0 && (
          <div className="text-center py-20">
            <Store className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <p className="text-xl font-bold mb-2">ما لقينا متاجر</p>
            <p className="text-purple-300">جرب تبحث باسم تاني</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {filteredStores.map(store => {
            const { rating, count } = getStoreRating(store.storeID);

            return (
              <Link key={store.storeID} href={`/store/${store.storeID}`}>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden active:scale-95 transition cursor-pointer hover:border-purple-500/50">
                  
                  <img 
                    src={store.image}
                    alt={store.storeName}
                    className="w-full h-28 md:h-32 object-cover bg-white/5"
                  />

                  <div className="p-3">
                    <h3 className="font-bold text-sm mb-1 truncate">{store.storeName}</h3>
                    <p className="text-xs text-purple-300 truncate">{store.address}</p>

                    {/* ⭐⭐⭐⭐☆ (4.2) */}
                    <div className="text-xs text-yellow-400 mt-2">
                      ⭐⭐⭐⭐⭐ ({rating})
                    </div>

                    {/* عدد التقييمات */}
                    <p className="text-xs text-purple-300">{count} تقييم</p>
                  </div>

                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
