import './globals.css'

export const metadata = {
  title: 'MD Marketplace',
  description: 'One App For Everything',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  )
}