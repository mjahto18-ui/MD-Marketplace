import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata = {
  title: 'MD Marketplace',
  description: 'متجر الكتروني',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
}
