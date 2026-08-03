import './globals.css'
import OneSignalInit from "@/components/onesignal/OneSignalInit";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Script from 'next/script';

export const metadata = {
  metadataBase: new URL("https://www.md-marketplace.store"),
    
  title: "MD-Marketplace | One App For Everything",
  description: "MD Marketplace - أول موقع شامل بلبنان: تسوق سوبرماركت، خضرة، لحمة، البسة، وتوصيل سريع لكل مناطق طرابلس ولبنان. محفظة إلكترونية، جوائز، تتبع مباشر للطلبات.",
  applicationName: "MD-Marketplace",
  keywords: [
    "MD Marketplace",
    "Marketplace",
    "Delivery",
    "Lebanon",
    "Tripoli",
    "Wallet",
    "Rewards",
    "Tracking"
  ],
  openGraph: {
    title: "MD-Marketplace",
    description: "One App For Everything",
    url: "https://www.md-marketplace.store/",
    siteName: "MD-Marketplace",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "MD-Marketplace Logo",
      },
    ],
    locale: "ar_LB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MD-Marketplace",
    description: "One App For Everything",
    images: ["/logo.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        {/* Facebook Pixel */}
        <Script
          id="fb-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1581515696921021');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=1581515696921021&ev=PageView&noscript=1"
          />
        </noscript>

        {/* TikTok Pixel */}
        <Script
          id="tiktok-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function (w, d, t) {
                w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat([].slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
                ttq.load('D9LOH83C77U6U4S4M29G');
                ttq.page();
              }(window, document, 'ttq');
            `,
          }}
        />

        <OneSignalInit />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
