'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import dynamic from 'next/dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const MapComponent = dynamic(() => import('./Map'), { ssr: false });

function CenterCard({ c, onSave, onDelete }) {
  const [local, setLocal] = useState(c);

  // لما يجي تحديث من برا (من الخريطة)
  useEffect(() => { setLocal(c); }, [c]);

  // Debounce save - بس بعد 600ms من اخر تغيير
  useEffect(() => {
    const timer = setTimeout(() => {
      // اذا في فرق بساعتا احفظ
      if (JSON.stringify(local)!== JSON.stringify(c)) {
        onSave(local);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [local]);

  const update = (field, value) => {
    setLocal(prev => ({...prev, [field]: value }));
  };

  return (
    <div className="bg-zinc-800 rounded-lg p-3 mb-3">
      <input
        value={local.name}
        onChange={e => update('name', e.target.value)}
        className="bg-zinc-700 w-full p-2 rounded mb-3"
        placeholder="اسم المركز"
      />

      <div className="space-y-3 text-sm">
        {/* سلة */}
        <div>
          <div className="flex justify-between">
            <span>🛒 سلة</span>
            <div className="flex gap-2 items-center">
              <input type="number" min="1" max="100" value={local.radius_cart}
                onChange={e => update('radius_cart', parseInt(e.target.value) || 1)}
                className="bg-zinc-700 w-14 p-1 rounded text-center" />
              <span>km</span>
            </div>
          </div>
          <input type="range" min="1" max="100" value={local.radius_cart}
            onChange={e => update('radius_cart', parseInt(e.target.value))}
            className="w-full accent-red-500" />
        </div>

        
        {/* بوت */}
        <div>
          <div className="flex justify-between">
            <span>🤖 بوت</span>
            <div className="flex gap-2 items-center">
              <input type="number" min="1" max="100" value={local.radius_bot}
                onChange={e => update('radius_bot', parseInt(e.target.value) || 1)}
                className="bg-zinc-700 w-14 p-1 rounded text-center" />
              <span>km</span>
            </div>
          </div>
          <input type="range" min="1" max="100" value={local.radius_bot}
            onChange={e => update('radius_bot', parseInt(e.target.value))}
            className="w-full accent-orange-500" />
        </div>
        
        {/* تاكسي */}
        <div>
          <div className="flex justify-between">
            <span>🚕 تاكسي</span>
            <div className="flex gap-2 items-center">
              <input type="number" min="1" max="100" value={local.radius_taxi}
                onChange={e => update('radius_taxi', parseInt(e.target.value) || 1)}
                className="bg-zinc-700 w-14 p-1 rounded text-center" />
              <span>km</span>
            </div>
          </div>
          <input type="range" min="1" max="100" value={local.radius_taxi}
            onChange={e => update('radius_taxi', parseInt(e.target.value))}
            className="w-full accent-blue-500" />
        </div>
      </div>

      <div className="flex gap-3 mt-3 text-xs">
        <label className="flex gap-1"><input type="checkbox" checked={local.is_active} onChange={e => update('is_active', e.target.checked)} /> نشط</label>
        <label className="flex gap-1"><input type="checkbox" checked={local.cart_enabled} onChange={e => update('cart_enabled', e.target.checked)} /> سلة</label>      
        <label className="flex gap-1"><input type="checkbox" checked={local.bot_enabled} onChange={e => update('bot_enabled', e.target.checked)} /> بوت</label>
        <label className="flex gap-1"><input type="checkbox" checked={local.taxi_enabled} onChange={e => update('taxi_enabled', e.target.checked)} /> تاكسي</label>
      </div>

      <button onClick={() => onDelete(local.id)} className="mt-3 text-red-400 text-xs hover:text-red-300">حذف المركز</button>
    </div>
  );
}

export default function GeofenceAdmin() {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCenters(); }, []);

  async function fetchCenters() {
    const { data } = await supabase.from('geofence_centers').select('*').order('created_at');
    setCenters(data || []);
    setLoading(false);
  }

  const saveCenter = useCallback(async (c) => {
    const { error } = await supabase.from('geofence_centers').upsert(c);
    if (!error) {
      // تحديث محلي بدون fetch كامل - اسرع
      setCenters(prev => prev.map(p => p.id === c.id? c : p));
    }
  }, []);

  async function deleteCenter(id) {
    await supabase.from('geofence_centers').delete().eq('id', id);
    setCenters(prev => prev.filter(p => p.id!== id));
  }

  async function handleAddCenter(newCenter) {
    const { data, error } = await supabase.from('geofence_centers').insert(newCenter).select().single();
    if (!error && data) setCenters(prev => [...prev, data]);
  }

  if (loading) return <div className="p-10 bg-zinc-900 text-white h-screen">تحميل...</div>;

  return (
    <div className="flex h-screen">
      <div className="flex-1">
        <MapComponent
          centers={centers}
          onAddCenter={handleAddCenter}
          onUpdateCenter={saveCenter}
        />
      </div>

      <div className="w-96 bg-zinc-900 text-white p-4 overflow-y-auto">
        <h2 className="font-bold text-xl mb-1">مراكز ابراج التغطية ({centers.length})</h2>
        <p className="text-xs text-zinc-400 mb-4">اضغط على الخريطة لإضافة برج تغطية</p>

        {centers.map(c => (
          <CenterCard key={c.id} c={c} onSave={saveCenter} onDelete={deleteCenter} />
        ))}
      </div>
    </div>
  );
}
