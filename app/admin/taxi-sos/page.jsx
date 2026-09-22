"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { ShieldAlert, Phone, Car, User, MapPin, CheckCircle, Clock } from "lucide-react";
import BackToDashboard from "@/components/BackToDashboard";
import dynamicImport from "next/dynamic";

const Map = dynamicImport(() => import("@/components/Map"), {
  ssr: false,
  loading: () => <div className="p-4 text-center text-white/40 text-xs">جاري تحميل خريطة الطوارئ...</div>
});

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function SOSDashboardPage() {
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. جلب بلاغات الطوارئ النشطة غير المقفلة
  const fetchActiveSOS = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("taxi_sos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error) setAlerts(data || []);
    if (data?.[0] && !selectedAlert) setSelectedAlert(data[0]);
    setLoading(false);
  };

  useEffect(() => {
    fetchActiveSOS();

    // 2. ⚡ السحر الحقيقي: الاستماع اللحظي للنبضات الجنائية بالشارع
    const channel = supabase
      .channel("realtime_sos_alerts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "taxi_sos" },
        (payload) => {
          // إطلاق صوت تحذيري في غرفة التحكم فوراً لتنبيه الأدمن
          try {
            const audio = new Audio("https://google.com");
            audio.play();
          } catch (e) {}
          
          setAlerts((prev) => [payload.new, ...prev]);
          setSelectedAlert(payload.new);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "taxi_sos" },
        (payload) => {
          setAlerts((prev) => prev.map(a => a.id === payload.new.id ? payload.new : a));
          if(selectedAlert?.id === payload.new.id) setSelectedAlert(payload.new);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const resolveSOS = async (alertId) => {
    if(!confirm("تأكيد إغلاق بلاغ الطوارئ واحتواء المشكلة ميدانياً؟")) return;
    await supabase.from("taxi_sos").update({ status: "Resolved", close_date: new Date().toISOString() }).eq("id", alertId);
    setAlerts(prev => prev.filter(a => a.id !== alertId));
    setSelectedAlert(null);
    alert("تم إغلاق البلاغ بنجاح وتأمينه ✅");
  };

  if (loading) return <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center text-white/50 mono tracking-widest">جاري تحميل غرفة الطوارئ...</div>;

  return (
    <div dir="rtl" className="min-h-screen bg-[#0F0F0F] text-white p-6 relative">
      <style>{`
        @import url('https://googleapis.com');
        *{font-family:'Andika',sans-serif}
        .mono{font-family:'JetBrains Mono',monospace!important}
        .red-glow-strong { box-shadow: 0 0 60px rgba(239,68,68,0.25), inset 0 1px 0 rgba(239,68,68,0.3); }
        .red-pulse { animation: redFlash 2s infinite; }
        @keyframes redFlash { 0%, 100% { border-color: rgba(239,68,68,0.4); } 50% { border-color: rgba(239,68,68,1); box-shadow: 0 0 20px rgba(239,68,68,0.4); } }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 mb-6">
        <div className="flex items-center gap-4">
          <BackToDashboard />
          <div>
            <h1 className="text-2xl font-black text-red-500 flex items-center gap-2 tracking-tight">🚨 غرفة العمليات والتدخل السريع (SOS Live)</h1>
            <p className="text-xs text-white/40 mt-1 mono">REAL-TIME CRITICAL INCIDENT MONITORING</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-red-500/20 border border-red-500/30 text-red-400 font-black tracking-widest text-xs px-4 py-1.5 red-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping ml-2"/> غرف الحماية نشطة
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* قائمة الإنذارات على اليمين */}
        <div className="col-span-1 bg-[#141414] border border-white/[0.06] rounded-[24px] p-4 max-h-[calc(100vh-160px)] overflow-y-auto space-y-3">
          <h2 className="text-sm font-black text-white/60 tracking-wider mb-2">البلاغات الواردة ({alerts.length})</h2>
          
          {alerts.length === 0 ? (
            <div className="text-center py-12 text-white/20 text-xs">🟢 الوضع مستتب ولا يوجد طوارئ حالياً</div>
          ) : alerts.map((a) => (
            <div 
              key={a.id} 
              onClick={() => setSelectedAlert(a)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${
                selectedAlert?.id === a.id 
                  ? 'bg-red-500/10 border-red-500/60 red-glow-strong' 
                  : 'bg-[#0F0F0F]/60 border-white/[0.04] hover:bg-white/[0.02]'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-sm text-red-400">🚨 {a.order_code || 'رحلة عامة'}</span>
                <span className="text-[11px] text-white/40 mono">{new Date(a.created_at).toLocaleTimeString('ar-LB', {hour:'2-digit', minute:'2-digit'})}</span>
              </div>
              <div className="text-xs font-bold text-white/80 truncate">الركاب: {a.customer_name}</div>
              <div className="text-[11px] text-white/50 truncate mt-1">السائق: {a.driver_name}</div>
              {a.comment && <div className="text-[11px] bg-black/40 border border-white/5 text-amber-300 rounded-lg p-1.5 mt-2 truncate">💬 "{a.comment}"</div>}
            </div>
          ))}
        </div>

        {/* لوحة التفاصيل والماب على اليسار */}
        <div className="col-span-1 lg:col-span-3 space-y-6">
          {selectedAlert ? (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* تفاصيل الكرت والبيانات */}
              <div className="xl:col-span-1 bg-[#141414] border border-white/[0.06] rounded-[24px] p-6 space-y-5">
                <div>
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider block">INCIDENT REPORT ID</span>
                  <div className="text-xs font-mono text-white/60 truncate mt-1">{selectedAlert.id}</div>
                </div>

                <div className="border-t border-white/[0.04] pt-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-red-400"><User className="w-4 h-4"/></div>
                    <div><div className="text-[11px] text-white/40">الزبونة (الركاب)</div><div className="text-sm font-bold text-white">{selectedAlert.customer_name}</div><div className="text-xs text-white/60 font-mono mt-0.5">{selectedAlert.customer_phone}</div></div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-blue-400"><Car className="w-4 h-4"/></div>
                    <div>
                      <div className="text-[11px] text-white/40">السائق والمركبة (المتهم/المبلغ)</div>
                      <div className="text-sm font-bold text-white">{selectedAlert.driver_name}</div>
                      <div className="text-xs text-white/70 font-mono mt-0.5">{selectedAlert.driver_phone}</div>
                      <div className="text-xs text-[#FFD700] font-bold mt-1">🚗 {selectedAlert.car_type} · {selectedAlert.car_color || ''} · {selectedAlert.plate_number}</div>
                    </div>
                  </div>
                </div>

                {selectedAlert.comment && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-xs text-red-300 leading-relaxed">
                    <span className="font-bold block mb-1">💬 تعليق وقالب الطوارئ المرسل:</span>
                    "{selectedAlert.comment}"
                  </div>
                )}

                <div className="border-t border-white/[0.04] pt-4 space-y-2 text-xs text-white/50 leading-relaxed">
                  <div><b>🗺 خط السير المطلوب:</b> {selectedAlert.origin_name} ← {selectedAlert.dest_name}</div>
                  <div><b>💳 قيمة الأجرة:</b> {selectedAlert.total_amount?.toLocaleString() || ''} ل.ل</div>
                </div>

                <div className="border-t border-white/[0.04] pt-4 flex gap-2">
                  <a href={`tel:${selectedAlert.customer_phone}`} className="flex-1 h-11 bg-red-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all">
                    <Phone className="w-4 h-4" /> اتصال بالزبونة
                  </a>
                  <button onClick={() => resolveSOS(selectedAlert.id)} className="flex-1 h-11 bg-white text-black rounded-xl text-xs font-black flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                    <CheckCircle className="w-4 h-4" /> احتواء وإغلاق
                  </button>
                </div>
              </div>

              {/* التتبع الجغرافي الحي للمقذوف */}
              <div className="xl:col-span-2 bg-[#141414] border border-white/[0.06] rounded-[24px] overflow-hidden flex flex-col h-[520px]">
