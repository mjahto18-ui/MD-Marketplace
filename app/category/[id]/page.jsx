'use client';
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function CategoryPage() {
  const { id } = useParams();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStores = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/stores/by-category?id=${id}`);
        const data = await res.json();

        if (data.success) {
          setStores(data.stores);
        } else {
          console.error("API Error:", data.message);
          setStores([]);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setStores([]);
      } finally {
        setLoading(false);
      }
    };

    if (id) loadStores();
  }, [id]);

  if (loading) {
    return (
      <div className="p-4 text-white" style={{ direction: "rtl" }}>
        <h1 className="text-2xl font-bold mb-4">جاري التحميل....</h1>
      </div>
    );
  }

  return (
    <div className="p-4 text-white" style={{ direction: "rtl" }}>
      <h1 className="text-2xl font-bold mb-4">المتاجر</h1>

      {stores.length === 0? (
        <p className="text-center opacity-70 mt-8">لا يوجد متاجر ضمن هذه الفئة حالياً</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {stores.map(store => (
            <Link
              href={`/store/${store.store_id}`}
              key={store.store_id}
            >
              <div className="glass p-4 rounded-xl hover:scale-105 transition-transform cursor-pointer">
                <img
                  src={store.logo || '/placeholder.png'}
                  alt={store.store_name}
                  className="w-full h-24 object-cover rounded-lg mb-2"
                />
                <h2 className="font-bold text-lg truncate">{store.store_name}</h2>
                <p className="text-sm opacity-70 line-clamp-2">{store.description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
