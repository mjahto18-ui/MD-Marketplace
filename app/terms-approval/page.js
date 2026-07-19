export default function TermsApproval() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md">

        <h2 className="text-xl font-semibold mb-4 text-center">
          الموافقة على الشروط والأحكام
        </h2>

        <div className="space-y-2 mb-4 text-sm">
          <a href="/terms" className="text-blue-600 underline">
            قراءة الشروط والأحكام
          </a>
          <a href="/privacy" className="text-blue-600 underline">
            قراءة سياسة الخصوصية
          </a>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <input type="checkbox" id="agree" className="w-4 h-4" />
          <label htmlFor="agree" className="text-sm">
            أوافق على الشروط والأحكام
          </label>
        </div>

        <button
          className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 transition"
        >
          موافقة
        </button>

      </div>
    </div>
  );
}
