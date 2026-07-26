"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Store, Search, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then(r => r.json()),
      fetch('/api/stores').then(r => r.json()),
      fetch('/api/products').then(r => r.json()),
    ]).then(([catData, storeData, prodData]) => {
      setCategories((catData.categories || []).slice(0,6));
      setStores((storeData.stores || []).slice(0,4));
      setProducts((prodData.products || []).slice(0,8));
    });
  }, []);

  return (
    <div className="min-h-screen gradient-bg">
      {/* NAVBAR */}
      <div className="glass border-b border-white/10 p-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-black text-white">MD MARKETPLACE</h1>
          <div className="flex gap-3">
            <Link href="/shop" className="bg-white text-black px-5 py-2 rounded-full font-bold hover:bg-white/90">Shop</Link>
            <Link href="/login" className="glass border border-white/20 text-white px-5 py-2 rounded-full font-bold">Login</Link>
          </div>
        </div>
      </div>

      {/* HERO */}
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-5xl md:text-7xl font-black text-white leading-tight">
          Everything You Need,<br/>
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">In One Place</span>
        </h1>
        <p className="text-white/60 mt-6 text-lg max-w-2xl mx-auto">
          Discover products from multiple stores. Shop from your favorite local stores in one checkout.
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <Link href="/shop" className="bg-gradient-to-br from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-black flex items-center gap-2 text-lg">
            Start Shopping <ArrowRight size={20}/>
          </Link>
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-white text-2xl font-bold mb-6">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map(c => (
            <Link key={c.id} href={`/shop?category=${c.id}`} className="glass border border-white/10 p-6 rounded-2xl text-center hover:bg-white/10 transition">
              <div className="text-white font-bold">{c.name}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* PRODUCTS */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white text-2xl font-bold">Featured Products</h2>
          <Link href="/shop" className="text-purple-400 font-bold flex items-center gap-1">View All <ArrowRight size={16}/></Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map(p => (
            <div key={p.id} className="glass border border-white/10 rounded-2xl overflow-hidden">
              <div className="h-40 bg-white/5 flex items-center justify-center text-white/20">Image</div>
              <div className="p-4">
                <div className="text-white font-bold truncate">{p.name}</div>
                <div className="text-purple-400 font-black mt-1">${p.price}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center py-10 text-white/30 text-sm">
        © 2020 MD Marketplace - All Rights Reserved
      </div>
    </div>
  );
}
