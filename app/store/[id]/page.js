'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, Search, ShoppingCart, Package } from "lucide-react";

export default function StorePage() {
  const { id: storeID } = useParams();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const customerID = "5482cbf7"; // مؤقت

  useEffect(() => {
    // أهم سطر: ما نضرب API قبل ما يوصل storeID
    if (!storeID) return;

    fetch(`/api/products/by-store?id=${storeID}`)
     .then(res => res.json())
     .then(data => {
        if (data.success) {
          setProducts(data.products);
          setFilteredProducts(data.products);
        }
        setLoading(false);
      });
  }, [storeID]);

  // محرك البحث - فلترة عالاسم
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  const addToCart = async (productID) => {
    const res = await fetch('/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerID, productID, qty: 1 })
    });
    const data = await res.json();
    alert(data.message);
  };

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

      {/* الهيدر مع كبسة رجوع */}
      <header className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="bg-white/10 p-2 rounded-xl active:scale-90 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">منتجات المتجر</h1>
        </div>

        {/* محرك البحث */}
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن منتج..."
            className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-white placeholder:text-purple-300 focus:border-purple-500 focus:outline-none transition"
          />
        </div>
      </header>

      <div className="px-4 pb-6">
        {/* اذا ما في نتائج */}
        {filteredProducts.length === 0 &&!loading && (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <p className="text-xl font-bold mb-2">ما لقينا منتجات</p>
            <p className="text-purple-300">جرب تبحث باسم تاني</p>
          </div>
        )}

        {/* شبكة المنتجات - Responsive */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {filteredProducts.map(product => (
            <div key={product.productID} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/50 transition">

              {/* صورة المنتج - صارت responsive */}
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-32 md:h-36 object-cover bg-white/5"
              />

              <div className="p-3">
                <h3 className="font-bold text-sm mb-2 truncate">{product.name}</h3>

                <div className="space-y-1 text-xs mb-3">
                  <p className="text-purple-200">
                    السعر: <span className="font-bold text-white">{Number(product.price).toLocaleString()} ل.ل</span>
                  </p>
                  <p className="text-purple-300">
                    الوزن: {product.weightPoint} نقطة
                  </p>
                </div>

                <button
                  onClick={() => addToCart(product.productID)}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 py-2.5 rounded-xl text-white font-bold text-sm active:scale-95 transition flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  اضف للسلة
                </button>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
