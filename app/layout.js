import './globals.css'
import OneSignalInit from "@/components/onesignal/OneSignalInit";

export const metadata = {
  metadataBase: new URL("https://md-marketplace-seven.vercel.app/"),
    
  title: "MD-Marketplace | One App For Everything",
  description: "One App For Everything",

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

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/logo.png",
  },

  openGraph: {
    title: "MD-Marketplace",
    description: "One App For Everything",
    url: "https://md-marketplace-seven.vercel.app/",
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
        <OneSignalInit />
        {children}
      </body>
    </html>
  );
}
