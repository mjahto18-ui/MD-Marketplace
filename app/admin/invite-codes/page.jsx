"use client";
import { useState, useEffect } from "react";

export default function InviteCodesGenerator() {
  const [count, setCount] = useState(1);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [codes, setCodes] = useState([]);
  const [allCodes, setAllCodes] = useState([]);

  const fetchAll = async () => {
    const res = await fetch("/api/admin/generate-invite-code");
    const data = await res.json();
    if (data.codes) setAllCodes(data.codes);
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
      setCodes(data.codes);
      fetchAll();
    } else {
      alert(data.error);
    }
  };

  const copy = (c) => navigator.clipboard.writeText(c);

  return (
    <div className="p-4 bg-white rounded-2xl shadow space-y-4" dir="rtl">
      <h2 className="text-xl font-bold">ولد أكواد دعوة</h2>
      <div className="flex gap-2">
        <input
          type="number"
          min={1}
          max={20}
          value={count}
          onChange={e => setCount(e.target.value)}
          className="border p-2 rounded w-24"
          placeholder="العدد"
        />
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          className="border p-2 rounded flex-1"
          placeholder="ملاحظة (اختياري) - لمين هالكود"
        />
        <button
          onClick={generate}
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded"
        >
          {loading ? "عم يولد..." : `ولد ${count} كود`}
        </button>
      </div>

      {codes.length > 0 && (
        <div className="bg-green-50 p-3 rounded">
          <p className="font-bold mb-2">أكواد جديدة (انسخها وابعتها واتساب):</p>
          <div className="grid grid-cols-2 gap-2">
            {codes.map(c => (
              <div key={c.id} className="flex justify-between bg-white p-2 rounded border">
                <span className="font-mono font-bold text-lg">{c.code}</span>
                <button onClick={() => copy(c.code)} className="text-sm bg-gray-100 px-2 rounded">نسخ</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="font-bold mb-2">آخر 50 كود:</p>
        <div className="max-h-64 overflow-auto border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="p-2">الكود</th>
                <th className="p-2">استعمل؟</th>
                <th className="p-2">استعملو</th>
                <th className="p-2">دور</th>
                <th className="p-2">انتهاء</th>
                <th className="p-2">ملاحظة</th>
              </tr>
            </thead>
            <tbody>
              {allCodes.map(c => (
                <tr key={c.id} className={`border-t ${c.is_used ? 'bg-red-50' : 'bg-white'}`}>
                  <td className="p-2 font-mono">{c.code}</td>
                  <td className="p-2">{c.is_used ? '✅ محروق' : '⏳ فعال'}</td>
                  <td className="p-2">{c.used_by || '-'}</td>
                  <td className="p-2">{c.used_role || c.role || '-'}</td>
                  <td className="p-2 text-xs">{new Date(c.expires_at).toLocaleString()}</td>
                  <td className="p-2">{c.note || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
