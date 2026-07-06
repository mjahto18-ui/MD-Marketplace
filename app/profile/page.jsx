"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/me', {
      credentials: 'include',
    })
  .then(async (res) => {
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
      } else {
        router.push('/login');
      }
      setLoading(false);
    })
  .catch((err) => {
      console.log('Profile fetch error:', err);
      setError('فشل تحميل البيانات');
      setLoading(false);
    });
  }, [router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-xl">جاري تحميل الملف...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-xl text-red-500">{error}</div>
    </div>
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">ملفي الشخصي</h1>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            رجوع للداشبورد
          </Link>
        </div>

        <div className="space-y-4">
          <div className="border-b pb-2">
            <span className="text-gray-500">الاسم: </span>
            <span className="font-semibold">{user?.name || 'غير محدد'}</span>
          </div>

          <div className="border-b pb-2">
            <span className="text-gray-500">رقم الموبايل: </span>
            <span className="font-semibold">{user?.phone || 'غير محدد'}</span>
          </div>

          <div className="border-b pb-2">
            <span className="text-gray-500">الايميل: </span>
            <span className="font-semibold">{user?.email || 'غير محدد'}</span>
          </div>

          <div className="border-b pb-2">
            <span className="text-gray-500">نوع الحساب: </span>
            <span className="font-semibold">{user?.role || 'غير محدد'}</span>
          </div>

          <div className="border-b pb-2">
            <span className="text-gray-500">المنطقة: </span>
            <span className="font-semibold">{user?.area || 'غير محدد'}</span>
          </div>

          <div className="border-b pb-2">
            <span className="text-gray-500">العنوان: </span>
            <span className="font-semibold">{user?.address || 'غير محدد'}</span>
          </div>

          <div className="border-b pb-2">
            <span className="text-gray-500">توصيل مجاني متبقي: </span>
            <span className="font-semibold text-green-600">{user?.freeDeliveries?? 0}</span>
          </div>

          {user?.lat && user?.lng && (
            <div className="border-b pb-2">
              <span className="text-gray-500">الموقع: </span>
              <span className="font-semibold">{user.lat}, {user.lng}</span>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
            router.push('/login');
          }}
          className="mt-6 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          تسجيل خروج
        </button>
      </div>
    </div>
  );
}
