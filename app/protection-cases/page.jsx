"use client";

async function handleSubmit(e) {
  e.preventDefault();

  const formData = new FormData(e.target);

  // استخراج القيم
  const caseType = formData.get("caseType");
  const description = formData.get("description");
  const orderId = formData.get("orderId");
  const whatsapp = formData.get("whatsapp");

  // الصور
  const photo1 = formData.get("photo1");
  const photo2 = formData.get("photo2");
  const photo3 = formData.get("photo3");

  // رفع الصور إلى Base64
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

  // تجهيز البيانات للإرسال
  const payload = {
    caseType,
    description,
    orderId,
    whatsapp,
    photo1: photo1Base,
    photo2: photo2Base,
    photo3: photo3Base,

    // .هول رح ينعطوا من التطبيق لاحقاً
    customerId: "CUSTOMER-ID-HERE",
    storeId: "",
    driverId: "",
  };

  // إرسال للـ API
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
