iimport './globals.css'

export const metadata = {
  title: 'MD-Marketplace',
  description: 'متجر إلكتروني للتوصيل',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-gray-100">{children}</body>
    </html>
  )
}

