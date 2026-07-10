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
          OneSignalDeferred.push(async function(OneSignal) {
            await OneSignal.init({
              appId: "8736bcd3-452e-4b06-a3c1-0363071f1254",
              allowLocalhostAsSecureOrigin: true
            });

            console.log("OneSignal جاهز بالكامل");
          });
        `}
      </Script>
    </>
  );
} 
