"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import BackToDashboard from "@/components/BackToDashboard";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function GeofenceManagersPage(){
  const [centers, setCenters] = useState([]);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [usersFound, setUsersFound] = useState([]);
  const [selected, setSelected] = useState(null);

  const [form, setForm] = useState({
    geofence_center_id: "",
    assigned_service: "taxi",
    is_active: true
  });

  useEffect(()=>{ load() },[]);

  async function load(){
    const {data: c} = await supabase.from('geofence_centers').select('id,name').order('name');
    setCenters(c||[]);
    const {data: m} = await supabase.from('geofence_center_managers').select('*').order('assigned_at',{ascending:false}).limit(100);
    setRows(m||[]);
  }

  // البحث بالاسم
  useEffect(()=>{
    if(search.length < 2){ setUsersFound([]); return; }
    const t = setTimeout(async()=>{
      const {data} = await supabase.from('users').select('"User ID", Name, Email, Role').ilike('Name', `%${search}%`).limit(10);
      setUsersFound(data||[]);
    },400);
    return ()=>clearTimeout(t);
  },[search]);

  async function handleSave(){
    if(!selected ||!form.geofence_center_id){
      alert("اختار المركز والمدير");
      return;
    }

    // 1- طفي القديم لنفس المركز + نفس السيرفيس
    await supabase.from('geofence_center_managers')
     .update({is_active:false})
     .eq('geofence_center_id', form.geofence_center_id)
     .eq('assigned_service', form.assigned_service)
     .eq('is_active', true);

    // 2- ضيف الجديد - يجيب الاسم بس يحط user_id
    const {error} = await supabase.from('geofence_center_managers').insert({
      geofence_center_id: form.geofence_center_id,
      manager_user_id: selected["User ID"],
      manager_name: selected.Name,
      assigned_service: form.assigned_service,
      is_active: form.is_active
    });

    if(error){ alert(error.message); return; }

    setSearch(""); setSelected(null);
    load();
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <BackToDashboard />
      <h1 className="text-2xl font-bold mt-4 mb-6">مدراء مراكز التغطية</h1>

      <div className="bg-zinc-800 p-4 rounded-lg max-w-xl mb-8">
        <label className="text-sm">المركز</label>
        <select value={form.geofence_center_id} onChange={e=>setForm({...form, geofence_center_id:e.target.value})} className="w-full bg-zinc-700 p-2 rounded mt-1 mb-3">
          <option value="">اختر مركز</option>
          {centers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <label className="text-sm">السيرفيس</label>
        <select value={form.assigned_service} onChange={e=>setForm({...form, assigned_service:e.target.value})} className="w-full bg-zinc-700 p-2 rounded mt-1 mb-3">
          <option value="taxi">taxi</option>
          <option value="cart">cart</option>
        </select>

        <label className="text-sm">ابحث عن المدير بالاسم (رح ينحفظ الـ user_id)</label>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="اكتب اسم المدير..." className="w-full bg-zinc-700 p-2 rounded mt-1" />

        {usersFound.length>0 &&!selected && (
          <div className="bg-zinc-700 rounded mt-1 max-h-40 overflow-auto">
            {usersFound.map(u=>(
              <div key={u["User ID"]} onClick={()=>{setSelected(u); setSearch(u.Name); setUsersFound([])}} className="p-2 hover:bg-zinc-600 cursor-pointer border-b border-zinc-600">
                <div className="font-bold">{u.Name}</div>
                <div className="text-xs text-zinc-400">{u["User ID"]} - {u.Role}</div>
              </div>
            ))}
          </div>
        )}

        {selected && (
          <div className="bg-green-900/30 border border-green-600 p-2 rounded mt-2 text-sm">
            ✅ تم الاختيار: {selected.Name} <br/>
            <span className="text-xs text-zinc-400">ID رح ينحفظ: {selected["User ID"]}</span>
            <button onClick={()=>{setSelected(null); setSearch("")}} className="ml-2 text-red-400">x</button>
          </div>
        )}

        <button onClick={handleSave} className="w-full bg-yellow-500 text-black font-bold p-2 rounded mt-4">حفظ المدير</button>
      </div>

      <div className="bg-zinc-800 p-4 rounded-lg">
        <h2 className="font-bold mb-3">التعيينات الحالية ({rows.length})</h2>
        <div className="space-y-2">
          {rows.map(r=>(
            <div key={r.id} className="bg-zinc-700 p-3 rounded flex justify-between">
              <div>
                <div className="font-bold">{r.manager_name}</div>
                <div className="text-xs text-zinc-400">{r.manager_user_id} | {r.assigned_service} | {r.is_active? "نشط ✅":"مطفي ❌"}</div>
              </div>
              <div className="text-xs">{centers.find(c=>c.id===r.geofence_center_id)?.name || r.geofence_center_id.slice(0,8)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
