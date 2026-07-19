"use client";

export default function TermsApproval() {

  async function handleApprove() {
    const agree = document.getElementById("agree");

    if (!agree.checked) {
      alert("يجب الموافقة أولاً");
      return;
    }

    // إرسال الموافقة إلى API
    await fetch("/api/update-terms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ AcceptedTerms: true })
    });

    // دخول للتصفح
    window.location.href = "/dashboard";
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md">

        <h2 className="text-xl font-semibold mb-6 text-center">
          الموافقة على الشروط والأحكام
        </h2>

        <div className="flex flex-col space-y-2 mb-6 text-sm text-blue-600">
          <a href="/terms" className="underline">
            قراءة الشروط والأحكام
          </a>

          <a href="/privacy" className="underline">
            قراءة سياسة الخصوصية
          </a>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <input type="checkbox" id="agree" className="w-4 h-4" />
          <label htmlFor="agree" className="text-sm">
            أوافق على الشروط والأحكام
          </label>
        </div>

        <button
          onClick={handleApprove}
          className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 transition"
        >
          موافقة
        </button>

      </div>
    </div>
  );
}
