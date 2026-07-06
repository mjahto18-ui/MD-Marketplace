import './globals.css'

export const metadata = {
  title: 'MD Marketplace',
  description: 'MD Marketplace SA',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  )
}