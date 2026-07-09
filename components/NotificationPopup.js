"use client";
import { useState, useEffect } from "react";

export default function NotificationPopup({ userId }) {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    async function checkSubscription() {
      const res = await fetch(`/api/check-subscription?userId=${userId}`);
      const data = await res.json();

      if (!data.hasSubscription) {
        setShowPopup(true);
      }
    }

    checkSubscription();
  }, [userId]);

  async function enableNotifications() {
    setShowPopup(false);

    alert("نستخدم الإشعارات لتحسين تجربتك داخل التطبيق، ولإعلامك بحالة طلباتك، التوصيل، والعروض الجديدة.");

    const permission = await OneSignal.Notifications.requestPermission();

    if (permission === "granted") {
      const subId = await OneSignal.User.getSubscriptionId();

      await fetch("/api/save-subscription", {
        method: "POST",
        body: JSON.stringify({
          userId,
          subscriptionId: subId
        })
      });
    }
  }

  if (!showPopup) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-80 text-center">
        <h2 className="text-lg font-bold mb-2">🔔 تفعيل الإشعارات</h2>
        <p className="text-sm text-gray-600 mb-4">
          نستخدم الإشعارات لتحسين تجربتك داخل التطبيق،
          ولإعلامك بحالة طلباتك، التوصيل، والعروض الجديدة.
        </p>

        <button
          onClick={enableNotifications}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg w-full hover:bg-blue-700 transition"
        >
          تفعيل الإشعارات
        </button>
      </div>
    </div>
  );
}
