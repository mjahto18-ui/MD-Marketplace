import './globals.css'
import OneSignalInit from "@/components/onesignal/OneSignalInit";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Script from 'next/script';
import AddToHomeBanner from "@/components/pwa/AddToHomeBanner";

export const metadata = {
  metadataBase: new URL("https://www.md-marketplace.store"),

  title: {
    default: "MD-Group | منظومة الخدمات الرقمية المتكاملة في لبنان (Marketplace, Taxi, Delivery, SaaS)",
    template: "%s | MD-Group",
  },

  description: "مجموعة MD-Group: المنظومة الرقمية الشاملة في لبنان. تضم MD-Marketplace للتسوق، MD-Taxi للنقل الآمن، توصيل سريع 25 دقيقة، شحن Express لكل لبنان، طلبات خاصة، وأنظمة إدارة الدوام والرواتب للمتاجر.",

  applicationName: "MD-Group",

  keywords: [
    "MD Group",
    "MD Marketplace",
    "MD Taxi",
    "توصيل طرابلس",
    "توصيل لبنان",
    "سوبرماركت اونلاين لبنان",
    "تاكسي طرابلس",
    "نظام دوام ورواتب",
    "شحن طرود لبنان",
    "Tripoli Lebanon Delivery",
    "Super App Lebanon"
  ],

  openGraph: {
    title: "MD-Group | منظومة الخدمات الرقمية المتكاملة",
    description: "8 خدمات في منصة واحدة: تسوق، تاكسي، توصيل سريع، شحن لكل لبنان، طلبات خاصة، وحلول إدارة المتاجر والموظفين.",
    url: "https://www.md-marketplace.store/",
    siteName: "MD-Group",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "MD-Group Logo",
      },
    ],
    locale: "ar_LB",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "MD-Group | One Ecosystem For Everything",
    description: "منظومة الخدمات الرقمية المتكاملة في طرابلس وكل لبنان: تسوق، نقل، شحن، وإدارة أعمال.",
    images: ["/logo.png"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },

  alternates: {
    canonical: "https://www.md-marketplace.store/",
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
                w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat([].slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
                ttq.load('D9LOH83C77U6U4S4M29G');
                ttq.page();
              }(window, document, 'ttq');
            `,
          }}
        />

        <OneSignalInit /> 
        {children}
          <AddToHomeBanner />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
