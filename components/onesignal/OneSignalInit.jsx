"use client";
import { useEffect } from "react";

export default function OneSignalInit() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.OneSignal = window.OneSignal || [];
      OneSignal.push(function () {
        OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
          safari_web_id: process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_ID,
          allowLocalhostAsSecureOrigin: true,
        });

        // طلب الإذن
        OneSignal.showSlidedownPrompt();

        // جلب PushSubscription.id
        OneSignal.User.PushSubscription.addEventListener("change", async () => {
          const id = OneSignal.User.PushSubscription.id;
          console.log("PushSubscription ID:", id);
        });
      });
    }
  }, []);

  return null;
}
