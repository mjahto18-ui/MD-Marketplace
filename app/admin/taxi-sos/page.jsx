"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Phone,
  Car,
  User,
  CheckCircle,
  MapPin,
  Timer,
  Volume2,
  VolumeX,
  Share2,
  Navigation
} from "lucide-react";
import BackToDashboard from "@/components/BackToDashboard";
import dynamicImport from "next/dynamic";

const Map = dynamicImport(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="p-4 text-center text-white/40 text-xs">
      جاري تحميل خريطة الطوارئ...
    </div>
  )
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function SOSDashboardPage() {
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  const audioRef = useRef(null);
  const [alarmActive, setAlarmActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const fetchActiveSOS = async () => {
    setLoading(true);
    const { data, error } = await supabase
     .from("taxi_sos")
     .select("*")
     .eq("status", "open")
     .order("created_at", { ascending: false })
     .limit(50);

    if (!error && data) {
      setAlerts(data);
      if (data.length > 0 &&!selectedAlert) {
        setSelectedAlert(data[0]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    audioRef.current = new Audio("/sounds/sos.mp3");
    audioRef.current.loop = true;
    audioRef.current.volume = 1;

    const unlock = () => {
      if (audioRef.current &&!audioUnlocked) {
        audioRef.current
         .play()
         .then(() => {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setAudioUnlocked(true);
          })
         .catch(() => {});
      }
      document.removeEventListener("click", unlock);
    };
    document.addEventListener("click", unlock);

    fetchActiveSOS();

    const channel = supabase
     .channel("realtime_sos_alerts")
     .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "taxi_sos" },
        (payload) => {
          if (payload.new.status!== "open") return;
          if (!isMuted && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
            setAlarmActive(true);
          }
          if (navigator.vibrate) {
            navigator.vibrate([500, 200, 500, 200, 1000]);
          }
          setAlerts((prev) => [payload.new,...prev]);
          setSelectedAlert(payload.new);
        }
      )
     .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "taxi_sos" },
        (payload) => {
          // اذا تسكر - شيله من القائمة فوراً
          if (payload.new.status === "closed") {
            setAlerts((prev) => prev.filter((a) => a.id!== payload.new.id));
            setSelectedAlert((curr) => (curr?.id === payload.new.id? null : curr));
            return;
          }
          setAlerts((prev) =>
            prev.map((a) => (a.id === payload.new.id? payload.new : a))
          );
          setSelectedAlert((curr) =>
            curr?.id === payload.new.id? payload.new : curr
          );
        }
      )
     .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (audioRef.current) audioRef.current.pause();
    };
  }, [isMuted, audioUnlocked]);

  const stopAlarm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setAlarmActive(false);
  };

  const resolveSOS = async (alertId) => {
    if (!confirm("تأكيد إغلاق بلاغ الطوارئ واحتواء المشكلة ميدانياً؟")) return;
    stopAlarm();
    const { error } = await supabase
     .from("taxi_sos")
     .update({
        status: "closed",
        close_date: new Date().toISOString(),
      })
     .eq("id", alertId);

    if (error) {
      alert("خطأ: " + error.message);
      return;
    }
    setAlerts((prev) => prev.filter((a) => a.id!== alertId));
    setSelectedAlert(null);
  };

  // نفس مبدأ مشاركة الرحلة - order_code/id
  const shareViaWhatsApp = () => {
    if (!selectedAlert) return;
    const publicLink = `${window.location.origin}/sos/${selectedAlert.order_code}/${selectedAlert.id}`;

    const cLat = selectedAlert.customer_lat || selectedAlert.lat;
    const cLng = selectedAlert.customer_lng || selectedAlert.lng;
    const dLat = selectedAlert.taxi_lat_live || selectedAlert.driver_lat;
    const dLng = selectedAlert.taxi_lng_live || selectedAlert.driver_lng;

    const text = `🚨 بلاغ طوارئ SOS - ${selectedAlert.order_code}%0A` +
      `👤 الزبون: ${selectedAlert.customer_name} - ${selectedAlert.customer_phone}%0A` +
      `🚗 السائق: ${selectedAlert.driver_name} - ${selectedAlert.driver_phone} - ${selectedAlert.plate_number || ""}%0A` +
      `💬 التعليق: ${selectedAlert.comment || "لا يوجد"}%0A%0A` +
      `🔗 رابط التتبع الحي الآمن:%0A${publicLink}%0A%0A` +
      `📍 موقع الزبون: https://www.google.com/maps?q=${cLat},${cLng}%0A` +
      `📍 موقع السائق: https://www.google.com/maps?q=${dLat},${dLng}%0A%0A` +
      `⏰ ${new Date().toLocaleString("ar-LB")}%0A` +
      `⚠️ الرابط يختفي تلقائياً عند إغلاق البلاغ`;

    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center text-white/50 tracking-widest">
        جاري تحميل غرفة الطوارئ...
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#0F0F0F] text-white p-6 relative">
      <style>{`
        *{font-family:'Andika',sans-serif}
     .mono{font-family:'JetBrains Mono',monospace!important}
     .red-glow-strong { box-shadow: 0 0 60px rgba(239,68,68,0.25), inset 0 1px 0 rgba(239,68,68,0.3); }
     .red-pulse { animation: redFlash 2s infinite; }
        @keyframes redFlash {
          0%, 100% { border-color: rgba(239,68,68,0.4); }
          50% { border-color: rgba(239,68,68,1); box-shadow: 0 0 20px rgba(239,68,68,0.4); }
        }
     .alarm-bar { animation: alarmBg 0.8s infinite; }
        @keyframes alarmBg {
          0%,100% { background: rgba(239,68,68,0.9); }
          50% { background: rgba(0,0,0,0.9); }
        }
      `}</style>

      {alarmActive && (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-14 alarm-bar flex items-center justify-between px-6 text-white font-black">
          <div className="flex items-center gap-3">🚨 بلاغ طوارئ جديد وصل! 🚨</div>
          <button onClick={stopAlarm} className="bg-white text-black px-6 py-1.5 rounded-full text-xs">
            إيقاف الصوت
          </button>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 mb-6 mt-2">
        <div className="flex items-center gap-4">
          <BackToDashboard />
          <div>
            <h1 className="text-2xl font-black text-red-500 flex items-center gap-2 tracking-tight">
              🚨 غرفة العمليات والتدخل السريع (SOS Live)
            </h1>
            <p className="text-xs text-white/40 mt-1 mono">REAL-TIME CRITICAL INCIDENT MONITORING</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
              isMuted? "bg-white/10 border-white/10 text-white/40" : "bg-red-500/20 border-red-500/30 text-red-400"
            }`}
          >
            {isMuted? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <span className="inline-flex items-center rounded-full bg-red-500/20 border border-red-500/30 text-red-400 font-black tracking-widest text-xs px-4 py-1.5 red-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping ml-2" /> غرف الحماية نشطة
          </span>
          {!audioUnlocked && (
            <button
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.play().then(() => {
                    audioRef.current.pause();
                    setAudioUnlocked(true);
                  }).catch(() => {});
                }
              }}
              className="text- bg-amber-500/20 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-full"
            >
              🔊 فعل الصوت
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="col-span-1 bg-[#141414] border border-white/[0.06] rounded- p-4 max-h-[calc(100vh-160px)] overflow-y-auto space-y-3">
          <h2 className="text-sm font-black text-white/60 tracking-wider mb-2">
            البلاغات الواردة ({alerts.length})
          </h2>
          {alerts.length === 0? (
            <div className="text-center py-12 text-white/20 text-xs">🟢 الوضع مستتب ولا يوجد طوارئ حالياً</div>
          ) : (
            alerts.map((a) => (
              <div
                key={a.id}
                onClick={() => {
                  setSelectedAlert(a);
                  stopAlarm();
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${
                  selectedAlert?.id === a.id
                   ? "bg-red-500/10 border-red-500/60 red-glow-strong"
                    : "bg-[#0F0F0F]/60 border-white/[0.04] hover:bg-white/[0.02]"
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-sm text-red-400">🚨 {a.order_code || "رحلة عامة"}</span>
                  <span className="text- text-white/40 mono">
                    {a.created_at? new Date(a.created_at).toLocaleTimeString("ar-LB", { hour: "2-digit", minute: "2-digit" }) : ""}
                  </span>
                </div>
                <div className="text-xs font-bold text-white/80 truncate">الركاب: {a.customer_name}</div>
                <div className="text- text-white/50 truncate mt-1">السائق: {a.driver_name}</div>
                {a.comment && (
                  <div className="text- bg-black/40 border border-white/5 text-amber-300 rounded-lg p-1.5 mt-2 truncate">
                    💬 "{a.comment}"
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="col-span-1 lg:col-span-3 space-y-6">
          {selectedAlert? (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-1 bg-[#141414] border border-white/[0.06] rounded- p-6 space-y-5">
                <div>
                  <span className="text- text-white/40 font-bold uppercase tracking-wider block">INCIDENT REPORT ID</span>
                  <div className="text-xs font-mono text-white/60 truncate mt-1">{selectedAlert.id}</div>
                </div>
                <div className="border-t border-white/[0.04] pt-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-red-400">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text- text-white/40">الزبونة (الركاب)</div>
                      <div className="text-sm font-bold text-white">{selectedAlert.customer_name}</div>
                      <div className="text-xs text-white/60 font-mono mt-0.5">{selectedAlert.customer_phone}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-blue-400">
                      <Car className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text- text-white/40">السائق والمركبة</div>
                      <div className="text-sm font-bold text-white">{selectedAlert.driver_name}</div>
                      <div className="text-xs text-white/70 font-mono mt-0.5">{selectedAlert.driver_phone}</div>
                      <div className="text-xs text-[#FFD700] font-bold mt-1">
                        🚗 {selectedAlert.car_type} {selectedAlert.car_color? `· ${selectedAlert.car_color}` : ""} · {selectedAlert.plate_number}
                      </div>
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
                  <div><b>💳 قيمة الأجرة:</b> {selectedAlert.total_amount? Number(selectedAlert.total_amount).toLocaleString() : ""} ل.ل</div>
                </div>
                <div className="border-t border-white/[0.04] pt-4 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <a href={`tel:${selectedAlert.customer_phone}`} className="flex-1 h-11 bg-red-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all">
                      <Phone className="w-4 h-4" /> اتصال بالزبونة
                    </a>
                    <button onClick={shareViaWhatsApp} className="flex-1 h-11 bg-[#25D366] text-black rounded-xl text-xs font-black flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                      <Share2 className="w-4 h-4" /> واتساب أمني
                    </button>
                  </div>
                  <button onClick={() => resolveSOS(selectedAlert.id)} className="w-full h-11 bg-white text-black rounded-xl text-xs font-black flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                    <CheckCircle className="w-4 h-4" /> احتواء وإغلاق البلاغ
                  </button>
                </div>
              </div>

              <div className="xl:col-span-2 bg-[#141414] border border-white/[0.06] rounded- overflow-hidden flex flex-col h-">
                <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-white/70">
                    <MapPin className="w-4 h-4 text-red-400" /> التتبع الجغرافي الحي للطوارئ
                  </div>
                  <div className="flex items-center gap-2 text- text-white/30 mono">
                    <Timer className="w-3 h-3" /> LIVE TRACKING
                  </div>
                </div>

                <div className="flex-1 relative bg-[#0a0a0a]">
                  {(() => {
                    const cLat = selectedAlert.customer_lat || selectedAlert.origin_lat || selectedAlert.lat;
                    const cLng = selectedAlert.customer_lng || selectedAlert.origin_lng || selectedAlert.lng;
                    const dLat = selectedAlert.taxi_lat_live || selectedAlert.driver_lat;
                    const dLng = selectedAlert.taxi_lng_live || selectedAlert.driver_lng;
                    return cLat && cLng? (
                      <Map lat={cLat} lng={cLng} customerLat={cLat} customerLng={cLng} driverLat={dLat} driverLng={dLng} />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-white/20 text-xs">لا يوجد إحداثيات لهذا البلاغ</div>
                    );
                  })()}
                </div>

                {(() => {
                  const cLat = selectedAlert.customer_lat || selectedAlert.origin_lat || selectedAlert.lat;
                  const cLng = selectedAlert.customer_lng || selectedAlert.origin_lng || selectedAlert.lng;
                  const dLat = selectedAlert.taxi_lat_live || selectedAlert.driver_lat;
                  const dLng = selectedAlert.taxi_lng_live || selectedAlert.driver_lng;
                  const oLat = selectedAlert.origin_lat;
                  const oLng = selectedAlert.origin_lng;
                  const destLat = selectedAlert.dest_lat;
                  const destLng = selectedAlert.dest_lng;
                  const mkDir = (la, ln) => (la && ln? `https://www.google.com/maps/dir/?api=1&destination=${la},${ln}` : null);

                  return (
                    <div className="p-3 bg-black/50 border-t border-white/[0.06] grid grid-cols-2 gap-2">
                      <a href={mkDir(dLat, dLng) || "#"} target="_blank" className={`h-11 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${dLat? "bg-white text-black hover:bg-white/90" : "bg-white/5 text-white/20 pointer-events-none"}`}>
                        <Navigation className="w-3.5 h-3.5" /> اذهب للسائق (حي)
                      </a>
                      <a href={mkDir(cLat, cLng) || "#"} target="_blank" className={`h-11 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${cLat? "bg-red-600 text-white hover:bg-red-700" : "bg-white/5 text-white/20 pointer-events-none"}`}>
                        <Navigation className="w-3.5 h-3.5" /> اذهب للزبون (حي)
                      </a>
                      <a href={mkDir(oLat, oLng) || "#"} target="_blank" className={`h-9 rounded-xl text- font-bold flex items-center justify-center gap-1 border transition-all ${oLat? "bg-white/[0.06] border-white/[0.06] text-white/60 hover:text-white" : "bg-white/5 text-white/20 pointer-events-none"}`}>
                        📍 الانطلاق (ثابت)
                      </a>
                      <a href={mkDir(destLat, destLng) || "#"} target="_blank" className={`h-9 rounded-xl text- font-bold flex items-center justify-center gap-1 border transition-all ${destLat? "bg-white/[0.06] border-white/[0.06] text-white/60 hover:text-white" : "bg-white/5 text-white/20 pointer-events-none"}`}>
                        🎯 الوصول (ثابت)
                      </a>
                    </div>
                  );
                })()}

                <div className="p-3 bg-black/30 border-t border-white/[0.06] flex justify-between text- text-white/40 mono">
                  <span>LAT: {selectedAlert.lat || selectedAlert.origin_lat || selectedAlert.customer_lat || "--"}</span>
                  <span>LNG: {selectedAlert.lng || selectedAlert.origin_lng || selectedAlert.customer_lng || "--"}</span>
                  <span className="text-red-400">● بث مباشر</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#141414] border border-dashed border-white/[0.08] rounded- h- flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center">🚨</div>
              <div className="text-sm text-white/30">اختر بلاغ من القائمة لعرض التفاصيل والتتبع</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
