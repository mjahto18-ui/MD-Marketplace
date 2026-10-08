'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Search, Store, MapPin } from 'lucide-react';
import Image from 'next/image';

export default function StoresPage() {
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [geoStatus, setGeoStatus] = useState({ loading: true, allowed: true, message: '', centers: [] });
  const [locationError, setLocationError] = useState(null);

  // 1. جيب الموقع وجيب المتاجر المفلترة حسب البرج
  useEffect(() => {
    async function fetchStoresWithLocation(lat, lng) {
      try {
        const res = await fetch(`/api/stores?lat=${lat}&lng=${lng}`);
        const data = await res.json();
        if (data.success) {
          setStores(data.stores);
          setFilteredStores(data.stores);
          setGeoStatus({
            loading: false,
            allowed: data.allowed !== false,
            message: data.message || '',
            centers: data.covering_centers || [],
            total: data.total_filtered,
            total_unfiltered: data.total_unfiltered
          });
        }
      } catch (e) {
        setGeoStatus({ loading: false, allowed: true, message: '', centers: [] });
      } finally {
        setLoading(false);
      }
    }

    async function fetchStoresWithoutLocation() {
      // fallback اذا ما في موقع - يرجع كلشي (التوافق الخلفي)
      try {
        const res = await fetch('/api/stores');
        const data = await res.json();
        if (data.success) {
          setStores(data.stores);
          setFilteredStores(data.stores);
        }
      } finally {
        setLoading(false);
        setGeoStatus({ loading: false, allowed: true, message: '', centers: [] });
      }
    }

    if (!navigator.geolocation) {
      setLocationError('متصفحك ما بيدعم تحديد الموقع');
      fetchStoresWithoutLocation();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchStoresWithLocation(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        console.warn('Geolocation denied', err);
        setLocationError('لازم تسمح بالموقع لتشوف المتاجر القريبة منك بالقبة');
        // اذا رفض الموقع - ما منخليه يشوف ولا متجر حسب طلبك
        // اذا بدك يرجع يشوف كلشي حتى لو رفض، فك التعليق عن السطر تحت
        // fetchStoresWithoutLocation();
        setStores([]);
        setFilteredStores([]);
        setLoading(false);
        setGeoStatus({ loading: false, allowed: false, message: 'يجب تفعيل الموقع لعرض المتاجر ضمن نطاق السلة', centers: [] });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    fetch('/api/reviews')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setReviews(data.reviews);
        }
      });
  }, []);

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

  function renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '⯨' : '') + '☆'.repeat(empty);
  }

  function getStoreRating(storeID) {
    const approved = reviews.filter(r => r.storeId === storeID && r.status === "Approved");
    if (approved.length === 0) return { rating: 0, count: 0 };
    const rating = approved.reduce((sum, r) => sum + r.rating, 0) / approved.length;
    return { rating: Number(rating.toFixed(1)), count: approved.length };
  }

  if (loading || geoStatus.loading) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 flex items-center justify-center text-white">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p>جاري فحص التغطية...📍</p>
        <p className="text-xs text-purple-300 mt-2">عم نشوف اذا انت ضمن برج القبة</p>
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

        {/* حالة التغطية */}
        {!geoStatus.loading && (
          <div className={`mb-3 p-3 rounded-xl text-sm ${geoStatus.allowed ? 'bg-green-500/20 border border-green-500/30 text-green-300' : 'bg-red-500/20 border border-red-500/30 text-red-300'}`}>
            {geoStatus.allowed ? (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>✅ ضمن {geoStatus.centers?.map(c=>c.name || c).join(', ') || 'نطاق التغطية'} - عم تشوف {geoStatus.total || filteredStores.length} متجر قريب منك</span>
              </div>
            ) : (
              <div>
                <p className="font-bold">🚫 {geoStatus.message}</p>
                <p className="text-xs mt-1">انت بالقبة ما بتقدر تشوف متاجر المينا - والعكس صحيح. فعّل الموقع.</p>
              </div>
            )}
          </div>
        )}

        {locationError && geoStatus.allowed && (
          <div className="mb-3 p-3 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm">
            ⚠️ {locationError}
          </div>
        )}

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
            <p className="text-xl font-bold mb-2">
              {geoStatus.allowed ? 'ما لقينا متاجر' : 'خارج نطاق التغطية'}
            </p>
            <p className="text-purple-300">
              {geoStatus.allowed ? 'جرب تبحث باسم تاني - انت بتشوف بس متاجر ضمن برجك' : 'ما في متاجر ضمن برج القبة حالياً، او انت برا التغطية'}
            </p>
            {!geoStatus.allowed && (
              <button onClick={() => window.location.reload()} className="mt-4 bg-purple-600 px-4 py-2 rounded-xl text-sm">إعادة فحص الموقع</button>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {filteredStores.map(store => {
            const { rating, count } = getStoreRating(store.storeID);
            return (
              <Link key={store.storeID} href={`/store/${store.storeID}`}>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden active:scale-95 transition cursor-pointer hover:border-purple-500/50">
                  <div className="relative w-full h-28 md:h-32 bg-white flex items-center justify-center overflow-hidden">
                    <Image src={store.image} alt={store.storeName} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-contain p-2" loading="lazy" />
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-sm mb-1 truncate">{store.storeName}</h3>
                    <p className="text-xs text-purple-300 truncate">{store.address}</p>
                    <div className="text-xs text-yellow-400 mt-2">{renderStars(rating)} ({rating})</div>
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
