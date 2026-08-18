"use client";

import { useState } from "react";

export default function ProtectionCasesPage() {
  const [uploading, setUploading] = useState(false);

  async function uploadFile(file) {
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/upload-image", { method: "POST", body: fd });
    const d = await r.json();
    return d.url || "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setUploading(true);
    try {
      const formData = new FormData(e.target);
      
      const f1 = formData.get("photo1");
      const f2 = formData.get("photo2");
      const f3 = formData.get("photo3");

      let p1 = "", p2 = "", p3 = "";
      if (f1 && f1.size > 0) p1 = await uploadFile(f1);
      if (f2 && f2.size > 0) p2 = await uploadFile(f2);
      if (f3 && f3.size > 0) p3 = await uploadFile(f3);

      const payload = {
        caseType: formData.get("caseType"),
        description: formData.get("description"),
        orderId: formData.get("orderId"),
        whatsapp: formData.get("whatsapp"),
        photo1: p1,
        photo2: p2,
        photo3: p3,
        storeId: "",
        driverId: "",
      };

      const res = await fetch("/api/protection-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        alert("تم إرسال البلاغ بنجاح. رقم البلاغ: " + data.caseID);
        e.target.reset();
      } else {
        alert("حدث خطأ أثناء إرسال البلاغ");
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-r from-[#6A11CB]/20 to-[#FF4E9A]/20 border border-[#FF4E9A]/30">
      <div className="max-w-xl mx-auto bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">

        <div className="flex items-center gap-3 mb-6">
          <img src="/icons/protection-shield.png" alt="Protection Icon" className="w-10 h-10" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#6A11CB] to-[#FF4E9A] bg-clip-text text-transparent">
            خدمة حماية المستخدم
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-white">

          <div>
            <label className="block mb-2 font-medium">نوع البلاغ</label>
            <select name="caseType" required className="w-full border rounded-md p-2 bg-white text-black">
              <option value="">اختر نوع البلاغ</option>
              <option value="طلب لم يصل">طلب لم يصل</option>
              <option value="خطأ في المنتج">خطأ في الشحن</option>
              <option value="منتج تالف">منتج تالف</option>
              <option value="منتج مفقود ضمن الطلب">منتج مفقود ضمن الطلب</option>
              <option value="تأخير في التوصيل">تأخير في التوصيل</option>
              <option value="أخرى">أخرى</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 font-medium">وصف المشكلة</label>
            <textarea name="description" required rows="4" className="w-full border rounded-md p-2 bg-white text-black" placeholder="اكتب تفاصيل المشكلة هنا..."></textarea>
          </div>

          <div>
            <label className="block mb-2 font-medium">رقم الطلب (اختياري)</label>
            <select name="orderId" className="w-full border rounded-md p-2 bg-white text-black">
              <option value="">— بدون رقم طلب —</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 font-medium">رقم الواتساب للتواصل</label>
            <input type="tel" name="whatsapp" required pattern="[0-9]{8}" maxLength="8" minLength="8" className="w-full border rounded-md p-2 bg-white text-black" placeholder="مثال: 03xxxxxx" />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block mb-2 font-medium">صورة 1 (مطلوبة)</label>
              <input type="file" name="photo1" accept="image/*" required className="w-full bg-white text-black p-2 rounded-md" />
            </div>
            <div>
              <label className="block mb-2 font-medium">صورة 2 (اختياري)</label>
              <input type="file" name="photo2" accept="image/*" className="w-full bg-white text-black p-2 rounded-md" />
            </div>
            <div>
              <label className="block mb-2 font-medium">صورة 3 (اختياري)</label>
              <input type="file" name="photo3" accept="image/*" className="w-full bg-white text-black p-2 rounded-md" />
            </div>
          </div>

          <div className="flex items-center justify-between mt-8">
            <button type="button" onClick={() => window.history.back()} className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 font-medium hover:bg-gray-300">
              إلغاء
            </button>
            <button type="submit" disabled={uploading} className="px-4 py-2 rounded-md bg-gradient-to-r from-[#6A11CB] to-[#FF4E9A] text-white font-medium disabled:opacity-50">
              {uploading ? "جاري رفع الصور..." : "إرسال البلاغ"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
