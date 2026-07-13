"use client";

import Script from "next/script";

export default function OneSignalInit() {
  return (
    <>
      <Script
        src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
        strategy="afterInteractive"
      />

      <Script id="onesignal-init" strategy="afterInteractive">
        {`
          window.OneSignalDeferred = window.OneSignalDeferred || [];

          OneSignalDeferred.push(async function (OneSignal) {

            await OneSignal.init({
              appId: "8736bcd3-452e-4b06-a3c1-0363071f1254",
              allowLocalhostAsSecureOrigin: true,
            });

            console.log("✅ OneSignal جاهز بالكامل");

            // طلب إذن الإشعارات إذا لم يكن قد تم من قبل
            if (OneSignal.Notifications.permission !== true) {
              const permission = await OneSignal.Notifications.requestPermission();
              console.log("Permission:", permission);
            }

            // انتظر قليلاً حتى يتم إنشاء الاشتراك
            await new Promise(resolve => setTimeout(resolve, 1000));

            const subscriptionId = OneSignal.User.PushSubscription.id;
            const optedIn = OneSignal.User.PushSubscription.optedIn;
            const token = OneSignal.User.PushSubscription.token;
            const externalId = OneSignal.User.externalId;

            console.log("Subscription ID:", subscriptionId);
            console.log("Opted In:", optedIn);
            console.log("Token:", token);
            console.log("External ID:", externalId);
          });
        `}
      </Script>
    </>
  );
}
