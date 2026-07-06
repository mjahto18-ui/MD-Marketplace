import './globals.css'

export const metadata = {
  title: 'MD-Marketplace',
  description: 'متجر إلكتروني للتوصيل',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-gray-100">{children}</body>
    </html>
  )
}
