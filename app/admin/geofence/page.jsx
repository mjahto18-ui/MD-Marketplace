'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import dynamic from 'next/dynamic';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Leaflet dynamic import مشان Next.js
const MapComponent = dynamic(() => import('./Map'), { ssr: false });

export default function GeofenceAdmin() {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCenters();
  }, []);

  async function fetchCenters() {
    const { data } = await supabase.from('geofence_centers').select('*').order('created_at');
    setCenters(data || []);
    setLoading(false);
  }

  async function saveCenter(c) {
    const { error } = await supabase.from('geofence_centers').upsert(c);
    if (!error) fetchCenters();
  }

  async function deleteCenter(id) {
    await supabase.from('geofence_centers').delete().eq('id', id);
    fetchCenters();
  }

  if (loading) return <div className="p-10">تحميل...</div>;

  return (
    <div className="flex h-screen">
      {/* الخريطة */}
      <div className="flex-1">
        <MapComponent 
          centers={centers} 
          onAddCenter={saveCenter}
          onUpdateCenter={saveCenter}
        />
      </div>

      {/* القائمة الجانبية */}
      <div className="w-96 bg-zinc-900 text-white p-4 overflow-y-auto">
        <h2 className="font-bold text-xl mb-4">السنترات ({centers.length})</h2>
        <p className="text-xs text-zinc-400 mb-4">كبوس عالخريطة لتضيف سنتر جديد</p>

        {centers.map(c => (
          <div key={c.id} className="bg-zinc-800 rounded-lg p-3 mb-3">
            <input 
              value={c.name} 
              onChange={e => saveCenter({...c, name: e.target.value})}
              className="bg-zinc-700 w-full p-2 rounded mb-2"
            />
            
            <div className="space-y-2 text-sm">
              <label>🛒 سلة: {c.radius_cart}km
                <input type="range" min="1" max="100" value={c.radius_cart} 
                  onChange={e => saveCenter({...c, radius_cart: parseInt(e.target.value)})}
                  className="w-full" />
              </label>
              <label>🚕 تاكسي: {c.radius_taxi}km
                <input type="range" min="1" max="100" value={c.radius_taxi}
                  onChange={e => saveCenter({...c, radius_taxi: parseInt(e.target.value)})}
                  className="w-full" />
              </label>
              <label>🤖 بوت: {c.radius_bot}km
                <input type="range" min="1" max="100" value={c.radius_bot}
                  onChange={e => saveCenter({...c, radius_bot: parseInt(e.target.value)})}
                  className="w-full" />
              </label>
            </div>

            <div className="flex gap-2 mt-3 text-xs">
              <label><input type="checkbox" checked={c.is_active} onChange={e => saveCenter({...c, is_active: e.target.checked})} /> نشط</label>
              <label><input type="checkbox" checked={c.cart_enabled} onChange={e => saveCenter({...c, cart_enabled: e.target.checked})} /> سلة</label>
              <label><input type="checkbox" checked={c.taxi_enabled} onChange={e => saveCenter({...c, taxi_enabled: e.target.checked})} /> تاكسي</label>
              <label><input type="checkbox" checked={c.bot_enabled} onChange={e => saveCenter({...c, bot_enabled: e.target.checked})} /> بوت</label>
            </div>

            <button onClick={() => deleteCenter(c.id)} className="mt-2 text-red-400 text-xs">حذف</button>
          </div>
        ))}
      </div>
    </div>
  );
}
