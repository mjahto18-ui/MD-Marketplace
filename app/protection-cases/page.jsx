"use client";

import { useState, useEffect } from "react";

export default function ProtectionCasesPage() {

  async function handleSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);

    const caseType = formData.get("caseType");
    const description = formData.get("description");
    const orderId = formData.get("orderId");
    const whatsapp = formData.get("whatsapp");

    const photo1 = formData.get("photo1");
    const photo2 = formData.get("photo2");
    const photo3 = formData.get("photo3");

    async function toBase64(file) {
      if (!file || file.size === 0) return "";
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    }

    const photo1Base = await toBase64(photo1);
    const photo2Base = await toBase64(photo2);
    const photo3Base = await toBase64(photo3);

    const payload = {
      caseType,
      description,
      orderId,
      whatsapp,
      photo1: photo1Base,
      photo2: photo2Base,
      photo3: photo3Base,

      customerId: "CUSTOMER-ID-HERE",
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
  }

  return (
    <div className="p-4">

      {/* الهيدر */}
      <div className="flex items-center gap-3 mb-6">
        <img 
          src="/icons/protection.png" 
          alt="Protection Icon" 
          className="w-8 h-8"
        />
        <h1 className="text-xl font-bold text-gray-800">
          خدمة حماية المستخدم
        </h1>
      </div>

      {/* النموذج */}
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* نوع البلاغ */}
        <div>
          <label className="block mb-2 font-medium text-gray-700">
            نوع البلاغ
          </label>
          <select name="caseType" required className="w-full border rounded-md p-2">
            <option value="">اختر نوع البلاغ</option>
            <option value="طلب لم يصل">طلب لم يصل</option>
            <option value="خطأ في الشحن">خطأ في الشحن</option>
            <option value="منتج تالف">منتج تالف</option>
            <option value="منتج مفقود ضمن الطلب">منتج مفقود ضمن الطلب</option>
            <option value="تأخير في التوصيل">تأخير في التوصيل</option>
            <option value="أخرى">أخرى</option>
          </select>
        </div>

        {/* الوصف */}
        <div>
          <label className="block mb-2 font-medium text-gray-700">
            وصف المشكلة
          </label>
          <textarea
            name="description"
            required
            rows="4"
            className="w-full border rounded-md p-2"
            placeholder="اكتب تفاصيل المشكلة هنا..."
          ></textarea>
        </div>

        {/* رقم الطلب */}
        <div>
          <label className="block mb-2 font-medium text-gray-700">
            رقم الطلب (اختياري)
          </label>
          <select name="orderId" className="w-full border rounded-md p-2">
            <option value="">— بدون رقم طلب —</option>
          </select>
        </div>

        {/* رقم الواتساب */}
        <div>
          <label className="block mb-2 font-medium text-gray-700">
            رقم الواتساب للتواصل
          </label>
          <input
            type="tel"
            name="whatsapp"
            required
            pattern="[0-9]{8}"
            maxLength="8"
            minLength="8"
            className="w-full border rounded-md p-2"
            placeholder="مثال: 03xxxxxx"
          />
        </div>

        {/* الصور */}
        <div>
          <label className="block mb-2 font-medium text-gray-700">صورة 1</label>
          <input type="file" name="photo1" accept="image/*" capture="environment" className="w-full" />
        </div>

        <div>
          <label className="block mb-2 font-medium text-gray-700">صورة 2 (اختياري)</label>
          <input type="file" name="photo2" accept="image/*" capture="environment" className="w-full" />
        </div>

        <div>
          <label className="block mb-2 font-medium text-gray-700">صورة 3 (اختياري)</label>
          <input type="file" name="photo3" accept="image/*" capture="environment" className="w-full" />
        </div>

        {/* الأزرار */}
        <div className="flex items-center justify-between mt-8">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 font-medium hover:bg-gray-300"
          >
            إلغاء
          </button>

          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700"
          >
            إرسال البلاغ
          </button>
        </div>

      </form>
    </div>
  );
}
