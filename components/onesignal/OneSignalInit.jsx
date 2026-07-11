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
              appId: "0d1cbaba-00fa-4760-abe5-edd497603667",
              allowLocalhostAsSecureOrigin: true
            });

            console.log("OneSignal جاهز بالكامل");
          });
        `}
      </Script>
    </>
  );
}
