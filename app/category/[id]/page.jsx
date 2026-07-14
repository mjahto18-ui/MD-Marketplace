'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Search, Store } from "lucide-react";

export default function CategoryPage() {
  const { id } = useParams();
  const router = useRouter();
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadStores = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/stores/by-category?id=${id}`);
        const data = await res.json();

        if (data.success) {
          setStores(data.stores);
          setFilteredStores(data.stores);
        } else {
          console.error("API Error:", data.message);
          setStores([]);
          setFilteredStores([]);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setStores([]);
        setFilteredStores([]);
      } finally {
        setLoading(false);
      }
    };

    if (id) loadStores();
  }, [id]);

  // محرك البحث
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStores(stores);
    } else {
      const filtered = stores.filter(store =>
        store.store_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStores(filtered);
    }
  }, [searchQuery, stores]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white" style={{ direction: "rtl" }}>
      
      {/* الهيدر مع كبسة رجوع */}
      <header className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="bg-white/10 p-2 rounded-xl active:scale-90 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">المتاجر</h1>
        </div>

        {/* محرك البحث */}
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
        {/* اذا ما في نتائج */}
        {filteredStores.length === 0? (
          <div className="text-center py-20">
            <Store className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <p className="text-xl font-bold mb-2">لا يوجد متاجر</p>
            <p className="text-purple-300">
              {searchQuery ? 'جرب تبحث باسم تاني' : 'لا يوجد متاجر ضمن هذه الفئة حالياً'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {filteredStores.map(store => (
              <Link
                href={`/store/${store.store_id}`}
                key={store.store_id}
              >
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden active:scale-95 transition cursor-pointer hover:border-purple-500/50">
                  <img
                    src={store.logo || '/placeholder.png'}
                    alt={store.store_name}
                    className="w-full h-28 md:h-32 object-cover bg-white/5"
                  />
                  <div className="p-3">
                    <h2 className="font-bold text-sm mb-1 truncate">{store.store_name}</h2>
                    <p className="text-xs text-purple-300 line-clamp-2">{store.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
