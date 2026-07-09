import "./globals.css";
import Script from "next/script";
import OneSignalInit from "@/components/OneSignalInit";

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>

        <Script 
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
          strategy="afterInteractive"
        />

        <OneSignalInit />

        {children}
      </body>
    </html>
  );
}
