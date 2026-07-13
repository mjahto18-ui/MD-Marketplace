'use client';
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function CategoryPage() {
  const { id } = useParams();
  const [stores, setStores] = useState([]);

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/stores/by-category?id=${id}`);
      const data = await res.json();
      if (data.success) setStores(data.stores);
    };
    load();
  }, [id]);

  return (
    <div className="p-4 text-white" style={{ direction: "rtl" }}>
      <h1 className="text-2xl font-bold mb-4">المتاجر</h1>

      {stores.length === 0 && (
        <p>لا يوجد متاجر ضمن هذه الفئة.</p>
      )}

      <div className="grid grid-cols-2 gap-4">
        {stores.map(store => (
          <div key={store.store_id} className="glass p-4 rounded-xl">
            <img src={store.logo} className="w-full h-24 object-cover rounded-lg mb-2" />
            <h2 className="font-bold">{store.store_name}</h2>
            <p className="text-sm opacity-70">{store.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
