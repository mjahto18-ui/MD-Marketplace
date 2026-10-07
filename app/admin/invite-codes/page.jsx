"use client";
import { useState, useEffect } from "react";

export default function InviteCodesGenerator() {
  const [count, setCount] = useState(1);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [codes, setCodes] = useState([]);
  const [allCodes, setAllCodes] = useState([]);

  const fetchAll = async () => {
    try {
      const res = await fetch("/api/admin/generate-invite-code");
      const data = await res.json();
      if (data.codes) setAllCodes(data.codes);
    } catch (e) {
      console.error("خطأ في جلب البيانات", e);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const generate = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/generate-invite-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count: Number(count), note })
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      setCodes(data.codes || []);
      fetchAll();
    } else {
      alert(data.error);
    }
  };

  const copy = (c) => navigator.clipboard.writeText(c);

  // 💡 دالة سحرية لتنظيف حقل الـ Export والتاريخ القادم من السيرفر ليعمل على كل الشاشات
  const formatSecureDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      let fixedStr = String(dateStr).trim();
      // تحويل المسافة إلى حرف T المتوافق مع معايير جافا سكريبت العالمية
      if (fixedStr.includes(" ") && !fixedStr.includes("T")) {
        fixedStr = fixedStr.replace(" ", "T");
      }
      
      const parsedDate = new Date(fixedStr);
      if (isNaN(parsedDate.getTime())) return "-";
      
      return parsedDate.toLocaleDateString("ar-LB", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch (err) {
      return "-";
    }
  };

  return (
    <div className="p-4 bg-white rounded-2xl shadow space-y-4" dir="rtl">
      <h2 className="text-xl font-bold text-black">ولد أكواد دعوة</h2>
      <div className="flex gap-2">
        <input
          type="number"
          min={1}
          max={20}
          value={count}
          onChange={e => setCount(e.target.value)}
          className="border p-2 rounded w-24 text-black outline-none border-gray-300"
          placeholder="العدد"
        />
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          className="border p-2 rounded flex-1 text-black outline-none border-gray-300"
          placeholder="ملاحظة (اختياري) - لمين هالكود"
        />
        <button
          onClick={generate}
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded font-bold active:scale-95 transition"
        >
          {loading ? "عم يولد..." : `ولد ${count} كود`}
        </button>
      </div>

      {codes.length > 0 && (
        <div className="bg-green-50 p-3 rounded">
          <p className="font-bold mb-2 text-green-900">أكواد جديدة (انسخها وابعتها واتساب):</p>
          <div className="grid grid-cols-2 gap-2">
            {codes.map(c => (
              <div key={c.id} className="flex justify-between bg-white p-2 rounded border items-center">
                <span className="font-mono font-bold text-lg text-black">{c.code}</span>
                <button onClick={() => copy(c.code)} className="text-sm bg-gray-100 px-2 rounded font-semibold">نسخ</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="font-bold mb-2 text-gray-800">آخر 50 كود:</p>
        <div className="max-h-64 overflow-auto border rounded-xl">
          <table className="w-full text-sm text-right">
            <thead className="bg-gray-50 sticky top-0 text-gray-600 border-b">
              <tr>
                <th className="p-3">الكود</th>
                <th className="p-3">استعمل؟</th>
                <th className="p-3">استعملو</th>
                <th className="p-3">دور</th>
                <th className="p-3">انتهاء</th>
                <th className="p-3">ملاحظة</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {allCodes.map(c => (
                <tr key={c.id} className={`border-b ${c.is_used ? 'bg-red-50' : 'bg-white hover:bg-gray-50'}`}>
                  <td className="p-3 font-mono font-bold text-black">{c.code}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.is_used ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {c.is_used ? '✅ محروق' : '⏳ فعال'}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs">{c.used_by || '-'}</td>
                  <td className="p-3 text-xs">{c.used_role || c.role || '-'}</td>
                  
                  {/* 🔥 تم التعديل هنا: فحص حقل الـ Export الصغير والكبير معاً لضمان القراءة */}
                  <td className="p-3 text-xs font-mono font-medium text-gray-600">
                    {formatSecureDate(c.expires_at || c.ExpiresAt || c.expiresAt)}
                  </td>
                  
                  <td className="p-3 text-xs">{c.note || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
